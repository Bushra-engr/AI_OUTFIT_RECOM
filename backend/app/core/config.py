from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Dynamically find the .env file in root or backend without hardcoding OS absolute paths
_ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
_ENV_FILE = _ROOT_DIR / ".env" if (_ROOT_DIR / ".env").exists() else (_BACKEND_DIR / ".env")


class Settings(BaseSettings):
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    supabase_jwt_secret: str
    database_url: str
    groq_api_key: str
    openweather_api_key: str

    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE) if _ENV_FILE.exists() else ".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()