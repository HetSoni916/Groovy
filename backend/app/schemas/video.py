from pydantic import BaseModel
from typing import Optional


class GenerateVideoRequest(BaseModel):
    project_id: int
    duration: int = 60


class GenerateVideoResponse(BaseModel):
    project_id: int
    job_id: str
    message: str = "Video generation started"
