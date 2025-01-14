# services/encryption.py

import base64
from Crypto.Cipher import AES, Blowfish, PKCS1_OAEP
from Crypto.PublicKey import RSA
from Crypto.Random import get_random_bytes
from Crypto.Util.Padding import pad, unpad
from typing import Tuple, Dict, Union
class EncryptionService:
    def __init__(self):
        self.vigenere_key = "GUVENLI"  # Sabit Vigenere anahtarı
        self.rsa_keys = {}  # Kullanıcı bazlı RSA anahtarları

    # AES Şifreleme
    def encrypt_aes(self, message: str) -> Tuple[str, Dict]:
        try:
            print("\n=== AES Encryption Process Start ===")
            # 32 byte (256 bit) anahtar ve 16 byte IV oluştur
            key = get_random_bytes(32)
            cipher = AES.new(key, AES.MODE_CBC)
            
            # Mesajı şifrele
            padded_data = pad(message.encode('utf-8'), AES.block_size)
            encrypted_data = cipher.encrypt(padded_data)
            
            # Base64 encoding
            encrypted_b64 = base64.b64encode(encrypted_data).decode('utf-8')
            key_b64 = base64.b64encode(key).decode('utf-8')
            iv_b64 = base64.b64encode(cipher.iv).decode('utf-8')
            
            print(f"Message Length: {len(message)} chars")
            print(f"Encrypted Length: {len(encrypted_data)} bytes")
            print("=== AES Encryption Process End ===\n")
            
            return encrypted_b64, {'key': key_b64, 'iv': iv_b64}
            
        except Exception as e:
            print(f"AES encryption error: {str(e)}")
            raise e

    def decrypt_aes(self, encrypted_message: str, encryption_data: Dict) -> str:
        try:
            print("\n=== AES Decryption Process Start ===")
            # Base64 decode
            encrypted = base64.b64decode(encrypted_message)
            key = base64.b64decode(encryption_data['key'])
            iv = base64.b64decode(encryption_data['iv'])
            
            print(f"Encrypted Length: {len(encrypted)} bytes")
            
            # Deşifreleme
            cipher = AES.new(key, AES.MODE_CBC, iv)
            decrypted_padded = cipher.decrypt(encrypted)
            decrypted = unpad(decrypted_padded, AES.block_size)
            decrypted_text = decrypted.decode('utf-8')
            
            print(f"Decrypted Length: {len(decrypted_text)} chars")
            print("=== AES Decryption Process End ===\n")
            
            return decrypted_text
            
        except Exception as e:
            print(f"AES decryption error: {str(e)}")
            return f"Decrypt Error: {str(e)}"

    # Blowfish Şifreleme
    def encrypt_blowfish(self, message: str) -> Tuple[str, Dict]:
        try:
            print("\n=== Blowfish Encryption Process Start ===")
            # 16 byte anahtar ve 8 byte IV oluştur
            key = get_random_bytes(16)
            iv = get_random_bytes(8)
            
            # Şifreleme
            cipher = Blowfish.new(key, Blowfish.MODE_CBC, iv)
            padded_data = pad(message.encode('utf-8'), Blowfish.block_size)
            encrypted_data = cipher.encrypt(padded_data)
            
            # Base64 encoding
            encrypted_b64 = base64.b64encode(encrypted_data).decode('utf-8')
            key_b64 = base64.b64encode(key).decode('utf-8')
            iv_b64 = base64.b64encode(iv).decode('utf-8')
            
            print(f"Message Length: {len(message)} chars")
            print(f"Encrypted Length: {len(encrypted_data)} bytes")
            print("=== Blowfish Encryption Process End ===\n")
            
            return encrypted_b64, {'key': key_b64, 'iv': iv_b64}
            
        except Exception as e:
            print(f"Blowfish encryption error: {str(e)}")
            raise e

    def decrypt_blowfish(self, encrypted_message: str, encryption_data: Dict) -> str:
        try:
            print("\n=== Blowfish Decryption Process Start ===")
            # Base64 decode
            encrypted = base64.b64decode(encrypted_message)
            key = base64.b64decode(encryption_data['key'])
            iv = base64.b64decode(encryption_data['iv'])
            
            print(f"Encrypted Length: {len(encrypted)} bytes")
            
            # Deşifreleme
            cipher = Blowfish.new(key, Blowfish.MODE_CBC, iv)
            decrypted_padded = cipher.decrypt(encrypted)
            decrypted = unpad(decrypted_padded, Blowfish.block_size)
            decrypted_text = decrypted.decode('utf-8')
            
            print(f"Decrypted Length: {len(decrypted_text)} chars")
            print("=== Blowfish Decryption Process End ===\n")
            
            return decrypted_text
            
        except Exception as e:
            print(f"Blowfish decryption error: {str(e)}")
            return f"Decrypt Error: {str(e)}"

    # RSA Şifreleme
    def encrypt_rsa(self, message: str) -> Tuple[str, Dict]:
        try:
            print("\n=== RSA Encryption Process Start ===")
            
            # RSA anahtar çifti oluştur
            key = RSA.generate(2048)
            
            # Mesajı şifrele
            cipher = PKCS1_OAEP.new(key)
            message_bytes = message.encode('utf-8')
            encrypted = cipher.encrypt(message_bytes)
            
            # Anahtarları PEM formatında sakla
            private_key_pem = key.export_key(format='PEM')
            public_key_pem = key.publickey().export_key(format='PEM')
            
            # Base64 encoding
            encrypted_b64 = base64.b64encode(encrypted).decode('utf-8')
            private_key_b64 = base64.b64encode(private_key_pem).decode('utf-8')
            public_key_b64 = base64.b64encode(public_key_pem).decode('utf-8')
            
            print(f"Message Length: {len(message_bytes)} bytes")
            print(f"Private Key Length: {len(private_key_pem)} bytes")
            print(f"Public Key Length: {len(public_key_pem)} bytes")
            print(f"Encrypted Length: {len(encrypted)} bytes")
            print("=== RSA Encryption Process End ===\n")
            
            return encrypted_b64, {
                'private_key': private_key_b64,
                'public_key': public_key_b64
            }
            
        except Exception as e:
            print(f"RSA encryption error: {str(e)}")
            raise e

    def decrypt_rsa(self, encrypted_message: str, encryption_data: Dict) -> str:
        try:
            print("\n=== RSA Decryption Process Start ===")
            
            # RSA şifre çözme
            encrypted = base64.b64decode(encrypted_message)
            key_data = encryption_data.get('private_key')
            if not key_data:
                raise ValueError("Private key not found in encryption data")
                
            private_key_pem = base64.b64decode(key_data)
            
            print(f"Encrypted Length: {len(encrypted)} bytes")
            print(f"Private Key Length: {len(private_key_pem)} bytes")
            
            # Private key'i yükle
            private_key = RSA.import_key(private_key_pem)
            
            # Deşifreleme
            cipher = PKCS1_OAEP.new(private_key)
            decrypted = cipher.decrypt(encrypted)
            decrypted_text = decrypted.decode('utf-8')
            
            print(f"Decrypted Length: {len(decrypted_text)} chars")
            print("=== RSA Decryption Process End ===\n")
            
            return decrypted_text
            
        except Exception as e:
            print(f"RSA decryption error: {str(e)}")
            return f"Decrypt Error: {str(e)}"
        
    # RSA şifreleme
    def encrypt_rsa(message: str, public_key) -> bytes:
        cipher = PKCS1_OAEP.new(public_key)
        return cipher.encrypt(message.encode())
    
    # Vigenere Şifreleme
    def encrypt_vigenere(self, message: str) -> Tuple[str, Dict]:
        try:
            print("\n=== Vigenere Encryption Process Start ===")
            result = []
            key = self.vigenere_key
            key_length = len(key)
            
            # Türkçe karakter eşleştirme tablosu
            tr_chars = "ĞÜŞİÖÇğüşıöç"
            en_chars = "GUSIOCgusioc"
            tr_to_en_map = dict(zip(tr_chars, en_chars))
            en_to_tr_map = dict(zip(en_chars, tr_chars))
            
            print(f"Original Message: {message}")
            print(f"Key: {key}")
            
            # Büyük/küçük harf ve Türkçe karakter bilgisini sakla
            char_info = []
            message_conv = ""
            for c in message:
                if c in tr_chars:
                    # Türkçe karakter
                    char_info.append(('tr', c in "ĞÜŞİÖÇ"))  # True if uppercase
                    message_conv += tr_to_en_map[c]
                else:
                    # Normal karakter
                    char_info.append(('en', c.isupper()))
                    message_conv += c
            
            # Şifreleme için mesajı ve anahtarı büyük harfe çevir
            message_upper = message_conv.upper()
            key_upper = key.upper()
            
            for i, char in enumerate(message_upper):
                if char.isalpha():
                    # Alfabetik karakterler için şifreleme
                    key_char = key_upper[i % key_length]
                    # Şifreleme formülü: (mesaj_char + anahtar_char) mod 26
                    shifted = (ord(char) - ord('A') + ord(key_char) - ord('A')) % 26
                    shifted_char = chr(shifted + ord('A'))
                    
                    # Orijinal karakter bilgisini kullanarak formatı geri yükle
                    char_type, is_upper = char_info[i]
                    if char_type == 'tr':
                        # Türkçe karakter ise
                        if shifted_char in en_chars:
                            tr_char = en_to_tr_map[shifted_char]
                            result.append(tr_char if is_upper else tr_char.lower())
                        else:
                            result.append(shifted_char if is_upper else shifted_char.lower())
                    else:
                        # Normal karakter ise
                        result.append(shifted_char if is_upper else shifted_char.lower())
                else:
                    # Alfabetik olmayan karakterleri olduğu gibi bırak
                    result.append(char)
            
            encrypted = ''.join(result)
            print(f"Message Length: {len(message)} chars")
            print(f"Encrypted Message: {encrypted}")
            print("=== Vigenere Encryption Process End ===\n")
            
            return encrypted, {'key': key, 'char_info': char_info}
            
        except Exception as e:
            print(f"Vigenere encryption error: {str(e)}")
            raise e
        

    def decrypt_vigenere(self, encrypted_message: str, encryption_data: Dict) -> str:
        try:
            print("\n=== Vigenere Decryption Process Start ===")
            result = []
            key = encryption_data['key']
            char_info = encryption_data.get('char_info', [('en', True)] * len(encrypted_message))
            key_length = len(key)
            
            # Türkçe karakter eşleştirme tablosu
            tr_chars = "ĞÜŞİÖÇğüşıöç"
            en_chars = "GUSIOCgusioc"
            tr_to_en_map = dict(zip(tr_chars, en_chars))
            en_to_tr_map = dict(zip(en_chars, tr_chars))
            
            print(f"Encrypted Message: {encrypted_message}")
            print(f"Key: {key}")
            
            # Şifreli mesajı İngilizce karakterlere dönüştür
            encrypted_conv = ""
            for c in encrypted_message:
                if c in tr_chars:
                    encrypted_conv += tr_to_en_map[c]
                else:
                    encrypted_conv += c
            
            # Şifre çözme için mesajı ve anahtarı büyük harfe çevir
            encrypted_upper = encrypted_conv.upper()
            key_upper = key.upper()
            
            for i, char in enumerate(encrypted_upper):
                if char.isalpha():
                    # Alfabetik karakterler için şifre çözme
                    key_char = key_upper[i % key_length]
                    # Şifre çözme formülü: (şifreli_char - anahtar_char) mod 26
                    shifted = (ord(char) - ord(key_char)) % 26
                    shifted_char = chr(shifted + ord('A'))
                    
                    # Orijinal karakter bilgisini kullanarak formatı geri yükle
                    if i < len(char_info):
                        char_type, is_upper = char_info[i]
                        if char_type == 'tr':
                            # Türkçe karakter ise
                            if shifted_char in en_chars:
                                tr_char = en_to_tr_map[shifted_char]
                                result.append(tr_char if is_upper else tr_char.lower())
                            else:
                                result.append(shifted_char if is_upper else shifted_char.lower())
                        else:
                            # Normal karakter ise
                            result.append(shifted_char if is_upper else shifted_char.lower())
                    else:
                        result.append(shifted_char)
                else:
                    # Alfabetik olmayan karakterleri olduğu gibi bırak
                    result.append(char)
            
            decrypted = ''.join(result)
            print(f"Message Length: {len(encrypted_message)} chars")
            print(f"Decrypted Message: {decrypted}")
            print("=== Vigenere Decryption Process End ===\n")
            
            return decrypted
            
        except Exception as e:
            print(f"Vigenere decryption error: {str(e)}")
            return f"Decrypt Error: {str(e)}"
        
    
    # Base64 Encoding
    def encrypt_base64(self, message: str) -> Tuple[str, Dict]:
        try:
            print("\n=== Base64 Encoding Process Start ===")
            encoded = base64.b64encode(message.encode()).decode()
            
            print(f"Message Length: {len(message)} chars")
            print(f"Encoded Length: {len(encoded)} chars")
            print("=== Base64 Encoding Process End ===\n")
            
            return encoded, {}
            
        except Exception as e:
            print(f"Base64 encoding error: {str(e)}")
            raise e

    def decrypt_base64(self, encoded_message: str, encryption_data: Dict = None) -> str:
        try:
            print("\n=== Base64 Decoding Process Start ===")
            print(f"Encoded Length: {len(encoded_message)} chars")
            
            decoded = base64.b64decode(encoded_message).decode()
            
            print(f"Decoded Length: {len(decoded)} chars")
            print("=== Base64 Decoding Process End ===\n")
            
            return decoded
            
        except Exception as e:
            print(f"Base64 decoding error: {str(e)}")
            return f"Decode Error: {str(e)}"
    
    def encrypt_image(self, image_data: bytes):
        """Resim verilerini AES ile şifreler."""
        key = get_random_bytes(16)
        cipher = AES.new(key, AES.MODE_CBC)
        
        # Resim verilerini şifrele
        padded_data = pad(image_data, AES.block_size)
        encrypted_data = cipher.encrypt(padded_data)
        
        encryption_data = {
            'key': base64.b64encode(key).decode(),
            'iv': base64.b64encode(cipher.iv).decode(),
            'type': 'image'
        }
        
        return encrypted_data, encryption_data

    def decrypt_image(self, encrypted_data: bytes, encryption_data: dict) -> bytes:
        """Şifrelenmiş resim verilerini çözer."""
        key = base64.b64decode(encryption_data['key'])
        iv = base64.b64decode(encryption_data['iv'])
        
        cipher = AES.new(key, AES.MODE_CBC, iv)
        decrypted_padded = cipher.decrypt(encrypted_data)
        
        try:
            decrypted_data = unpad(decrypted_padded, AES.block_size)
            return decrypted_data
        except Exception as e:
            print(f"Error decrypting image: {str(e)}")
            return encrypted_data  # Hata durumunda orijinal veriyi döndür
        
    def encrypt_binary_aes(self, binary_data: bytes):
        # Binary veriyi AES ile şifrele
        key = get_random_bytes(16)
        cipher = AES.new(key, AES.MODE_CBC)
        padded_data = pad(binary_data, AES.block_size)
        encrypted_data = cipher.encrypt(padded_data)
    
        return encrypted_data, {
            'key': base64.b64encode(key).decode(),
            'iv': base64.b64encode(cipher.iv).decode()
        }

    def decrypt_binary_aes(self, encrypted_data: bytes, encryption_data: dict) -> bytes:
        """AES ile şifrelenmiş binary veriyi çöz"""
        key = base64.b64decode(encryption_data['key'])
        iv = base64.b64decode(encryption_data['iv'])
        cipher = AES.new(key, AES.MODE_CBC, iv)
        decrypted_data = cipher.decrypt(encrypted_data)
        unpadded_data = unpad(decrypted_data, AES.block_size)
        return unpadded_data

    def encrypt_binary_blowfish(self, binary_data: bytes):
        """Binary veriyi Blowfish ile şifrele"""
        key = get_random_bytes(16)
        cipher = Blowfish.new(key, Blowfish.MODE_CBC)
        padded_data = pad(binary_data, Blowfish.block_size)
        encrypted_data = cipher.encrypt(padded_data)
        
        return encrypted_data, {
            'key': base64.b64encode(key).decode(),
            'iv': base64.b64encode(cipher.iv).decode()
        }

    def decrypt_binary_blowfish(self, encrypted_data: bytes, encryption_data: dict) -> bytes:
        """Blowfish ile şifrelenmiş binary veriyi çöz"""
        key = base64.b64decode(encryption_data['key'])
        iv = base64.b64decode(encryption_data['iv'])
        cipher = Blowfish.new(key, Blowfish.MODE_CBC, iv)
        decrypted_data = cipher.decrypt(encrypted_data)
        unpadded_data = unpad(decrypted_data, Blowfish.block_size)
        return unpadded_data


encryption_service = EncryptionService()