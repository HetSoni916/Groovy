import os
import subprocess
import tempfile
import logging
from pathlib import Path

import cv2
import numpy as np

from app.config import settings

logger = logging.getLogger(__name__)


class RenderingService:
    def __init__(self):
        self.output_dir = Path(settings.STORAGE_OUTPUT_DIR)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.temp_dir = Path(settings.STORAGE_TEMP_DIR)
        self.temp_dir.mkdir(parents=True, exist_ok=True)

    def render_video(
        self,
        clips: list[dict],
        transitions: list[dict],
        music: dict | None,
        output_filename: str,
        progress_callback=None,
    ) -> str:
        output_path = str(self.output_dir / output_filename)

        try:
            self._render_with_ffmpeg(clips, transitions, music, output_path, progress_callback)
        except Exception as e:
            if os.path.exists(output_path) and os.path.getsize(output_path) == 0:
                os.remove(output_path)
            raise RuntimeError(f"Video rendering failed: {e}")

        if os.path.exists(output_path) and os.path.getsize(output_path) == 0:
            os.remove(output_path)
            raise RuntimeError("Video rendering produced empty output file")

        return output_path

    def _render_with_ffmpeg(
        self,
        clips: list[dict],
        transitions: list[dict],
        music: dict | None,
        output_path: str,
        progress_callback=None,
    ):
        valid_clips = []
        for clip in clips:
            clip_path = clip.get("local_path", "")
            if clip_path and os.path.exists(clip_path):
                valid_clips.append(clip)

        if not valid_clips:
            raise RuntimeError("No valid video clips found for rendering")

        normalized_clips = []
        for i, clip in enumerate(valid_clips):
            clip_path = clip.get("local_path", "")
            norm_path = os.path.join(self.temp_dir, f"norm_{i}.mp4")
            clip_duration = clip.get("selected_duration", clip.get("duration", 5))

            raw_duration = clip.get("duration", 0)
            if raw_duration > 0 and clip_duration > raw_duration:
                clip_duration = min(clip_duration, raw_duration)
            start_time = 0
            if raw_duration > clip_duration + 5:
                start_time = max(0, (raw_duration - clip_duration) / 4)

            cmd = [
                "ffmpeg", "-y",
                "-ss", str(start_time),
                "-i", clip_path,
                "-t", str(clip_duration),
                "-c:v", "libx264",
                "-preset", "fast",
                "-crf", "22",
                "-c:a", "aac",
                "-b:a", "128k",
                "-vf", "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=30",
                "-ar", "44100",
                "-r", "30",
                "-movflags", "+faststart",
                norm_path,
            ]
            
            if progress_callback:
                progress_callback(f"Normalizing clip {i+1}/{len(valid_clips)}")
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=3600)
            if result.returncode != 0:
                stderr_lines = result.stderr.strip().split('\n')
                actual_error = '\n'.join(stderr_lines[-10:]) if len(stderr_lines) > 10 else result.stderr
                logger.error(f"FFmpeg normalize error for clip {i}: {actual_error}")
                raise RuntimeError(f"FFmpeg normalize error for clip {i}: {actual_error}")

            if not os.path.exists(norm_path) or os.path.getsize(norm_path) == 0:
                raise RuntimeError(f"Normalized clip {i} was not created or is empty")
            
            normalized_clips.append({**clip, "local_path": norm_path})

        concat_file = self._create_concat_file(normalized_clips)

        has_audio = self._concat_has_audio(normalized_clips)

        if has_audio:
            simple_cmd = [
                "ffmpeg", "-y",
                "-f", "concat",
                "-safe", "0",
                "-i", concat_file,
            ]
            if music and "path" in music and os.path.exists(music["path"]):
                simple_cmd.extend([
                    "-i", music["path"],
                    "-filter_complex",
                    "[0:a]volume=1.0[a1];[1:a]volume=0.3[a2];[a1][a2]amix=inputs=2:duration=first",
                    "-c:v", "libx264",
                    "-preset", "medium",
                    "-crf", "22",
                    "-c:a", "aac",
                    "-shortest",
                    output_path,
                ])
            else:
                simple_cmd.extend([
                    "-c:v", "libx264",
                    "-preset", "medium",
                    "-crf", "22",
                    "-c:a", "aac",
                    output_path,
                ])
        else:
            if music and "path" in music and os.path.exists(music["path"]):
                simple_cmd = [
                    "ffmpeg", "-y",
                    "-f", "concat",
                    "-safe", "0",
                    "-i", concat_file,
                    "-i", music["path"],
                    "-c:v", "libx264",
                    "-preset", "medium",
                    "-crf", "22",
                    "-map", "0:v",
                    "-map", "1:a",
                    "-c:a", "aac",
                    "-shortest",
                    output_path,
                ]
            else:
                simple_cmd = [
                    "ffmpeg", "-y",
                    "-f", "concat",
                    "-safe", "0",
                    "-i", concat_file,
                    "-c:v", "libx264",
                    "-preset", "medium",
                    "-crf", "22",
                    output_path,
                ]

        if progress_callback:
            progress_callback("Rendering final video with FFmpeg")

        result = subprocess.run(
            simple_cmd,
            capture_output=True,
            text=True,
            timeout=3600,
        )

        if result.returncode != 0:
            stderr_lines = result.stderr.strip().split('\n')
            actual_error = '\n'.join(stderr_lines[-20:]) if len(stderr_lines) > 20 else result.stderr
            logger.error(f"FFmpeg concat error: {actual_error}")
            raise RuntimeError(f"FFmpeg concat error: {actual_error}")

        if progress_callback:
            progress_callback("Video rendering complete")

    def _create_concat_file(self, clips: list[dict]) -> str:
        concat_path = os.path.join(self.temp_dir, "concat_list.txt")
        with open(concat_path, "w", encoding="utf-8") as f:
            for clip in clips:
                clip_path = clip.get("local_path", "")
                if clip_path and os.path.exists(clip_path):
                    duration = clip.get("selected_duration", clip.get("duration", 5))
                    ffmpeg_path = clip_path.replace("\\", "/")
                    f.write(f"file '{ffmpeg_path}'\n")
                    f.write(f"duration {duration}\n")
            if clips:
                last_path = clips[-1].get("local_path", "")
                if last_path and os.path.exists(last_path):
                    f.write(f"file '{last_path.replace(chr(92), '/')}'\n")
        return concat_path

    def _concat_has_audio(self, clips: list[dict]) -> bool:
        for clip in clips:
            clip_path = clip.get("local_path", "")
            if clip_path and os.path.exists(clip_path):
                try:
                    probe = subprocess.run(
                        ["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=codec_type", "-of", "csv=p=0", clip_path],
                        capture_output=True, text=True, timeout=10,
                    )
                    if probe.stdout.strip():
                        return True
                except Exception:
                    pass
        return False

    def _map_transition(self, trans_type: str) -> str:
        mapping = {
            "crossfade": "fade",
            "fade": "fadeblack",
            "slide": "slideright",
            "zoom": "fade",
            "motionblur": "fade",
        }
        return mapping.get(trans_type, "fade")

    def add_transitions_to_video(self, input_path: str, transitions: list[dict], output_path: str):
        cmd = [
            "ffmpeg", "-y",
            "-i", input_path,
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", "22",
            "-c:a", "aac",
            "-b:a", "192k",
            output_path,
        ]
        subprocess.run(cmd, capture_output=True, text=True, timeout=3600)

    def add_music_to_video(self, video_path: str, music_path: str, output_path: str, volume: float = 0.3):
        cmd = [
            "ffmpeg", "-y",
            "-i", video_path,
            "-i", music_path,
            "-filter_complex",
            f"[1:a]volume={volume}[music];[0:a][music]amix=inputs=2:duration=first:weights=1 0.3",
            "-c:v", "copy",
            "-c:a", "aac",
            "-b:a", "192k",
            "-shortest",
            output_path,
        ]
        subprocess.run(cmd, capture_output=True, text=True, timeout=3600)

    def cleanup_temp_files(self, temp_dir: str):
        import shutil
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)
