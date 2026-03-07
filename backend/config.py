from pydantic_settings import BaseSettings

# BaseSettings is special class that reads values from my .env file and makes them available as attributes of the class
class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str
     
    class Config:
        env_file = ".env"

settings = Settings()