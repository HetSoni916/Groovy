import os
import logging
import threading
import traceback
from pathlib import Path

from app.config import settings
from app.database import SyncSession
from app.models.clip import Clip
from app.models.project import Project
from app.services.enhanced_analysis_service import EnhancedVideoAnalyzer
from app.services.dropbox_service import DropboxService
from app.services.editing_service import AIEditingAgent
from app.services.music_service import MusicService
from app.services.rendering_service import RenderingService
from app.services.storage_service import StorageService

logger = logging.getLogger(__name__)

PROCESSING_STEPS = [
    "Videos Ready",
    "AI Analyzing Scenes",
    "Selecting Best Shots",
    "Creating Story",
    "Adding Transitions",
    "Syncing Music",
    "Rendering Final Video",
]

ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm"}


def _update_progress(db: SyncSession, project: Project, progress: float, step: str):
    try:
        project.progress = round(progress, 2)
        project.status = "processing"
        project.error_message = None
        db.commit()
        logger.info(f"[{project.id}] {step} ({int(progress * 100)}%)")
    except Exception as e:
        logger.warning(f"Failed to update progress: {e}")
        try:
            db.rollback()
        except Exception:
            pass


def _run_processing_sync(project_id: str):
    """Synchronous entry point run in a background thread."""
    db = SyncSession()
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            logger.error(f"Project {project_id} not found")
            return

        has_dropbox = bool(project.dropbox_link)
        if has_dropbox:
            _process_project(project_id, project, db)
        else:
            _process_local_project(project_id, project, db)
    except Exception as e:
        tb = traceback.format_exc()
        logger.error(f"Processing failed for {project_id}: {e}\n{tb}")
        try:
            project = db.query(Project).filter(Project.id == project_id).first()
            if project:
                project.status = "failed"
                project.error_message = str(e)[:2000]
                db.commit()
        except Exception:
            logger.exception(f"Failed to update error status for {project_id}")
    finally:
        try:
            db.close()
        except Exception:
            pass


def _process_local_project(project_id: str, project: Project, db: SyncSession):
    analyzer = EnhancedVideoAnalyzer()
    editor = AIEditingAgent()
    music_service = MusicService()
    renderer = RenderingService()
    storage = StorageService()

    workspace = storage.create_temp_workspace(project_id)

    for old_file in Path(workspace).glob("norm_*.mp4"):
        try:
            old_file.unlink()
        except Exception:
            pass
    for old_file in Path(workspace).glob("concat_list.txt"):
        try:
            old_file.unlink()
        except Exception:
            pass

    _update_progress(db, project, 0.05, PROCESSING_STEPS[0])

    video_files = []
    for f in os.listdir(workspace):
        if Path(f).suffix.lower() in ALLOWED_EXTENSIONS:
            video_files.append(os.path.join(workspace, f))

    if not video_files:
        project.status = "failed"
        project.error_message = "No video files found in workspace"
        db.commit()
        return

    _update_progress(db, project, 0.10, "Found {} video files".format(len(video_files)))

    clips_metadata = []
    total = len(video_files)
    analysis_start_range = 0.10
    analysis_end_range = 0.45

    for i, video_path in enumerate(video_files):
        progress = analysis_start_range + ((i / total) * (analysis_end_range - analysis_start_range))
        _update_progress(db, project, progress, f"Analyzing clip {i+1}/{total}: {Path(video_path).name}")
        try:
            logger.info(f"[{project_id}] Analyzing clip {i+1}/{total}: {Path(video_path).name}")
            metadata = analyzer.analyze(video_path)
            metadata["local_path"] = video_path
            clips_metadata.append(metadata)

            clip = Clip(
                project_id=project.id,
                filename=Path(video_path).name,
                duration=metadata["duration"],
                width=metadata["width"],
                height=metadata["height"],
                fps=metadata["fps"],
                quality_score=metadata["quality_score"],
                file_size=storage.get_file_size(video_path),
                clip_metadata=metadata,
            )
            db.add(clip)
            db.commit()
        except Exception as e:
            logger.warning(f"Failed to analyze {video_path}: {e}")
            continue

    if not clips_metadata:
        project.status = "failed"
        project.error_message = "Failed to analyze any video clips"
        db.commit()
        return

    _update_progress(db, project, 0.45, PROCESSING_STEPS[2])

    edit_plan = editor.plan_edit(clips_metadata)

    _update_progress(db, project, 0.55, PROCESSING_STEPS[3])

    _update_progress(db, project, 0.65, PROCESSING_STEPS[4])

    music_track = music_service.select_music(edit_plan["music_mood"])

    _update_progress(db, project, 0.75, PROCESSING_STEPS[5])

    output_filename = storage.generate_output_filename(project_id)
    renderer.render_video(
        clips=edit_plan["selected_clips"],
        transitions=edit_plan["transitions"],
        music=music_track,
        output_filename=output_filename,
    )

    project.status = "completed"
    project.progress = 1.0
    project.final_video_url = f"/api/download/{output_filename}"
    db.commit()

    storage.cleanup(workspace)


