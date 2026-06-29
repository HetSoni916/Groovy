import base64
import json
import logging
from pathlib import Path

import cv2
import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class GroqVisionService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"
        self.model = "llama-3.2-90b-vision-preview"
        self._enabled = bool(self.api_key and not self.api_key.startswith("gsk_your_"))

    def is_enabled(self) -> bool:
        return self._enabled

    def _extract_frame_base64(self, video_path: str) -> str | None:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return None
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        mid_frame = total // 2 if total > 0 else 0
        cap.set(cv2.CAP_PROP_POS_FRAMES, mid_frame)
        ret, frame = cap.read()
        cap.release()
        if not ret:
            return None
        h, w = frame.shape[:2]
        if w > 1024:
            scale = 1024 / w
            frame = cv2.resize(frame, (1024, int(h * scale)), interpolation=cv2.INTER_AREA)
        _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 50])
        return base64.b64encode(buffer).decode("utf-8")

    def _build_payload(self, frame_b64: str) -> dict:
        prompt = (
            "Analyze this video frame. Respond with JSON only (no markdown). "
            "Describe:\n"
            '- "scene": what type of location/ environment (e.g. "living room", "beach", "office", "street", "kitchen")\n'
            '- "objects": list of visible objects/items\n'
            '- "people_count": number of people visible (0 if none)\n'
            '- "indoor": true or false\n'
            '- "lighting": "bright", "dim", "low_light", "mixed"\n'
            '- "color_tone": "warm", "cool", "neutral", "vibrant"\n'
            '- "description": one sentence describing the scene'
        )
        return {
            "model": self.model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{frame_b64}"
                            },
                        },
                    ],
                }
            ],
            "temperature": 0.1,
            "max_tokens": 300,
        }

    def _parse_response(self, resp_data: dict) -> dict:
        content = resp_data["choices"][0]["message"]["content"]
        content = content.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[-1]
            content = content.rsplit("```", 1)[0]
        result = json.loads(content)
        result["used_groq"] = True
        return result

    def enhance_metadata_sync(self, video_path: str, filename: str, opencv_metadata: dict) -> dict:
        """Synchronous Groq API call - no event loop needed."""
        if not self._enabled:
            return opencv_metadata

        frame_b64 = self._extract_frame_base64(video_path)
        if not frame_b64:
            return opencv_metadata

        try:
            with httpx.Client(timeout=15.0) as client:
                resp = client.post(
                    self.api_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json=self._build_payload(frame_b64),
                )
                groq_result = self._parse_response(resp.json())
        except Exception as e:
            logger.warning(f"Groq API call failed: {e}")
            return opencv_metadata

        if "scene" in groq_result:
            opencv_metadata["scene_label"] = groq_result["scene"]
        if "indoor" in groq_result:
            opencv_metadata["indoor"] = groq_result["indoor"]
        if "lighting" in groq_result:
            opencv_metadata["lighting"] = groq_result["lighting"]
        if "color_tone" in groq_result:
            opencv_metadata["color_tone"] = groq_result["color_tone"]
        if "objects" in groq_result:
            opencv_metadata["objects"] = groq_result["objects"]
        if "people_count" in groq_result:
            opencv_metadata["people_count"] = groq_result["people_count"]
        if "description" in groq_result:
            opencv_metadata["description"] = groq_result["description"]

        return opencv_metadata
