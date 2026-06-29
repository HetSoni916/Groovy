import os
import random
from pathlib import Path

from app.config import settings


class MusicService:
    def __init__(self):
        self.music_library = self._scan_music_library()
        self.mood_mapping = {
            "cinematic_ambient": ["cinematic_01.mp3", "cinematic_02.mp3", "cinematic_03.mp3"],
            "energetic": ["energetic_01.mp3", "energetic_02.mp3"],
            "upbeat": ["upbeat_01.mp3", "upbeat_02.mp3"],
            "soft_piano": ["piano_01.mp3", "piano_02.mp3"],
            "ambient": ["ambient_01.mp3", "ambient_02.mp3"],
        }

    def _scan_music_library(self) -> list[dict]:
        music_dir = Path(settings.STORAGE_MUSIC_DIR)
        if not music_dir.exists():
            music_dir.mkdir(parents=True, exist_ok=True)
            return []

        tracks = []
        for f in music_dir.iterdir():
            if f.suffix.lower() in {".mp3", ".wav", ".m4a", ".flac"}:
                tracks.append({
                    "path": str(f),
                    "name": f.name,
                    "mood": self._detect_mood_from_name(f.stem),
                })
        return tracks

    def _detect_mood_from_name(self, name: str) -> str:
        name_lower = name.lower()
        if "cinematic" in name_lower:
            return "cinematic_ambient"
        elif "energetic" in name_lower or "upbeat" in name_lower:
            return "energetic"
        elif "piano" in name_lower or "soft" in name_lower:
            return "soft_piano"
        elif "ambient" in name_lower or "calm" in name_lower:
            return "ambient"
        return "ambient"

    def select_music(self, mood: str) -> dict | None:
        candidates = self.music_library
        mood_tracks = [t for t in candidates if t["mood"] == mood]

        if not mood_tracks:
            mood_tracks = candidates

        if not mood_tracks:
            return None

        track = random.choice(mood_tracks)
        return {
            "path": track["path"],
            "name": track["name"],
            "mood": mood,
            "volume": 0.7,
            "fade_in": 2.0,
            "fade_out": 3.0,
        }

    def get_track_duration(self, track_path: str) -> float:
        try:
            from mutagen.mp3 import MP3
            audio = MP3(track_path)
            return audio.info.length
        except Exception:
            try:
                from mutagen.wave import WAVE
                audio = WAVE(track_path)
                return audio.info.length
            except Exception:
                return 60.0