def _process_project(project_id: str, project: Project, db: SyncSession):
    dropbox_service = DropboxService()
    analyzer = EnhancedVideoAnalyzer()
    editor = AIEditingAgent()
    music_service = MusicService()
    renderer = RenderingService()
    storage = StorageService()

    workspace = storage.create_temp_workspace(project_id)

    for old_file in Path(workspace).glob("norm_*.mp4"):
        try:
            old_file.unlink()
        except Exception:
            pass
    for old_file in Path(workspace).glob("concat_list.txt"):
        try:
            old_file.unlink()
        except Exception:
            pass

    _update_progress(db, project, 0.05, PROCESSING_STEPS[0])

    if not project.dropbox_link:
        _process_local_project(project_id, project, db)
        return

    validation = dropbox_service.validate_access(project.dropbox_link)
    if not validation.get("valid"):
        project.status = "failed"
        project.error_message = validation.get("error", "Invalid Dropbox link")
        db.commit()
        return

    _update_progress(db, project, 0.15, "Downloading clips from Dropbox")

    downloaded = dropbox_service.download_all_videos(project.dropbox_link, workspace)
    if not downloaded:
        project.status = "failed"
        project.error_message = "No supported video files found in the Dropbox folder"
        db.commit()
        return

    clips_metadata = []
    total = len(downloaded)
    analysis_start_range = 0.20
    analysis_end_range = 0.45

    for i, video_path in enumerate(downloaded):
        progress = analysis_start_range + ((i / total) * (analysis_end_range - analysis_start_range))
        _update_progress(db, project, progress, f"Analyzing clip {i+1}/{total}: {Path(video_path).name}")
        try:
            logger.info(f"[{project_id}] Analyzing clip {i+1}/{total}: {Path(video_path).name}")
            metadata = analyzer.analyze(video_path)
            metadata["local_path"] = video_path
            clips_metadata.append(metadata)

            clip = Clip(
                project_id=project.id,
                filename=Path(video_path).name,
                duration=metadata["duration"],
                width=metadata["width"],
                height=metadata["height"],
                fps=metadata["fps"],
                quality_score=metadata["quality_score"],
                file_size=storage.get_file_size(video_path),
                clip_metadata=metadata,
            )
            db.add(clip)
            db.commit()
        except Exception as e:
            logger.warning(f"Failed to analyze {video_path}: {e}")
            continue

    if not clips_metadata:
        project.status = "failed"
        project.error_message = "Failed to analyze any video clips"
        db.commit()
        return

    _update_progress(db, project, 0.45, PROCESSING_STEPS[2])

    edit_plan = editor.plan_edit(clips_metadata)

    _update_progress(db, project, 0.55, PROCESSING_STEPS[3])

    _update_progress(db, project, 0.65, PROCESSING_STEPS[4])

    music_track = music_service.select_music(edit_plan["music_mood"])

    _update_progress(db, project, 0.75, PROCESSING_STEPS[5])

    output_filename = storage.generate_output_filename(project_id)
    renderer.render_video(
        clips=edit_plan["selected_clips"],
        transitions=edit_plan["transitions"],
        music=music_track,
        output_filename=output_filename,
    )

    project.status = "completed"
    project.progress = 1.0
    project.final_video_url = f"/api/download/{output_filename}"
    db.commit()

    storage.cleanup(workspace)


def start_processing(project_id: str):
    """Start processing in a background thread. Non-blocking."""
    thread = threading.Thread(
        target=_run_processing_sync,
        args=(project_id,),
        daemon=True,
        name=f"video-processing-{project_id[:8]}",
    )
    thread.start()
    logger.info(f"Started processing thread for {project_id}")
    return thread


async def run_processing(project_id: str):
    """Alternative entry point using executor (for backward compat)."""
    import asyncio
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, lambda: asyncio.run(_run_processing_sync(project_id)))


def start_prompt_processing(project_id: str, prompt_criteria: dict, raw_prompt: str = ""):
    """Start video processing with prompt-based criteria."""
    thread = threading.Thread(
        target=_run_prompt_processing_sync,
        args=(project_id, prompt_criteria, raw_prompt),
        daemon=True,
    )
    thread.start()


