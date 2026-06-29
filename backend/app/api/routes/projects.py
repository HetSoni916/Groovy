import os
import logging
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.project import Project
from app.models.user import User
from app.schemas.project import (
    CreateProjectRequest,
    ProjectResponse,
    ProjectStatusResponse,
    UploadDropboxLinkRequest,
    UploadFilesResponse,
    PromptRequest,
    PromptAnalysisResponse,
)
from app.api.deps import get_current_user, get_or_create_anon_user
from app.tasks.video_tasks import start_processing
from app.services.storage_service import StorageService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["projects"])

DEV_MODE = True
ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm"}


async def _get_user(db: AsyncSession) -> User:
    if DEV_MODE:
        return await get_or_create_anon_user(db)
    return await get_current_user(db)


@router.post("/create-project", response_model=ProjectResponse)
async def create_project(
    req: CreateProjectRequest,
    db: AsyncSession = Depends(get_db),
):
    user = await _get_user(db)
    project = Project(
        user_id=user.id,
        dropbox_link=req.dropbox_link,
        name=req.name or "Untitled",
        status="pending",
        progress=0.0,
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project


@router.post("/upload-files", response_model=UploadFilesResponse)
async def upload_files(
    project_id: str = Form(...),
    files: list[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
):
    user = await _get_user(db)
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == user.id,
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    storage = StorageService()
    workspace = storage.create_temp_workspace(str(project_id))
    saved_files = []

    for file in files:
        ext = Path(file.filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            continue

        dest_path = os.path.join(workspace, file.filename)
        content = await file.read()
        with open(dest_path, "wb") as f:
            f.write(content)
        saved_files.append(file.filename)

    if saved_files:
        project.status = "files_uploaded"

    await db.commit()
    return UploadFilesResponse(
        project_id=project_id,
        files=saved_files,
        count=len(saved_files),
    )


@router.post("/upload-dropbox-link", response_model=ProjectResponse)
async def upload_dropbox_link(
    req: UploadDropboxLinkRequest,
    db: AsyncSession = Depends(get_db),
):
    user = await _get_user(db)
    result = await db.execute(
        select(Project).where(
            Project.id == req.project_id,
            Project.user_id == user.id,
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.dropbox_link = req.dropbox_link
    project.status = "link_added"
    await db.commit()
    await db.refresh(project)
    return project


@router.post("/analyze-clips")
async def analyze_clips(
    project_id: str,
    db: AsyncSession = Depends(get_db),
):
    user = await _get_user(db)
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == user.id,
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    from app.services.analysis_service import VideoAnalyzer
    from app.services.storage_service import StorageService

    analyzer = VideoAnalyzer()
    storage = StorageService()

    workspace = storage.create_temp_workspace(str(project_id))
    video_files = [os.path.join(workspace, f) for f in os.listdir(workspace)
                   if Path(f).suffix.lower() in ALLOWED_EXTENSIONS]

    clips_metadata = []
    for video_path in video_files:
        metadata = analyzer.analyze(video_path)
        metadata["local_path"] = video_path
        clips_metadata.append(metadata)

    return {"clips": clips_metadata, "count": len(clips_metadata)}


@router.post("/generate-video", response_model=ProjectResponse)
async def generate_video(
    project_id: str,
    db: AsyncSession = Depends(get_db),
):
    user = await _get_user(db)
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == user.id,
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.status == "processing":
        project.status = "pending"
        project.progress = 0.0
        project.error_message = None
        await db.commit()
        await db.refresh(project)

    project.status = "processing"
    project.progress = 0.05
    await db.commit()
    await db.refresh(project)

    start_processing(project_id)
    return project


@router.get("/project-status/{project_id}", response_model=ProjectStatusResponse)
async def get_project_status(
    project_id: str,
    db: AsyncSession = Depends(get_db),
):
    user = await _get_user(db)
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.user_id == user.id,
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    steps = [
        "Videos Ready",
        "AI Analyzing Scenes",
        "Selecting Best Shots",
        "Creating Story",
        "Adding Transitions",
        "Syncing Music",
        "Rendering Final Video",
    ]
    current_step = None
    if project.progress > 0:
        step_idx = min(int(project.progress * len(steps)), len(steps) - 1)
        current_step = steps[step_idx]

    return ProjectStatusResponse(
        id=project.id,
        status=project.status,
        progress=project.progress,
        current_step=current_step,
        error_message=project.error_message,
    )


@router.get("/projects", response_model=list[ProjectResponse])
async def list_projects(
    db: AsyncSession = Depends(get_db),
):
    user = await _get_user(db)
    result = await db.execute(
        select(Project)
        .where(Project.user_id == user.id)
        .order_by(Project.created_at.desc())
    )
    projects = result.scalars().all()
    return projects


@router.post("/analyze-prompt", response_model=PromptAnalysisResponse)
async def analyze_prompt(req: PromptRequest):
    from app.services.prompt_service import PromptAnalysisService
    service = PromptAnalysisService()
    result = service.analyze_prompt(req.prompt)
    return PromptAnalysisResponse(
        mood=result.get("mood", "calm"),
        emotion=result.get("emotion", "neutral"),
        music_mood=result.get("music_mood", "ambient"),
        pacing=result.get("pacing", "medium"),
        description=result.get("description", ""),
        clip_count=result.get("clip_count", 5),
        scene_types=result.get("scene_types", []),
        content_preference=result.get("content_preference", "standard shot"),
    )


@router.post("/generate-from-prompt", response_model=ProjectResponse)
async def generate_from_prompt(
    req: PromptRequest,
    db: AsyncSession = Depends(get_db),
):
    user = await _get_user(db)
    project = Project(
        user_id=user.id,
        name=req.name or "AI Prompt Video",
        status="pending",
        progress=0.0,
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)

    from app.services.prompt_service import PromptAnalysisService
    prompt_service = PromptAnalysisService()
    prompt_criteria = prompt_service.analyze_prompt(req.prompt)

    project.status = "processing"
    project.progress = 0.05
    await db.commit()
    await db.refresh(project)

    from app.tasks.video_tasks import start_prompt_processing
    start_prompt_processing(str(project.id), prompt_criteria, raw_prompt=req.prompt)

    return project
