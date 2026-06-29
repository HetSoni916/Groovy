import json
import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class PromptAnalysisService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"
        self.model = "llama-3.1-8b-instant"
        self._enabled = bool(self.api_key and not self.api_key.startswith("gsk_your_"))

    def is_enabled(self) -> bool:
        return self._enabled

    def analyze_prompt(self, prompt: str) -> dict:
        if not self._enabled:
            return self._fallback_analysis(prompt)

        system_prompt = (
            "You are a video editing assistant. Analyze the user's video prompt and return "
            "a JSON object (no markdown, no code fences) with these fields:\n"
            '- "mood": one of "cinematic", "energetic", "calm", "dramatic", "romantic", "adventure", "luxury"\n'
            '- "scene_types": list of scene types to prioritize (e.g. ["outdoor_bright", "well_lit_interior", "dynamic"])\n'
            '- "emotion": one of "energetic", "calm", "dynamic", "luxury", "neutral"\n'
            '- "content_preference": one of "wide shot", "portrait shot", "montage/dynamic", "standard shot"\n'
            '- "music_mood": one of "cinematic_ambient", "energetic", "upbeat", "soft_piano", "ambient"\n'
            '- "description": brief description of the editing style\n'
            '- "clip_count": suggested number of clips (3-8)\n'
            '- "pacing": one of "slow", "medium", "fast"\n'
        )

        try:
            with httpx.Client(timeout=15.0) as client:
                resp = client.post(
                    self.api_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": f"Analyze this video prompt: {prompt}"},
                        ],
                        "temperature": 0.3,
                        "max_tokens": 400,
                    },
                )
                data = resp.json()
                content = data["choices"][0]["message"]["content"].strip()
                if content.startswith("```"):
                    content = content.split("\n", 1)[-1]
                    content = content.rsplit("```", 1)[0]
                result = json.loads(content)
                result["raw_prompt"] = prompt
                return result
        except Exception as e:
            logger.warning(f"Groq prompt analysis failed: {e}")
            return self._fallback_analysis(prompt)

    def _fallback_analysis(self, prompt: str) -> dict:
        prompt_lower = prompt.lower()
        mood = "calm"
        emotion = "neutral"
        music_mood = "ambient"
        pacing = "medium"
        scene_types = ["outdoor_bright", "well_lit_interior"]

        if any(w in prompt_lower for w in ["energy", "fast", "action", "sport", "run"]):
            mood = "energetic"
            emotion = "energetic"
            music_mood = "energetic"
            pacing = "fast"
            scene_types = ["outdoor_bright", "dynamic"]
        elif any(w in prompt_lower for w in ["dramatic", "epic", "intense", "powerful"]):
            mood = "dramatic"
            emotion = "dynamic"
            music_mood = "cinematic_ambient"
            pacing = "medium"
        elif any(w in prompt_lower for w in ["romantic", "love", "sweet", "gentle"]):
            mood = "romantic"
            emotion = "calm"
            music_mood = "soft_piano"
            pacing = "slow"
        elif any(w in prompt_lower for w in ["adventure", "travel", "explore", "journey"]):
            mood = "adventure"
            emotion = "dynamic"
            music_mood = "cinematic_ambient"
            pacing = "medium"
        elif any(w in prompt_lower for w in ["luxury", "elegant", "premium", "high-end"]):
            mood = "luxury"
            emotion = "luxury"
            music_mood = "cinematic_ambient"
            pacing = "slow"
        elif any(w in prompt_lower for w in ["calm", "peaceful", "serene", "quiet", "relax"]):
            mood = "calm"
            emotion = "calm"
            music_mood = "ambient"
            pacing = "slow"

        return {
            "mood": mood,
            "scene_types": scene_types,
            "emotion": emotion,
            "content_preference": "standard shot",
            "music_mood": music_mood,
            "description": f"Auto-generated edit based on prompt: {prompt}",
            "clip_count": 5,
            "pacing": pacing,
            "raw_prompt": prompt,
        }
