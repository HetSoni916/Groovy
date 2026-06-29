import os
import json
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user, hash_password, verify_password, create_access_token
from app.models.user import User
from app.models.project import Project
from app.models.clip import Clip
from app.schemas.user import UserCreate, UserResponse, Token, LoginRequest
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectStatus, DropboxLinkUpload
from app.schemas.clip import ClipResponse, AnalyzeResponse
from app.schemas.video import GenerateVideoRequest, GenerateVideoResponse
from app.services.dropbox_service import dropbox_service
from app.services.analysis_service import analysis_service
from app.services.editing_service import editing_service
from app.services.rendering_service import rendering_service
from app.services.music_service import music_service
from app.services.storage_service import storage_service
from app.services.groq_service import groq_service

router = APIRouter()


@router.post("/auth/register", response_model=UserResponse)
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = User(name=user.name, email=user.email, hashed_password=hash_password(user.password))
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user


@router.post("/auth/login", response_model=Token)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id)})
    return Token(access_token=token)


@router.post("/create-project", response_model=ProjectResponse)
async def create_project(
    data: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = Project(user_id=current_user.id, dropbox_link=data.dropbox_link, status="pending")
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project


@router.post("/upload-dropbox-link", response_model=ProjectStatus)
async def upload_dropbox_link(
    data: DropboxLinkUpload,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Project).where(Project.id == data.project_id, Project.user_id == current_user.id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    valid = await dropbox_service.validate_link(data.url)
    if not valid:
        raise HTTPException(status_code=400, detail="Invalid or inaccessible Dropbox link")

    project.dropbox_link = data.url
    project.status = "connected"
    await db.commit()

    return ProjectStatus(
        project_id=project.id,
        status=project.status,
        progress=0.0,
        current_step="dropbox_connected",
        message="Dropbox folder connected successfully",
    )


@router.post("/analyze-clips", response_model=AnalyzeResponse)
async def analyze_clips(
    data: DropboxLinkUpload,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Project).where(Project.id == data.project_id, Project.user_id == current_user.id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.status = "downloading"
    await db.commit()

    try:
        videos = await dropbox_service.list_videos(data.url)
        if not videos:
            raise HTTPException(status_code=400, detail="No video files found in Dropbox folder")

        clips_path = storage_service.get_clips_path(project.id)
        downloaded_paths = await dropbox_service.download_all_videos(videos, clips_path)

        project.status = "analyzing"
        project.progress = 30.0
        await db.commit()

        analyses = await analysis_service.analyze_all(downloaded_paths)
        clip_responses = []

        for i, (video, analysis) in enumerate(zip(videos, analyses)):
            metadata_dict = {
                "clip": analysis.clip,
                "type": analysis.type,
                "scene": analysis.scene,
                "quality": analysis.quality,
                "emotion": analysis.emotion,
                "best_segments": analysis.best_segments,
                "duration": analysis.duration,
                "resolution": list(analysis.resolution),
                "fps": analysis.fps,
                "has_faces": analysis.has_faces,
                "is_indoor": analysis.is_indoor,
                "objects": analysis.objects,
                "brightness": analysis.brightness,
                "motion": analysis.motion,
            }
            db_clip = Clip(
                project_id=project.id,
                filename=video["name"],
                file_path=downloaded_paths[i],
                duration=analysis.duration,
                width=analysis.resolution[0],
                height=analysis.resolution[1],
                fps=analysis.fps,
                quality_score=analysis.quality,
                metadata=json.dumps(metadata_dict),
            )
            db.add(db_clip)
            clip_responses.append(ClipResponse(
                id=0,
                project_id=project.id,
                filename=db_clip.filename,
                duration=db_clip.duration,
                width=db_clip.width,
                height=db_clip.height,
                fps=db_clip.fps,
                quality_score=db_clip.quality_score,
                metadata=metadata_dict,
                created_at=db_clip.created_at,
            ))

        project.status = "analyzed"
        project.progress = 60.0
        await db.commit()

        return AnalyzeResponse(project_id=project.id, clips=clip_responses, message="Analysis complete")

    except Exception as e:
        project.status = "failed"
        await db.commit()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/generate-video", response_model=GenerateVideoResponse)
async def generate_video(
    data: GenerateVideoRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Project).where(Project.id == data.project_id, Project.user_id == current_user.id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    clips_result = await db.execute(select(Clip).where(Clip.project_id == project.id))
    clips = clips_result.scalars().all()

    if not clips:
        raise HTTPException(status_code=400, detail="No analyzed clips found. Run analysis first.")

    analyses = []
    for c in clips:
        meta = json.loads(c.clip_metadata) if c.clip_metadata else {}
        from app.services.analysis_service import ClipAnalysis
        analyses.append(ClipAnalysis(
            clip=c.filename,
            type=meta.get("type", "unknown"),
            scene=meta.get("scene", "unknown"),
            quality=meta.get("quality", 0.0),
            emotion=meta.get("emotion", "neutral"),
            best_segments=meta.get("best_segments", []),
            duration=meta.get("duration", c.duration),
            resolution=tuple(meta.get("resolution", [c.width, c.height])),
            fps=meta.get("fps", c.fps),
            has_faces=meta.get("has_faces", False),
            is_indoor=meta.get("is_indoor", True),
            objects=meta.get("objects", []),
            brightness=meta.get("brightness", 128.0),
            motion=meta.get("motion", 0.0),
            scene_changes=meta.get("scene_changes", []),
        ))

    project.status = "editing"
    project.progress = 70.0
    await db.commit()

    try:
        story = await groq_service.generate_story(analyses)
        edit_plan = await editing_service.create_edit_plan(analyses, data.duration, story_override=story)

        project.status = "rendering"
        project.progress = 85.0
        await db.commit()

        video_paths = [c.file_path for c in clips]
        output_path = await rendering_service.render_video(
            edit_plan.decisions, video_paths, edit_plan
        )

        project.status = "completed"
        project.progress = 100.0
        project.final_video_url = output_path
        await db.commit()

        job_id = str(uuid.uuid4())
        return GenerateVideoResponse(project_id=project.id, job_id=job_id, message="Video generated successfully")

    except Exception as e:
        project.status = "failed"
        await db.commit()
        raise HTTPException(status_code=500, detail=f"Video generation failed: {str(e)}")


@router.get("/project-status/{project_id}", response_model=ProjectStatus)
async def get_project_status(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Project).where(Project.id == project_id, Project.user_id == current_user.id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    steps = {
        "pending": ("pending", "Waiting to start"),
        "connected": ("dropbox_connected", "Dropbox Connected"),
        "downloading": ("downloading", "Videos Downloaded"),
        "analyzing": ("analyzing", "AI Analyzing Scenes"),
        "analyzed": ("selecting", "Selecting Best Shots"),
        "editing": ("creating_story", "Creating Story"),
        "rendering": ("rendering", "Rendering Final Video"),
        "completed": ("completed", "Complete"),
        "failed": ("failed", "Failed"),
    }

    step, message = steps.get(project.status, ("unknown", "Unknown"))
    return ProjectStatus(
        project_id=project.id,
        status=project.status,
        progress=project.progress,
        current_step=step,
        message=message,
    )


@router.get("/download/{project_id}")
async def download_video(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Project).where(Project.id == project_id, Project.user_id == current_user.id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.status != "completed" or not project.final_video_url:
        raise HTTPException(status_code=400, detail="Video not ready yet")
    if not os.path.exists(project.final_video_url):
        raise HTTPException(status_code=404, detail="Video file not found")

    from fastapi.responses import FileResponse
    return FileResponse(project.final_video_url, media_type="video/mp4", filename="final_video.mp4")


@router.get("/projects", response_model=List[ProjectResponse])
async def list_projects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Project).where(Project.user_id == current_user.id).order_by(Project.created_at.desc())
    )
    projects = result.scalars().all()
    return projects


@router.get("/clips/{project_id}", response_model=List[ClipResponse])
async def list_clips(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Project).where(Project.id == project_id, Project.user_id == current_user.id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    clips_result = await db.execute(select(Clip).where(Clip.project_id == project_id))
    clips = clips_result.scalars().all()

    responses = []
    for c in clips:
        meta = json.loads(c.clip_metadata) if c.clip_metadata else None
        responses.append(ClipResponse(
            id=c.id,
            project_id=c.project_id,
            filename=c.filename,
            duration=c.duration,
            width=c.width,
            height=c.height,
            fps=c.fps,
            quality_score=c.quality_score,
            metadata=meta,
            created_at=c.created_at,
        ))
    return responses


@router.get("/download-file")
async def download_file(path: str):
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")
    from fastapi.responses import FileResponse
    return FileResponse(path)
