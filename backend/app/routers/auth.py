# backend/app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timezone, timedelta
import random
import string
from jose import JWTError, jwt
from passlib.context import CryptContext
from ..database import get_user, get_user_by_email, create_user, users_collection
from ..utils.email import send_verification_email
from ..config import settings
from ..schemas.user import UserCreate, UserResponse  # UserResponse'u ekledik
import uuid

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/token", auto_error=True)

# JWT token oluşturma
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

# Kullanıcı doğrulama
async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        print("Decoding token...")  # Debug log
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
            
        user = await get_user(user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
            
        return user
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )


@router.post("/register")
async def register(user: UserCreate):
    print("Register isteği alındı:", user.dict())  # Debug log
    try:
        # Email kontrolü
        existing_user = await get_user_by_email(user.email)
        if existing_user:
            print(f"Email zaten kayıtlı: {user.email}")  # Debug log
            if not existing_user.get('is_verified'):
                await users_collection.delete_one({"email": user.email})
                print(f"Doğrulanmamış kullanıcı silindi: {user.email}")  # Debug log
            else:
                raise HTTPException(status_code=400, detail="Bu email zaten kayıtlı")
        
        # Log other steps
        print("Doğrulama kodu oluşturuluyor...")  # Debug log
        verification_code = ''.join(random.choices(string.digits, k=6))
        
        print("Şifre hashleniyor...")  # Debug log
        hashed_password = pwd_context.hash(user.password)
        
        print("Email gönderiliyor...")  # Debug log
        email_sent = await send_verification_email(user.email, verification_code)
        if not email_sent:
            print("Email gönderilemedi!")  # Debug log
            raise HTTPException(status_code=500, detail="Doğrulama emaili gönderilemedi")

        print("Kullanıcı veritabanına kaydediliyor...")  # Debug log
        # Kullanıcı verisi
        user_data = {
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "hashed_password": hashed_password,
            "verification_code": verification_code,
            "is_verified": False,
            "created_at": datetime.now(timezone.utc)
        }
        
        await users_collection.insert_one(user_data)
        print("Kullanıcı başarıyla kaydedildi!")  # Debug log
        
        return {"status": "success", "message": "Doğrulama kodu email adresinize gönderildi"}

    except Exception as e:
        print(f"Hata oluştu: {str(e)}")  # Debug log
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=500,
            detail=f"Kayıt sırasında bir hata oluştu: {str(e)}"
        )
    
@router.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        user = await get_user_by_email(form_data.username)
        if not user:
            raise HTTPException(
                status_code=400,
                detail="Email veya şifre hatalı"
            )
        
        if not pwd_context.verify(form_data.password, user["hashed_password"]):
            raise HTTPException(
                status_code=400,
                detail="Email veya şifre hatalı"
            )
            
        if not user.get("is_verified"):
            raise HTTPException(
                status_code=400,
                detail="Email adresinizi doğrulamanız gerekiyor"
            )

        access_token = create_access_token(data={"sub": user["id"]})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": str(user["id"]),
                "email": user["email"],
                "first_name": user["first_name"],
                "last_name": user["last_name"]
            }
        }

    except Exception as e:
        print(f"Login error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    

# backend/app/routers/auth.py - verify_email fonksiyonunu güncelleyelim
@router.post("/verify/{code}")
async def verify_email(code: str):
    print(f"Gelen doğrulama kodu: {code}")  # Debug log
    
    # Kullanıcıyı bul
    user = await users_collection.find_one({"verification_code": code})
    print(f"Bulunan kullanıcı: {user}")  # Debug log
    
    if not user:
        raise HTTPException(status_code=400, detail="Geçersiz doğrulama kodu")
    
    if user.get('is_verified'):
        raise HTTPException(status_code=400, detail="Bu kod zaten kullanılmış")

    try:
        # Kullanıcıyı doğrulanmış olarak güncelle
        result = await users_collection.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "is_verified": True,
                    "verification_code": None
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Doğrulama işlemi başarısız oldu")
        
        print("Kullanıcı başarıyla doğrulandı")  # Debug log
        return {"message": "Email başarıyla doğrulandı"}
        
    except Exception as e:
        print(f"Doğrulama hatası: {str(e)}")  # Debug log
        raise HTTPException(
            status_code=500, 
            detail=f"Doğrulama sırasında bir hata oluştu: {str(e)}"
        )