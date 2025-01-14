import re
import magic
import hashlib
from typing import Tuple

def sanitize_filename(filename: str) -> str:
    """Güvenli dosya adı oluştur"""
    # Sadece alfanumerik, nokta ve tire karakterlerine izin ver
    safe_name = re.sub(r'[^a-zA-Z0-9.-]', '_', filename)
    # Uzantıyı koru ama adı hash'le
    name, ext = safe_name.rsplit('.', 1) if '.' in safe_name else (safe_name, '')
    hashed_name = hashlib.sha256(name.encode()).hexdigest()[:12]
    return f"{hashed_name}.{ext}" if ext else hashed_name

def validate_file_type(content: bytes) -> Tuple[bool, str]:
    """Dosya türünü doğrula"""
    allowed_types = {
        'image/jpeg', 'image/png', 'image/gif',
        'application/pdf', 'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }
    
    mime = magic.Magic(mime=True)
    file_type = mime.from_buffer(content)
    
    return file_type in allowed_types, file_type

def secure_file_metadata(metadata: dict) -> dict:
    """Metadata'yı güvenli hale getir"""
    safe_metadata = {
        "content_type": metadata.get("content_type"),
        "owner_id": metadata.get("owner_id"),
        "upload_date": metadata.get("upload_date"),
        "file_size": metadata.get("size"),
        "is_encrypted": metadata.get("is_encrypted", False)
    }
    return {k: v for k, v in safe_metadata.items() if v is not None}