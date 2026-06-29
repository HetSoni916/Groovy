import pytest
from app.services.editing_service import AIEditingAgent
from app.services.analysis_service import VideoAnalyzer


@pytest.fixture
def service():
    return AIEditingAgent()


@pytest.fixture
def sample_clips():
    return [
        {
            "local_path": "clip1.mp4",
            "filename": "clip1.mp4",
            "quality_score": 8.5,
            "is_shaky": False,
            "width": 1920,
            "height": 1080,
            "duration": 30.0,
            "fps": 30,
            "scene_type": "well_lit_interior",
            "emotion": "luxury",
            "avg_brightness": 150.0,
            "avg_motion": 1.0,
            "best_segments": ["00:05 - 00:15"],
        },
        {
            "local_path": "clip2.mp4",
            "filename": "clip2.mp4",
            "quality_score": 7.0,
            "is_shaky": False,
            "width": 1920,
            "height": 1080,
            "duration": 20.0,
            "fps": 30,
            "scene_type": "well_lit_interior",
            "emotion": "neutral",
            "avg_brightness": 120.0,
            "avg_motion": 3.0,
            "best_segments": ["00:02 - 00:10"],
        },
        {
            "local_path": "clip3.mp4",
            "filename": "clip3.mp4",
            "quality_score": 9.0,
            "is_shaky": False,
            "width": 1920,
            "height": 1080,
            "duration": 25.0,
            "fps": 30,
            "scene_type": "outdoor_bright",
            "emotion": "luxury",
            "avg_brightness": 200.0,
            "avg_motion": 0.5,
            "best_segments": ["00:10 - 00:20"],
        },
    ]


def test_plan_edit(service, sample_clips):
    plan = service.plan_edit(sample_clips)
    assert len(plan["selected_clips"]) > 0
    assert plan["estimated_duration"] >= 30  # minimum target
    assert plan["music_mood"] in ("cinematic_ambient", "energetic", "upbeat", "soft_piano", "ambient")


def test_plan_edit_duration_limit(service):
    # Test with shorter clips to fit target
    short_clips = [
        {
            "local_path": "clip1.mp4",
            "filename": "clip1.mp4",
            "quality_score": 8.5,
            "is_shaky": False,
            "width": 1920,
            "height": 1080,
            "duration": 15.0,
            "fps": 30,
            "scene_type": "well_lit_interior",
            "emotion": "luxury",
            "avg_brightness": 150.0,
            "avg_motion": 1.0,
            "best_segments": ["00:05 - 00:15"],
        },
        {
            "local_path": "clip2.mp4",
            "filename": "clip2.mp4",
            "quality_score": 7.0,
            "is_shaky": False,
            "width": 1920,
            "height": 1080,
            "duration": 10.0,
            "fps": 30,
            "scene_type": "well_lit_interior",
            "emotion": "neutral",
            "avg_brightness": 120.0,
            "avg_motion": 3.0,
            "best_segments": ["00:02 - 00:10"],
        },
    ]
    plan = service.plan_edit(short_clips)
    assert plan["estimated_duration"] <= 65


def test_score_and_rank_clips(service, sample_clips):
    scored = service._score_and_rank_clips(sample_clips)
    assert len(scored) == 3
    assert scored[0]["edit_score"] > scored[1]["edit_score"]


def test_select_clips(service, sample_clips):
    scored = service._score_and_rank_clips(sample_clips)
    selected = service._select_clips(scored)
    assert len(selected) > 0
    assert all("selected_duration" in c for c in selected)


def test_choose_transition(service, sample_clips):
    trans = service._choose_transition(sample_clips[0], sample_clips[0])
    assert trans["type"] in ("crossfade", "fade", "slide", "zoom")

    trans2 = service._choose_transition(sample_clips[0], sample_clips[2])
    assert trans2["type"] in ("crossfade", "fade", "slide", "zoom")


def test_determine_music_mood(service, sample_clips):
    mood = service._determine_music_mood(sample_clips)
    assert mood == "cinematic_ambient"


def test_arrange_story(service, sample_clips):
    scored = service._score_and_rank_clips(sample_clips)
    selected = service._select_clips(scored)
    arranged = service._arrange_story(selected)
    assert len(arranged) > 0
