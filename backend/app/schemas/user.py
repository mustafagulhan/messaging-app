# backend/app/schemas/user.py
from pydantic import BaseModel, EmailStr, validator
import re

class UserCreate(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    password: str

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Şifre en az 8 karakter olmalı')
        if not re.search(r"[A-Z]", v):
            raise ValueError('Şifre en az bir büyük harf içermeli')
        if not re.search(r"[a-z]", v):
            raise ValueError('Şifre en az bir küçük harf içermeli')
        if not re.search(r"\d", v):
            raise ValueError('Şifre en az bir rakam içermeli')
        return v

class UserResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    is_verified: bool

    class Config:
        from_attributes = True