def _run_prompt_processing_sync(project_id: str, prompt_criteria: dict, raw_prompt: str = ""):
    db = SyncSession()
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            logger.error(f"Project {project_id} not found")
            return
        _run_prompt_processing(project_id, project, db, prompt_criteria, raw_prompt)
    except Exception as e:
        logger.error(f"Prompt processing failed: {e}\n{traceback.format_exc()}")
        try:
            project = db.query(Project).filter(Project.id == project_id).first()
            if project:
                project.status = "failed"
                project.error_message = str(e)
                db.commit()
        except Exception:
            pass
    finally:
        db.close()


def _run_prompt_processing(project_id: str, project: Project, db: SyncSession, prompt_criteria: dict, raw_prompt: str = ""):
    storage = StorageService()
    workspace = storage.create_temp_workspace(project_id)
    logger.info(f"[{project_id}] Starting prompt processing in {workspace}")

    _update_progress(db, project, 0.05, "Analyzing prompt...")

    clips_dir = Path(workspace) / "clips"
    use_stock = False
    video_files = []

    if clips_dir.exists():
        for f in os.listdir(clips_dir):
            if Path(f).suffix.lower() in ALLOWED_EXTENSIONS:
                video_files.append(str(clips_dir / f))

    if not video_files:
        use_stock = True
        from app.services.stock_service import StockFootageService
        stock_service = StockFootageService()

        _update_progress(db, project, 0.10, "Selecting stock footage for your prompt...")
        matching_clips = stock_service.find_matching_clips(raw_prompt, count=6)
        clips_metadata = stock_service.prepare_clips_for_editing(matching_clips)
        video_files = [c["file_path"] for c in clips_metadata]
    else:
        from app.services.enhanced_analysis_service import EnhancedVideoAnalyzer
        analyzer = EnhancedVideoAnalyzer()
        clips_metadata = []
        total = len(video_files)

        for i, video_file in enumerate(video_files):
            progress = 0.15 + (i / total) * 0.30
            _update_progress(db, project, progress, f"Analyzing clip {i+1}/{total}...")
            try:
                metadata = analyzer.analyze_video(video_file)
                clips_metadata.append(metadata)
            except Exception as e:
                logger.warning(f"Failed to analyze {video_file}: {e}")

        norm_dir = Path(workspace) / "normalized"
        norm_dir.mkdir(exist_ok=True)
        _update_progress(db, project, 0.45, "Normalizing clips...")

        normalized_files = []
        for vf in video_files:
            norm_name = f"norm_{Path(vf).name}"
            norm_path = str(norm_dir / norm_name)
            if not os.path.exists(norm_path):
                import subprocess
                cmd = ["ffmpeg", "-y", "-i", vf, "-vf", "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2", "-c:v", "libx264", "-preset", "fast", "-crf", "23", "-an", norm_path]
                subprocess.run(cmd, capture_output=True, timeout=120)
            normalized_files.append(norm_path)

        for idx, norm_file in enumerate(normalized_files):
            if idx < len(clips_metadata):
                clips_metadata[idx]["file_path"] = norm_file
                clips_metadata[idx]["filename"] = os.path.basename(norm_file)

    editing = AIEditingAgent()
    _update_progress(db, project, 0.45, "AI selecting clips based on your prompt...")
    edit_plan = editing.plan_edit(clips_metadata, prompt_criteria=prompt_criteria)

    music_track = None
    music_service = MusicService()
    try:
        music_track = music_service.select_music(edit_plan["music_mood"])
        _update_progress(db, project, 0.55, "Music track selected")
    except Exception as e:
        logger.warning(f"Music selection failed: {e}")

    _update_progress(db, project, 0.65, "Rendering final video...")
    output_filename = storage.generate_output_filename(project_id)
    logger.info(f"[{project_id}] Rendering to {output_filename} with {len(edit_plan['selected_clips'])} clips")

    rendering = RenderingService()
    try:
        rendering.render_video(
            clips=edit_plan["selected_clips"],
            transitions=edit_plan["transitions"],
            music=music_track,
            output_filename=output_filename,
            progress_callback=lambda msg: _update_progress(db, project, 0.75, msg),
        )
    except Exception as e:
        logger.error(f"Rendering failed: {e}")
        project.status = "failed"
        project.error_message = f"Rendering failed: {str(e)}"
        db.commit()
        return

    final_url = f"/api/download/{output_filename}"

    project.status = "completed"
    project.progress = 1.0
    project.final_video_url = final_url
    db.commit()
    logger.info(f"[{project_id}] Prompt processing completed!")
