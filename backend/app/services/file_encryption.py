# backend/app/services/file_encryption.py
from cryptography.fernet import Fernet
import base64

class FileEncryptionService:
    def __init__(self):
        self.fernet = None

    def encrypt_file(self, file_contents: bytes) -> tuple[bytes, str]:
        """
        Dosya içeriğini şifrele
        Returns: (encrypted_content, key)
        """
        # Her dosya için yeni bir key oluştur
        key = Fernet.generate_key()
        fernet = Fernet(key)
        
        try:
            # Direkt olarak bytes'ı şifrele
            encrypted_contents = fernet.encrypt(file_contents)
            # Key'i string olarak sakla
            key_str = base64.b64encode(key).decode('utf-8')
            return encrypted_contents, key_str
        except Exception as e:
            print(f"Encryption error: {str(e)}")
            raise e

    def decrypt_file(self, encrypted_contents: bytes, key: str) -> bytes:
        """
        Şifrelenmiş dosya içeriğini çöz
        """
        try:
            # String formatındaki key'i bytes'a çevir
            key_bytes = base64.b64decode(key.encode('utf-8'))
            fernet = Fernet(key_bytes)
            
            # Şifreyi çöz ve bytes olarak döndür
            decrypted_contents = fernet.decrypt(encrypted_contents)
            return decrypted_contents
        except Exception as e:
            print(f"Decryption error: {str(e)}")
            raise e

file_encryption_service = FileEncryptionService()