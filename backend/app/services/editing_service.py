import json
import math
from pathlib import Path

from app.services.analysis_service import VideoAnalyzer


class AIEditingAgent:
    def __init__(self):
        self.analyzer = VideoAnalyzer()
        self.target_duration_range = (30, 40)

    def plan_edit(self, clips_metadata: list[dict], prompt_criteria: dict | None = None) -> dict:
        if prompt_criteria:
            scored_clips = self._score_clips_for_prompt(clips_metadata, prompt_criteria)
        else:
            scored_clips = self._score_and_rank_clips(clips_metadata)
        selected = self._select_clips(scored_clips)
        story_order = self._arrange_story(selected)
        transitions = self._plan_transitions(story_order)
        music_mood = prompt_criteria.get("music_mood", self._determine_music_mood(story_order)) if prompt_criteria else self._determine_music_mood(story_order)

        return {
            "selected_clips": story_order,
            "transitions": transitions,
            "music_mood": music_mood,
            "estimated_duration": sum(c["duration"] for c in story_order),
        }

    def _score_clips_for_prompt(self, clips_metadata: list[dict], criteria: dict) -> list[dict]:
        scored = []
        target_scenes = set(criteria.get("scene_types", []))
        target_emotion = criteria.get("emotion", "neutral")
        target_content = criteria.get("content_preference", "")

        for clip in clips_metadata:
            score = clip.get("quality_score", 0)

            if clip.get("scene_type") in target_scenes:
                score *= 1.5

            if clip.get("emotion") == target_emotion:
                score *= 1.4

            if target_content and clip.get("content_type") == target_content:
                score *= 1.3

            if clip.get("is_shaky", False):
                score *= 0.5

            resolution = clip.get("width", 0) * clip.get("height", 0)
            res_factor = min(resolution / (1920 * 1080), 1.0) * 0.5 + 0.5
            score *= res_factor

            if clip.get("duration", 0) < 2:
                score *= 0.3
            elif clip.get("duration", 0) > 120:
                score *= 0.7

            brightness = clip.get("avg_brightness", 128)
            motion = clip.get("avg_motion", 0)
            pacing = criteria.get("pacing", "medium")

            if pacing == "fast" and motion > 3.0:
                score *= 1.2
            elif pacing == "slow" and motion < 2.0:
                score *= 1.2

            scored.append({**clip, "edit_score": round(score, 2)})

        scored.sort(key=lambda x: x["edit_score"], reverse=True)
        return scored

    def _score_and_rank_clips(self, clips_metadata: list[dict]) -> list[dict]:
        scored = []
        for clip in clips_metadata:
            score = clip.get("quality_score", 0)

            if clip.get("is_shaky", False):
                score *= 0.5

            resolution = clip.get("width", 0) * clip.get("height", 0)
            res_factor = min(resolution / (1920 * 1080), 1.0) * 0.5 + 0.5
            score *= res_factor

            if clip.get("duration", 0) < 2:
                score *= 0.3
            elif clip.get("duration", 0) > 120:
                score *= 0.7

            scored.append({**clip, "edit_score": round(score, 2)})

        scored.sort(key=lambda x: x["edit_score"], reverse=True)
        return scored

    def _select_clips(self, scored_clips: list[dict]) -> list[dict]:
        if not scored_clips:
            return []

        target = self.target_duration_range[1]
        selected = []
        total_duration = 0

        for clip in scored_clips:
            raw_duration = clip.get("duration", 10)

            if not clip.get("best_segments"):
                clip_duration = min(raw_duration, 60)
            else:
                clip_duration = min(raw_duration, 45)

            if clip_duration < 3:
                continue

            if total_duration + clip_duration > target:
                remaining = target - total_duration
                if remaining > 5:
                    selected.append({**clip, "selected_duration": round(remaining, 1)})
                break

            selected.append({**clip, "selected_duration": round(clip_duration, 1)})
            total_duration += clip_duration

        if total_duration < self.target_duration_range[0] and selected:
            for c in selected:
                raw = c.get("duration", 10)
                if not c.get("best_segments"):
                    max_dur = min(raw, 60)
                else:
                    max_dur = min(raw, 45)
                c["selected_duration"] = round(min(c["selected_duration"], max_dur), 1)

        return selected

    def _arrange_story(self, clips: list[dict]) -> list[dict]:
        if not clips:
            return []

        # Arrange in waves: establish -> develop -> climax -> conclude
        n = len(clips)
        if n <= 4:
            return clips

        # Simple story arc arrangement
        arranged = []
        # Opening: best quality establishing shots
        arranged.append(clips[0])
        # Build up
        mid_start = 1
        mid_end = max(2, n - 2)
        arranged.extend(clips[mid_start:mid_end])
        # Climax: highest energy
        if n > 2:
            arranged.append(clips[-2] if clips[-2]["edit_score"] > clips[-1]["edit_score"] else clips[-1])
        # Conclusion
        if n > 1:
            arranged.append(clips[-1])

        return arranged

    def _plan_transitions(self, clips: list[dict]) -> list[dict]:
        transitions = []
        for i in range(len(clips) - 1):
            curr = clips[i]
            next_clip = clips[i + 1]
            transition = self._choose_transition(curr, next_clip)
            transitions.append({
                "from": curr.get("filename", f"clip_{i}"),
                "to": next_clip.get("filename", f"clip_{i+1}"),
                "type": transition["type"],
                "duration": transition["duration"],
            })
        return transitions

    def _choose_transition(self, curr: dict, next_clip: dict) -> dict:
        scene_similarity = self._compute_scene_similarity(curr, next_clip)

        if scene_similarity > 0.7:
            return {"type": "crossfade", "duration": 0.5}
        elif scene_similarity > 0.4:
            return {"type": "fade", "duration": 0.3}
        elif curr.get("emotion") == next_clip.get("emotion"):
            return {"type": "slide", "duration": 0.4}
        else:
            return {"type": "zoom", "duration": 0.5}

    def _compute_scene_similarity(self, a: dict, b: dict) -> float:
        score = 0.0
        if a.get("scene_type") == b.get("scene_type"):
            score += 0.3
        if a.get("emotion") == b.get("emotion"):
            score += 0.3
        if abs(a.get("avg_brightness", 0) - b.get("avg_brightness", 0)) < 30:
            score += 0.2
        if abs(a.get("avg_motion", 0) - b.get("avg_motion", 0)) < 2:
            score += 0.2
        return score

    def _determine_music_mood(self, clips: list[dict]) -> str:
        emotions = [c.get("emotion", "neutral") for c in clips]
        if not emotions:
            return "ambient"

        if "luxury" in emotions:
            return "cinematic_ambient"
        elif "energetic" in emotions:
            return "energetic"
        elif "dynamic" in emotions:
            return "upbeat"
        elif "calm" in emotions:
            return "soft_piano"
        else:
            return "ambient"
