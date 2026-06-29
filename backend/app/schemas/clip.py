import uuid

from pydantic import BaseModel


class ClipMetadata(BaseModel):
    clip: str
    type: str = ""
    scene: str = ""
    quality: float = 0.0
    emotion: str = ""
    best_segments: list[str] = []


class ClipResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    filename: str
    duration: float
    width: int
    height: int
    fps: float
    quality_score: float
    clip_metadata: dict | None = None

    class Config:
        from_attributes = True


class AnalysisResult(BaseModel):
    clips: list[ClipResponse]
