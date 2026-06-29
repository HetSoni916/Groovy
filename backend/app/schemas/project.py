import uuid
from datetime import datetime

from pydantic import BaseModel


class CreateProjectRequest(BaseModel):
    dropbox_link: str | None = None
    name: str = "Untitled Project"


class ProjectResponse(BaseModel):
    id: uuid.UUID
    dropbox_link: str | None = None
    status: str
    progress: float
    final_video_url: str | None = None
    error_message: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectStatusResponse(BaseModel):
    id: uuid.UUID
    status: str
    progress: float
    current_step: str | None = None
    error_message: str | None = None


class UploadDropboxLinkRequest(BaseModel):
    project_id: uuid.UUID
    dropbox_link: str


class UploadFilesResponse(BaseModel):
    project_id: uuid.UUID
    files: list[str]
    count: int


class PromptRequest(BaseModel):
    prompt: str
    name: str = "AI Generated Video"


class PromptAnalysisResponse(BaseModel):
    mood: str
    emotion: str
    music_mood: str
    pacing: str
    description: str
    clip_count: int
    scene_types: list[str]
    content_preference: str
