import httpx

from app.services.analysis_service import VideoAnalyzer
from app.services.groq_service import GroqVisionService


class EnhancedVideoAnalyzer(VideoAnalyzer):
    def __init__(self):
        super().__init__()
        self.groq = GroqVisionService()

    def analyze(self, video_path: str) -> dict:
        base = super().analyze(video_path)
        if not self.groq.is_enabled():
            return base
        try:
            result = self.groq.enhance_metadata_sync(video_path, base.get("filename", ""), base)
            return result
        except Exception:
            return base
