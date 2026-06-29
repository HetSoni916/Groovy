import os
import subprocess
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

STOCK_DIR = Path(__file__).parent.parent.parent / "storage" / "stock_footage"


class StockFootageService:
    def __init__(self):
        self.stock_dir = STOCK_DIR
        self.stock_dir.mkdir(parents=True, exist_ok=True)
        self._library = self._build_library()

    def _build_library(self) -> list[dict]:
        library = []
        for f in sorted(self.stock_dir.glob("*.mp4")):
            if f.stat().st_size < 1000:
                continue
            name = f.stem
            tags = self._infer_tags(name)
            library.append({
                "path": str(f),
                "filename": f.name,
                "tags": tags,
                "name": name,
            })
        return library

    def _infer_tags(self, filename: str) -> list[str]:
        tag_map = {
            "nature": ["nature", "forest", "green", "calm", "peaceful"],
            "forest": ["forest", "nature", "green", "calm", "peaceful"],
            "ocean": ["ocean", "waves", "water", "calm", "peaceful"],
            "waves": ["ocean", "waves", "water", "calm", "peaceful"],
            "city": ["city", "skyline", "urban", "luxury", "energetic"],
            "skyline": ["city", "skyline", "urban", "luxury"],
            "mountain": ["mountain", "landscape", "nature", "adventure", "epic"],
            "landscape": ["mountain", "landscape", "nature", "adventure"],
            "sunset": ["sunset", "clouds", "sky", "romantic", "calm"],
            "clouds": ["sunset", "clouds", "sky", "romantic"],
            "rain": ["rain", "window", "moody", "dramatic", "calm"],
            "abstract": ["abstract", "light", "particles", "dynamic", "energetic"],
            "light": ["abstract", "light", "bokeh", "romantic", "calm"],
            "traffic": ["city", "traffic", "urban", "energetic"],
            "waterfall": ["waterfall", "nature", "water", "adventure", "calm"],
            "stars": ["stars", "night", "sky", "cosmic", "dramatic"],
            "night": ["night", "lights", "city", "luxury", "dramatic"],
            "coffee": ["coffee", "shop", "cozy", "calm", "romantic"],
            "drone": ["drone", "aerial", "landscape", "adventure", "epic"],
            "aerial": ["drone", "aerial", "landscape", "adventure"],
            "flower": ["flower", "bloom", "nature", "romantic", "calm"],
            "bloom": ["flower", "bloom", "nature", "romantic"],
            "fire": ["fire", "flames", "warm", "dramatic", "energetic"],
            "flames": ["fire", "flames", "warm", "dramatic"],
            "snow": ["snow", "mountains", "winter", "adventure", "epic"],
            "beach": ["beach", "sunset", "ocean", "romantic", "calm"],
            "smoke": ["abstract", "smoke", "moody", "dramatic", "calm"],
            "bokeh": ["light", "bokeh", "abstract", "romantic", "calm"],
            "meadow": ["green", "meadow", "nature", "calm", "peaceful"],
            "path": ["forest", "path", "nature", "calm", "peaceful"],
        }
        tags = []
        name_lower = filename.lower()
        for key, tag_list in tag_map.items():
            if key in name_lower:
                tags.extend(tag_list)
        return list(set(tags)) if tags else ["general"]

    def get_all_clips(self) -> list[dict]:
        return self._library

    def find_matching_clips(self, prompt_text: str, count: int = 6) -> list[dict]:
        prompt_lower = prompt_text.lower()
        scored = []
        for clip in self._library:
            score = 0
            for tag in clip["tags"]:
                if tag in prompt_lower:
                    score += 3
            if any(w in prompt_lower for w in ["calm", "peaceful", "serene", "quiet"]):
                if any(t in clip["tags"] for t in ["calm", "peaceful"]):
                    score += 2
            if any(w in prompt_lower for w in ["energy", "fast", "action", "dynamic"]):
                if any(t in clip["tags"] for t in ["energetic", "dynamic"]):
                    score += 2
            if any(w in prompt_lower for w in ["dramatic", "epic", "intense"]):
                if any(t in clip["tags"] for t in ["dramatic", "epic"]):
                    score += 2
            if any(w in prompt_lower for w in ["romantic", "love", "sweet"]):
                if any(t in clip["tags"] for t in ["romantic"]):
                    score += 2
            if any(w in prompt_lower for w in ["adventure", "travel", "explore"]):
                if any(t in clip["tags"] for t in ["adventure"]):
                    score += 2
            if any(w in prompt_lower for w in ["luxury", "elegant", "premium"]):
                if any(t in clip["tags"] for t in ["luxury"]):
                    score += 2
            if score > 0:
                scored.append({**clip, "match_score": score})

        scored.sort(key=lambda x: x["match_score"], reverse=True)
        if not scored:
            return self._library[:count]
        return scored[:count]

    def prepare_clips_for_editing(self, clips: list[dict]) -> list[dict]:
        metadata = []
        for clip in clips:
            duration = self._get_duration(clip["path"])
            metadata.append({
                "local_path": clip["path"],
                "file_path": clip["path"],
                "filename": clip["filename"],
                "duration": duration,
                "width": 1920,
                "height": 1080,
                "quality_score": 0.8,
                "is_shaky": False,
                "scene_type": "outdoor_bright",
                "emotion": "neutral",
                "avg_brightness": 128,
                "avg_motion": 2.0,
                "content_type": "stock footage",
                "best_segments": [],
                "tags": clip.get("tags", []),
            })
        return metadata

    def _get_duration(self, path: str) -> float:
        try:
            cmd = [
                "ffprobe", "-v", "error", "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1", path
            ]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            return float(result.stdout.strip())
        except Exception:
            return 8.0
