import cv2
import numpy as np
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

ANALYSIS_WIDTH = 640


class VideoAnalyzer:
    def __init__(self):
        self.scene_threshold = 30.0
        self.blur_threshold = 100.0

    def analyze(self, video_path: str) -> dict:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Cannot open video: {video_path}")

        metadata = self._extract_metadata(cap)
        total = metadata["total_frames"]
        fps = metadata["fps"]
        duration = metadata["duration"]

        if total <= 0 or duration <= 0:
            cap.release()
            return self._empty_metadata(metadata)

        sample_count = 4
        timestamps = [duration * (i + 0.5) / sample_count for i in range(sample_count)]

        frames_data = []
        for idx, ts in enumerate(timestamps):
            cap.set(cv2.CAP_PROP_POS_MSEC, ts * 1000)
            ret, frame = cap.read()
            if not ret:
                continue
            small = self._downsample(frame)
            gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
            frames_data.append((int(ts * fps), gray))

        cap.release()

        if not frames_data:
            return self._empty_metadata(metadata)

        quality = self._compute_quality(frames_data, metadata)
        scenes = self._compute_scenes(frames_data)
        motion = self._compute_motion(frames_data)
        brightness = self._compute_brightness(frames_data)

        content_type = self._classify_content_type(metadata, scenes)
        scene_type = self._categorize_scene(brightness["avg_brightness"], quality)
        emotion = self._estimate_emotion(content_type, brightness["avg_brightness"], motion["avg_motion"])

        return {
            "duration": metadata["duration"],
            "width": metadata["width"],
            "height": metadata["height"],
            "fps": metadata["fps"],
            "total_frames": total,
            "quality_score": round(quality["overall"], 2),
            "scene_changes": len(scenes),
            "avg_motion": round(motion["avg_motion"], 2),
            "avg_brightness": round(brightness["avg_brightness"], 2),
            "is_shaky": motion["is_shaky"],
            "content_type": content_type,
            "scene_type": scene_type,
            "emotion": emotion,
            "best_segments": [],
        }

    def _downsample(self, frame) -> np.ndarray:
        h, w = frame.shape[:2]
        if w <= ANALYSIS_WIDTH:
            return frame
        scale = ANALYSIS_WIDTH / w
        new_h = int(h * scale)
        return cv2.resize(frame, (ANALYSIS_WIDTH, new_h), interpolation=cv2.INTER_AREA)

    def _empty_metadata(self, metadata: dict) -> dict:
        return {
            "duration": metadata.get("duration", 0),
            "width": metadata.get("width", 0),
            "height": metadata.get("height", 0),
            "fps": metadata.get("fps", 0),
            "total_frames": metadata.get("total_frames", 0),
            "quality_score": 0,
            "scene_changes": 0,
            "avg_motion": 0,
            "avg_brightness": 128,
            "is_shaky": False,
            "content_type": "unknown",
            "scene_type": "unknown",
            "emotion": "neutral",
            "best_segments": [],
        }

    def _extract_metadata(self, cap: cv2.VideoCapture) -> dict:
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / fps if fps > 0 else 0
        return {
            "width": width,
            "height": height,
            "fps": fps,
            "total_frames": total_frames,
            "duration": duration,
        }

    def _compute_quality(self, frames_data: list, metadata: dict) -> dict:
        scores = []
        resolution_score = min((metadata["width"] * metadata["height"]) / (1920 * 1080), 1.0)
        for _, gray in frames_data:
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
            sharpness = min(laplacian_var / 500, 1.0)
            if laplacian_var < self.blur_threshold:
                sharpness *= 0.3
            frame_score = (sharpness * 0.6 + resolution_score * 0.4) * 10
            scores.append(frame_score)
        overall = np.mean(scores) if scores else 0
        return {"overall": overall, "frame_scores": scores}

    def _compute_scenes(self, frames_data: list) -> list[dict]:
        scenes = []
        for i in range(1, len(frames_data)):
            diff = cv2.absdiff(frames_data[i - 1][1], frames_data[i][1]).mean()
            if diff > self.scene_threshold * 1.5:
                scenes.append({"frame": frames_data[i][0], "diff": float(diff)})
        return scenes

    def _compute_motion(self, frames_data: list) -> dict:
        motion_values = []
        for i in range(1, len(frames_data)):
            prev = frames_data[i - 1][1]
            curr = frames_data[i][1]
            h, w = curr.shape
            target_h, target_w = min(h, 270), min(w, 480)
            prev_small = cv2.resize(prev, (target_w, target_h))
            curr_small = cv2.resize(curr, (target_w, target_h))
            flow = cv2.calcOpticalFlowFarneback(prev_small, curr_small, None, 0.5, 3, 15, 3, 5, 1.2, 0)
            magnitude = np.sqrt(flow[..., 0] ** 2 + flow[..., 1] ** 2).mean()
            motion_values.append(float(magnitude))

        avg_motion = np.mean(motion_values) if motion_values else 0
        is_shaky = avg_motion > 8.0
        return {"avg_motion": avg_motion, "is_shaky": is_shaky}

    def _compute_brightness(self, frames_data: list) -> dict:
        values = [float(gray.mean()) for _, gray in frames_data]
        avg = np.mean(values) if values else 128
        return {"avg_brightness": avg}

    def _classify_content_type(self, metadata: dict, scenes: list[dict]) -> str:
        aspect_ratio = metadata["width"] / metadata["height"] if metadata["height"] > 0 else 1.78
        scene_density = len(scenes) / max(metadata["duration"], 1)
        if aspect_ratio > 1.9:
            return "wide shot"
        elif aspect_ratio < 1.4:
            return "portrait shot"
        elif scene_density > 2:
            return "montage/dynamic"
        else:
            return "standard shot"

    def _categorize_scene(self, brightness: float, quality: dict) -> str:
        if brightness > 180:
            return "outdoor_bright"
        elif brightness > 100:
            return "well_lit_interior"
        elif brightness > 50:
            return "dim_interior"
        else:
            return "low_light"

    def _estimate_emotion(self, content_type: str, brightness: float, motion: float) -> str:
        if motion > 5.0 and brightness > 150:
            return "energetic"
        elif motion < 1.0 and brightness < 100:
            return "calm"
        elif brightness > 180:
            return "luxury"
        elif motion > 3.0:
            return "dynamic"
        else:
            return "neutral"
