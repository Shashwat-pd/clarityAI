from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://clarity:clarity@db:5432/clarityai"

    # API Keys
    GEMINI_API_KEY: str = ""
    DEEPGRAM_API_KEY: str = ""

    # App
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "DEBUG"
    MAX_SESSION_HISTORY_MESSAGES: int = 20
    CRISIS_DETECTION_ENABLED: bool = True

    # Brief
    DEFAULT_BRIEF_DAYS_BACK: int = 30
    PDF_WATERMARK_TEXT: str = "ClarityAI — Confidential"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
