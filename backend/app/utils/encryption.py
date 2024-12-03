# backend/app/utils/encryption.py
from cryptography.fernet import Fernet
import base64
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import os

def generate_key(password: str, salt: bytes = None) -> tuple[bytes, bytes]:
    if salt is None:
        salt = os.urandom(16)
    
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
    return key, salt

class FileEncryption:
    def __init__(self, key: bytes):
        self.fernet = Fernet(key)

    def encrypt_file(self, file_data: bytes) -> bytes:
        return self.fernet.encrypt(file_data)

    def decrypt_file(self, encrypted_data: bytes) -> bytes:
        return self.fernet.decrypt(encrypted_data)