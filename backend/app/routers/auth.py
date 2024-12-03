# backend/app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import random
import string
from ..database import get_db
from ..models.user import User
from ..schemas.user import UserCreate, UserResponse
from ..utils.email import send_verification_email
from ..config import settings

router = APIRouter()

# ... diğer import ve fonksiyonlar aynı ...

@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    try:
        print(f"Gelen kayıt isteği: {user.dict()}")  # Request logla
        
        # Email kontrol
        if db.query(User).filter(User.email == user.email).first():
            raise HTTPException(status_code=400, detail="Bu email zaten kayıtlı")
        
        verification_code = ''.join(random.choices(string.digits, k=6))
        hashed_password = pwd_context.hash(user.password)
        
        db_user = User(
            id=str(uuid.uuid4()),
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            hashed_password=hashed_password,
            verification_code=verification_code,
            is_verified=False
        )
        
        print("Email gönderiliyor...")  # Email gönderme logla
        await send_verification_email(user.email, verification_code)
        print("Email gönderildi")
        
        print("Veritabanına kaydediliyor...")  # DB işlemlerini logla
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        print("Veritabanına kaydedildi")
        
        return db_user
        
    except Exception as e:
        print(f"Hata detayı: {str(e)}")  # Hatayı logla
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Kayıt sırasında bir hata oluştu: {str(e)}"
        )
    
@router.post("/verify/{code}")
async def verify_email(code: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.verification_code == code).first()
    if not user:
        raise HTTPException(status_code=400, detail="Geçersiz doğrulama kodu")
    
    user.is_verified = True
    user.verification_code = None  # Kodu sil
    db.commit()
    
    return {"message": "Email başarıyla doğrulandı"}

@router.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email veya şifre hatalı"
        )
    if not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email veya şifre hatalı"
        )
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email adresinizi doğrulamanız gerekiyor"
        )

    access_token = create_access_token(data={"sub": user.id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name
        }
    }