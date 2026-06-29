import unittest
from unittest.mock import patch, MagicMock
import numpy as np

from app.services.analysis_service import VideoAnalyzer


class TestVideoAnalyzer(unittest.TestCase):
    def setUp(self):
        self.analyzer = VideoAnalyzer()

    def test_classify_content_type_wide(self):
        metadata = {"width": 3840, "height": 1080, "duration": 10}  # aspect ratio 3.55 > 1.9
        scenes = [{"frame": 10, "diff": 5}]
        result = self.analyzer._classify_content_type(metadata, scenes)
        self.assertEqual(result, "wide shot")

    def test_classify_content_type_portrait(self):
        metadata = {"width": 1080, "height": 1920, "duration": 10}
        scenes = [{"frame": 10, "diff": 5}]
        result = self.analyzer._classify_content_type(metadata, scenes)
        self.assertEqual(result, "portrait shot")

    def test_classify_content_type_dynamic(self):
        metadata = {"width": 1280, "height": 720, "duration": 1}
        scenes = [{"frame": 10, "diff": 5}, {"frame": 30, "diff": 10}, {"frame": 60, "diff": 8}]
        result = self.analyzer._classify_content_type(metadata, scenes)
        self.assertEqual(result, "montage/dynamic")

    def test_categorize_scene_bright(self):
        self.assertEqual(self.analyzer._categorize_scene(200, {}), "outdoor_bright")

    def test_categorize_scene_dim(self):
        self.assertEqual(self.analyzer._categorize_scene(60, {}), "dim_interior")

    def test_estimate_emotion_energetic(self):
        self.assertEqual(self.analyzer._estimate_emotion("", 160, 6.0), "energetic")

    def test_estimate_emotion_calm(self):
        self.assertEqual(self.analyzer._estimate_emotion("", 50, 0.5), "calm")

    def test_estimate_emotion_luxury(self):
        self.assertEqual(self.analyzer._estimate_emotion("", 200, 2.0), "luxury")

    def test_find_best_segments_empty(self):
        self.assertEqual(self.analyzer._find_best_segments([], []), [])

    def test_find_best_segments_with_scores(self):
        scores = [5.0, 6.0, 7.0, 8.0, 9.0, 8.0, 7.0, 6.0, 5.0, 4.0] * 10
        segments = self.analyzer._find_best_segments(scores, [])
        self.assertTrue(len(segments) > 0)
        self.assertTrue(all(":" in s for s in segments))

    @patch("cv2.VideoCapture")
    def test_extract_metadata(self, mock_cap):
        instance = mock_cap.return_value
        instance.get.side_effect = lambda x: {
            3: 1920,  # width
            4: 1080,  # height
            5: 30.0,  # fps
            7: 300,   # total frames
        }.get(x, 0)
        instance.isOpened.return_value = True

        metadata = self.analyzer._extract_metadata(instance)
        self.assertEqual(metadata["width"], 1920)
        self.assertEqual(metadata["height"], 1080)
        self.assertEqual(metadata["fps"], 30.0)
        self.assertEqual(metadata["total_frames"], 300)
        self.assertAlmostEqual(metadata["duration"], 10.0)


class TestEditingAgent(unittest.TestCase):
    def setUp(self):
        from app.services.editing_service import AIEditingAgent
        self.editor = AIEditingAgent()

    def test_score_and_rank_clips(self):
        clips = [
            {"quality_score": 8.0, "is_shaky": False, "width": 1920, "height": 1080, "duration": 10},
            {"quality_score": 9.0, "is_shaky": True, "width": 1920, "height": 1080, "duration": 10},
            {"quality_score": 5.0, "is_shaky": False, "width": 640, "height": 480, "duration": 1},
        ]
        scored = self.editor._score_and_rank_clips(clips)
        self.assertEqual(len(scored), 3)
        self.assertGreater(scored[0]["edit_score"], scored[1]["edit_score"])

    def test_determine_music_mood_luxury(self):
        clips = [{"emotion": "luxury"}, {"emotion": "calm"}]
        self.assertEqual(self.editor._determine_music_mood(clips), "cinematic_ambient")

    def test_determine_music_mood_energetic(self):
        clips = [{"emotion": "energetic"}]
        self.assertEqual(self.editor._determine_music_mood(clips), "energetic")

    def test_choose_transition_crossfade(self):
        a = {"scene_type": "outdoor_bright", "emotion": "luxury", "avg_brightness": 200, "avg_motion": 1.0}
        b = {"scene_type": "outdoor_bright", "emotion": "luxury", "avg_brightness": 190, "avg_motion": 1.2}
        t = self.editor._choose_transition(a, b)
        self.assertEqual(t["type"], "crossfade")


if __name__ == "__main__":
    unittest.main()
