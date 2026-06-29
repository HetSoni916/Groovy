import os
import re
import zipfile
import io
from pathlib import Path

import httpx

from app.config import settings


class DropboxService:
    def __init__(self):
        self.supported_extensions = {".mp4", ".mov", ".avi", ".mkv", ".webm"}
        self._client = httpx.Client(timeout=300.0, follow_redirects=True)

    def list_video_files(self, dropbox_url: str) -> list[dict]:
        files = []

        try:
            resp = self._client.get(dropbox_url.rstrip("/") + "?dl=1", headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            })
            resp.raise_for_status()

            content_type = resp.headers.get("content-type", "")
            content_disp = resp.headers.get("content-disposition", "")

            # If it returned HTML, try scraping the page for file names
            if "text/html" in content_type or not resp.headers.get("content-type"):
                soup_links = re.findall(r'href="([^"]+\.(mp4|mov|avi|mkv|webm)[^"]*)"', resp.text, re.IGNORECASE)
                seen = set()
                for link, _ in soup_links:
                    name = Path(link.split("?")[0]).name
                    if name and name not in seen:
                        seen.add(name)
                        files.append({
                            "name": name,
                            "dropbox_url": dropbox_url,
                        })

                json_data = re.findall(r'"name"\s*:\s*"([^"]+\.(mp4|mov|avi|mkv|webm))"', resp.text, re.IGNORECASE)
                for name, _ in json_data:
                    if name not in seen:
                        seen.add(name)
                        files.append({
                            "name": name,
                            "dropbox_url": dropbox_url,
                        })

                return files

            # If it returned a zip, extract file listing from it
            if "zip" in content_type or ".zip" in content_disp:
                zf = zipfile.ZipFile(io.BytesIO(resp.content))
                for name in zf.namelist():
                    ext = Path(name).suffix.lower()
                    if ext in self.supported_extensions:
                        files.append({
                            "name": Path(name).name,
                            "zip_path": name,
                            "zip_data": resp.content,
                            "dropbox_url": dropbox_url,
                        })
                return files

        except httpx.HTTPError as e:
            raise ConnectionError(f"Failed to access Dropbox folder: {e}")

        return files

    def download_video(self, file_info: dict, destination: str) -> str:
        filename = file_info.get("name", "video.mp4")
        local_path = os.path.join(destination, filename)

        # If we have the zip data, extract from it
        zip_data = file_info.get("zip_data")
        zip_path = file_info.get("zip_path")
        if zip_data and zip_path:
            zf = zipfile.ZipFile(io.BytesIO(zip_data))
            with open(local_path, "wb") as f:
                f.write(zf.read(zip_path))
            return local_path

        # Otherwise try direct download
        dropbox_url = file_info.get("dropbox_url", "")
        dl_url = dropbox_url.rstrip("/") + f"/{filename}?dl=1"

        try:
            resp = self._client.get(dl_url)
            resp.raise_for_status()
            with open(local_path, "wb") as f:
                f.write(resp.content)
            return local_path
        except httpx.HTTPError:
            raise IOError(f"Failed to download {filename}")

    def download_all_videos(self, dropbox_url: str, temp_dir: str) -> list[str]:
        video_files = self.list_video_files(dropbox_url)
        downloaded = []

        # If no files found via listing, try full zip download
        if not video_files:
            try:
                self._download_folder_as_zip(dropbox_url, temp_dir, downloaded)
            except Exception as e:
                print(f"Warning: Zip download failed: {e}")
            return downloaded

        for vf in video_files:
            try:
                local_path = self.download_video(vf, temp_dir)
                downloaded.append(local_path)
            except IOError as e:
                print(f"Warning: Could not download {vf.get('name', 'unknown')}: {e}")
                continue

        return downloaded

    def _download_folder_as_zip(self, dropbox_url: str, temp_dir: str, downloaded: list):
        resp = self._client.get(dropbox_url.rstrip("/") + "?dl=1")
        resp.raise_for_status()

        zip_data = io.BytesIO(resp.content)
        with zipfile.ZipFile(zip_data) as zf:
            for name in zf.namelist():
                ext = Path(name).suffix.lower()
                if ext in self.supported_extensions:
                    local_path = os.path.join(temp_dir, Path(name).name)
                    with open(local_path, "wb") as f:
                        f.write(zf.read(name))
                    downloaded.append(local_path)

    def validate_access(self, dropbox_url: str) -> dict:
        try:
            files = self.list_video_files(dropbox_url)
            formats = list({Path(f["name"]).suffix.lower() for f in files})
            return {
                "valid": True,
                "file_count": len(files),
                "formats": formats,
                "files": [f["name"] for f in files],
            }
        except (ValueError, ConnectionError) as e:
            return {"valid": False, "error": str(e)}

    def close(self):
        self._client.close()
