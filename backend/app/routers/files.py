# backend/app/routers/files.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import file as file_models
from ..schemas import file as file_schemas
from ..utils.file_handler import FileHandler
from ..utils.encryption import FileEncryption, generate_key
import uuid

router = APIRouter()

@router.post("/files/upload/", response_model=file_schemas.File)
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    try:
        # Dosyayı kaydet
        file_path = await FileHandler.save_file(file, current_user.id)
        
        # Dosyayı şifrele
        with open(file_path, "rb") as f:
            file_data = f.read()
            
        key, salt = generate_key(current_user.id)
        encryption = FileEncryption(key)
        encrypted_data = encryption.encrypt_file(file_data)
        
        # Şifrelenmiş dosyayı kaydet
        encrypted_path = file_path + ".encrypted"
        with open(encrypted_path, "wb") as f:
            f.write(encrypted_data)
            
        # Veritabanına kaydet
        db_file = file_models.File(
            id=str(uuid.uuid4()),
            name=file.filename,
            type=file.content_type,
            size=len(encrypted_data),
            path=encrypted_path,
            is_encrypted=True,
            salt=salt.hex(),
            uploaded_by=current_user.id
        )
        
        db.add(db_file)
        db.commit()
        db.refresh(db_file)
        
        return db_file
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/files/", response_model=List[file_schemas.File])
def get_files(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    return db.query(file_models.File).filter(
        file_models.File.uploaded_by == current_user.id
    ).all()

@router.get("/files/{file_id}")
async def download_file(
    file_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    db_file = db.query(file_models.File).filter(
        file_models.File.id == file_id
    ).first()
    
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
        
    if db_file.uploaded_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    # Dosyayı çöz
    with open(db_file.path, "rb") as f:
        encrypted_data = f.read()
        
    key, _ = generate_key(current_user.id, bytes.fromhex(db_file.salt))
    encryption = FileEncryption(key)
    decrypted_data = encryption.decrypt_file(encrypted_data)
    
    return Response(
        content=decrypted_data,
        media_type=db_file.type,
        headers={
            "Content-Disposition": f"attachment; filename={db_file.name}"
        }
    )