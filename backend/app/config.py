# backend/app/config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # MongoDB connection string from environment variable
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL environment variable is not set")
    
    # JWT settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # File upload settings
    UPLOAD_FOLDER: str = "uploads"
    
    # Email settings
    BREVO_API_KEY: str = os.getenv("BREVO_API_KEY")
    BREVO_SENDER_EMAIL: str = os.getenv("BREVO_SENDER_EMAIL")

settings = Settings()