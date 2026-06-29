import os
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.config import settings

router = APIRouter(prefix="/api", tags=["videos"])


@router.get("/download/{filename}")
async def download_video(filename: str):
    output_dir = Path(settings.STORAGE_OUTPUT_DIR)
    file_path = output_dir / filename

    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Video not found")

    return FileResponse(
        path=str(file_path),
        media_type="video/mp4",
        filename=filename,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/preview/{filename}")
async def preview_video(filename: str):
    output_dir = Path(settings.STORAGE_OUTPUT_DIR)
    file_path = output_dir / filename

    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Video not found")

    return FileResponse(
        path=str(file_path),
        media_type="video/mp4",
    )
