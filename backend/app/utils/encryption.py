# backend/app/utils/encryption.py
from cryptography.fernet import Fernet
import base64
from typing import Tuple
import hashlib
from Crypto.Cipher import AES, Blowfish
from Crypto.Random import get_random_bytes
from Crypto.Util.Padding import pad, unpad

class EncryptionService:
    def __init__(self):
        self.aes_key = get_random_bytes(32)  # AES-256
        self.blowfish_key = get_random_bytes(16)
        self.vigenere_key = "GÜVENLI"  # Vigenere için anahtar

    def encrypt_aes(self, message: str) -> Tuple[str, bytes]:
        cipher = AES.new(self.aes_key, AES.MODE_CBC)
        ct_bytes = cipher.encrypt(pad(message.encode(), AES.block_size))
        return base64.b64encode(cipher.iv + ct_bytes).decode('utf-8'), self.aes_key

    def decrypt_aes(self, encrypted_message: str, key: bytes) -> str:
        raw = base64.b64decode(encrypted_message)
        iv = raw[:16]
        ct = raw[16:]
        cipher = AES.new(key, AES.MODE_CBC, iv)
        pt = unpad(cipher.decrypt(ct), AES.block_size)
        return pt.decode('utf-8')

    def encrypt_blowfish(self, message: str) -> Tuple[str, bytes]:
        cipher = Blowfish.new(self.blowfish_key, Blowfish.MODE_CBC)
        ct_bytes = cipher.encrypt(pad(message.encode(), Blowfish.block_size))
        return base64.b64encode(cipher.iv + ct_bytes).decode('utf-8'), self.blowfish_key

    def decrypt_blowfish(self, encrypted_message: str, key: bytes) -> str:
        raw = base64.b64decode(encrypted_message)
        iv = raw[:8]
        ct = raw[8:]
        cipher = Blowfish.new(key, Blowfish.MODE_CBC, iv)
        pt = unpad(cipher.decrypt(ct), Blowfish.block_size)
        return pt.decode('utf-8')

    def encrypt_vigenere(self, message: str) -> str:
        encrypted = ""
        key_length = len(self.vigenere_key)
        for i in range(len(message)):
            char = message[i]
            if char.isalpha():
                key_char = self.vigenere_key[i % key_length]
                shift = ord(key_char.upper()) - ord('A')
                if char.isupper():
                    encrypted += chr((ord(char) + shift - 65) % 26 + 65)
                else:
                    encrypted += chr((ord(char) + shift - 97) % 26 + 97)
            else:
                encrypted += char
        return encrypted

    def decrypt_vigenere(self, encrypted: str) -> str:
        decrypted = ""
        key_length = len(self.vigenere_key)
        for i in range(len(encrypted)):
            char = encrypted[i]
            if char.isalpha():
                key_char = self.vigenere_key[i % key_length]
                shift = ord(key_char.upper()) - ord('A')
                if char.isupper():
                    decrypted += chr((ord(char) - shift - 65) % 26 + 65)
                else:
                    decrypted += chr((ord(char) - shift - 97) % 26 + 97)
            else:
                decrypted += char
        return decrypted

    def encrypt_base64(self, message: str) -> str:
        return base64.b64encode(message.encode()).decode()

    def decrypt_base64(self, encrypted: str) -> str:
        return base64.b64decode(encrypted).decode()

encryption_service = EncryptionService()