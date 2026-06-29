import os
import shutil
import tempfile
import uuid
from pathlib import Path

from app.config import settings


class StorageService:
    def __init__(self):
        self.local_storage = Path(settings.STORAGE_LOCAL_PATH)
        self.temp_dir = Path(settings.STORAGE_TEMP_DIR)
        self.output_dir = Path(settings.STORAGE_OUTPUT_DIR)
        self._ensure_dirs()

    def _ensure_dirs(self):
        self.local_storage.mkdir(parents=True, exist_ok=True)
        self.temp_dir.mkdir(parents=True, exist_ok=True)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def create_temp_workspace(self, project_id: str) -> str:
        workspace = self.temp_dir / project_id
        workspace.mkdir(parents=True, exist_ok=True)
        return str(workspace)

    def get_output_path(self, filename: str) -> str:
        return str(self.output_dir / filename)

    def save_file(self, source_path: str, destination_dir: str) -> str:
        dest = Path(destination_dir) / Path(source_path).name
        shutil.copy2(source_path, str(dest))
        return str(dest)

    def file_exists(self, path: str) -> bool:
        return os.path.exists(path)

    def get_file_size(self, path: str) -> int:
        return os.path.getsize(path) if os.path.exists(path) else 0

    def generate_output_filename(self, project_id: str, extension: str = ".mp4") -> str:
        return f"{project_id}_{uuid.uuid4().hex[:8]}{extension}"

    def cleanup(self, path: str):
        if os.path.isfile(path):
            os.remove(path)
        elif os.path.isdir(path):
            shutil.rmtree(path, ignore_errors=True)

    def get_video_url(self, filename: str) -> str:
        return f"/api/download/{filename}"
