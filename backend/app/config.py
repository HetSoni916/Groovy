from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "AI Video Editor"
    DEBUG: bool = False

    DATABASE_URL: str = "sqlite+aiosqlite:///./ai_video_editor.db"

    GROQ_API_KEY: str = ""

    DROPBOX_APP_KEY: str = ""
    DROPBOX_APP_SECRET: str = ""
    DROPBOX_REFRESH_TOKEN: str = ""

    STORAGE_LOCAL_PATH: str = "storage"
    STORAGE_TEMP_DIR: str = "storage/temp"
    STORAGE_OUTPUT_DIR: str = "storage/output"
    STORAGE_MUSIC_DIR: str = "storage/music"

    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET: str = ""
    AWS_REGION: str = "us-east-1"

    MAX_VIDEO_DURATION_SECONDS: int = 600
    MAX_CLIPS_PER_PROJECT: int = 50
    OUTPUT_VIDEO_DURATION_MIN: int = 30
    OUTPUT_VIDEO_DURATION_MAX: int = 60

    SECRET_KEY: str = "dev-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
