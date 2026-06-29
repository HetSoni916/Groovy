from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "AI Video Editor"
    DEBUG: bool = False
    SECRET_KEY: str = "change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    DATABASE_URL: str = "sqlite+aiosqlite:///./data/ai_video_editor.db"
    DATABASE_URL_SYNC: str = "sqlite:///./data/ai_video_editor.db"

    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    DROPBOX_APP_KEY: str = ""
    DROPBOX_APP_SECRET: str = ""
    DROPBOX_REFRESH_TOKEN: str = ""

    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET: str = "ai-video-editor"
    AWS_REGION: str = "us-east-1"

    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.2-90b-vision-preview"

    STORAGE_BACKEND: str = "local"
    LOCAL_STORAGE_PATH: str = "data/temp"

    MAX_VIDEO_DURATION: int = 600
    MAX_CLIPS_PER_PROJECT: int = 50
    OUTPUT_VIDEO_LENGTH: int = 60

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
