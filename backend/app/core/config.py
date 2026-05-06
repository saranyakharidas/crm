from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "CRM Backend"
    debug: bool = True
    secret_key: str = "change-this-in-production"
    access_token_expire_minutes: int = 60
    database_url: str = "sqlite:///./crm.db"
    frontend_origin: str = "http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        env_prefix="CRM_",
    )


settings = Settings()
