import os
import json
import asyncio
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "video_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)


@celery_app.task(bind=True, max_retries=3)
def process_video_project(self, project_id: int, dropbox_url: str):
    from app.services.dropbox_service import dropbox_service
    from app.services.analysis_service import analysis_service
    from app.services.editing_service import editing_service
    from app.services.rendering_service import rendering_service
    from app.services.storage_service import storage_service

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        self.update_state(state="DOWNLOADING", meta={"progress": 10, "step": "Downloading clips from Dropbox"})

        videos = loop.run_until_complete(dropbox_service.list_videos(dropbox_url))
        clips_path = storage_service.get_clips_path(project_id)
        downloaded = loop.run_until_complete(dropbox_service.download_all_videos(videos, clips_path))

        self.update_state(state="ANALYZING", meta={"progress": 35, "step": "Analyzing video clips with AI"})

        analyses = loop.run_until_complete(analysis_service.analyze_all(downloaded))

        self.update_state(state="EDITING", meta={"progress": 60, "step": "Creating edit plan"})

        edit_plan = loop.run_until_complete(editing_service.create_edit_plan(analyses))

        self.update_state(state="RENDERING", meta={"progress": 80, "step": "Rendering final video"})

        video_paths = downloaded

        output_path = loop.run_until_complete(rendering_service.render_video(
            edit_plan.decisions, video_paths, edit_plan
        ))

        return {
            "status": "SUCCESS",
            "output_path": output_path,
            "project_id": project_id,
            "duration": edit_plan.total_duration,
        }

    except Exception as e:
        self.retry(exc=e, countdown=60)
        return {"status": "FAILED", "error": str(e), "project_id": project_id}
    finally:
        loop.close()
