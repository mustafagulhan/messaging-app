# backend/app/routers/messages.py
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, File, UploadFile, Form
from fastapi.responses import JSONResponse, StreamingResponse
from typing import List
import json
import io
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from ..database import (
    save_file,
    get_file,
    users_collection,
    message_files,
    messages_collection, 
    create_message,
    get_messages,
    fs,
    db,
    client,
    delete_rsa_messages
)
from ..schemas.message import MessageCreate, MessageResponse
from .auth import get_current_user
from ..services.websocket_manager import ws_manager
from ..services.encryption import encryption_service
from ..services.file_encryption import file_encryption_service
import base64
from Crypto.Random import get_random_bytes
from Crypto.Cipher import AES, Blowfish, PKCS1_OAEP
from Crypto.PublicKey import RSA

router = APIRouter()
db = client.get_database("Bitirme")  # database bağlantısı
messages = db.messages  # messages koleksiyonu
files = db.files  # files koleksiyonu
fs = db.fs.files  # GridFS files koleksiyonu
fs_chunks = db.fs.chunks  # GridFS chunks koleksiyonu

# GridFS işlemleri için bucket oluştur
from motor.motor_asyncio import AsyncIOMotorGridFSBucket
bucket = AsyncIOMotorGridFSBucket(db)

def format_turkish_time(dt=None):
    """Tarihi Türkiye saatine göre formatlar"""
    if dt is None:
        dt = datetime.now(timezone.utc)
    
    # UTC'yi Türkiye saatine çevir (UTC+3)
    turkish_time = dt + timedelta(hours=3)
    return turkish_time.strftime('%H:%M')

@router.get("/all-users")
async def get_all_users(current_user = Depends(get_current_user)):
    try:
        print("\n--- GET ALL USERS DEBUG ---")
        print(f"Current user: {current_user}")  # Mevcut kullanıcı bilgisi
        
        # Önce tüm kullanıcıları getirelim
        all_users = await users_collection.find().to_list(length=None)
        print(f"Total users in database: {len(all_users)}")  # Toplam kullanıcı sayısı
        
        # Mevcut kullanıcı dışındaki kullanıcıları filtrele
        other_users = [
            user for user in all_users 
            if str(user["_id"]) != current_user["id"]
        ]
        print(f"Users excluding current user: {len(other_users)}")  # Filtrelenmiş kullanıcı sayısı
        
        # Yanıt için kullanıcıları formatla
        formatted_users = []
        for user in other_users:
            formatted_user = {
                "id": str(user["_id"]),
                "email": user.get("email", ""),
                "first_name": user.get("first_name", ""),
                "last_name": user.get("last_name", "")
            }
            formatted_users.append(formatted_user)
            print(f"Formatted user: {formatted_user}")  # Her bir formatlanmış kullanıcı
            
        print(f"Returning {len(formatted_users)} users")  # Döndürülen kullanıcı sayısı
        print("------------------------\n")
        
        return formatted_users

    except Exception as e:
        print(f"Error in get_all_users: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
async def update_message_status(message_id: str, is_read: bool):
    try:
        result = await messages_collection.update_one(
            {"_id": ObjectId(message_id)},
            {"$set": {"is_read": is_read}}
        )
        return result.modified_count > 0
    except Exception as e:
        print(f"Error updating message status: {str(e)}")
        return False

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await ws_manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_json()
            
            if data.get("type") == "message":
                print("\n=== WEBSOCKET MESSAGE DEBUG ===")
                print(f"Message Type: {data.get('type')}")
                print(f"Encryption Type: {data.get('encryptionType')}")
                print(f"Content: {data.get('content')}")

                if data.get("content", "").startswith("[FILE:"):
                    print("Dosya mesajı tespit edildi, şifreleme atlanıyor...")
                    message_data = {
                        "content": data["content"],
                        "sender_id": user_id,
                        "receiver_id": data["receiverId"],
                        "timestamp": datetime.now().isoformat(),
                        "is_read": False,
                        "encryption_type": "NONE"
                    }
                else:
                    try:
                        encrypted_content = None
                        encryption_data = None

                        print("\n--Encryption Process Start--")
                        print(f"Orijinal Mesaj: {data['content']}")
                        print(f"Şifreleme Yöntemi: {data['encryptionType']}")
                        
                        if data["encryptionType"] == "AES":
                            print("\n=== AES Encryption ===")
                            encrypted_content, encryption_data = encryption_service.encrypt_aes(data["content"])
                            print(f"Şifreli İçerik: {encrypted_content}")
                            print(f"Şifreleme Verisi: {encryption_data}")

                        elif data["encryptionType"] == "BLOWFISH":
                            print("\n=== BLOWFISH Encryption ===")
                            encrypted_content, encryption_data = encryption_service.encrypt_blowfish(data["content"])
                            print(f"Şifreli İçerik: {encrypted_content}")
                            print(f"Şifreleme Verisi: {encryption_data}")

                        elif data["encryptionType"] == "RSA":
                            print("\n=== RSA Encryption ===")
                            encrypted_content, encryption_data = encryption_service.encrypt_rsa(data["content"])
                            print(f"Şifreli İçerik: {encrypted_content}")
                            print(f"Private Key: {encryption_data.get('private_key', 'Bulunamadı')[:50]}...")
                            print(f"Public Key: {encryption_data.get('public_key', 'Bulunamadı')[:50]}...")

                        elif data["encryptionType"] == "VIGENERE":
                            print("\n=== VIGENERE Encryption ===")
                            encrypted_content, encryption_data = encryption_service.encrypt_vigenere(data["content"])
                            print(f"Şifreli İçerik: {encrypted_content}")
                            print(f"Anahtar: {encryption_data.get('key', 'Bulunamadı')}")

                        elif data["encryptionType"] == "BASE64":
                            print("\n=== BASE64 Encoding ===")
                            encrypted_content = encryption_service.encrypt_base64(data["content"])[0]
                            print(f"Kodlanmış İçerik: {encrypted_content}")
                            encryption_data = None

                        print("\nŞifreleme Sonuçları:")
                        print(f"Şifreli İçerik Tipi: {type(encrypted_content)}")
                        print(f"Şifreleme Verisi Tipi: {type(encryption_data)}")
                        print("--Encryption Process End--\n")

                        # Mesaj verisini oluştur
                        message_data = {
                            "encrypted_content": encrypted_content,
                            "encryption_data": encryption_data,
                            "encryption_type": data["encryptionType"],
                            "sender_id": user_id,
                            "receiver_id": data["receiverId"],
                            "timestamp": datetime.now().isoformat(),
                            "is_read": False
                        }

                    except Exception as e:
                        print(f"\nENCRYPTION ERROR: {str(e)}")
                        print(f"Error Type: {type(e)}")
                        print(f"Error Args: {e.args}")
                        raise e

                print("\n=== MESSAGE DATA DEBUG ===")
                print(f"Final Message Data: {message_data}")
                
                created_message = await create_message(message_data)
                await ws_manager.send_personal_message(created_message, data["receiverId"])

    except WebSocketDisconnect:
        ws_manager.disconnect(user_id)
        print(f"User {user_id} disconnected from WebSocket")
    except Exception as e:
        print(f"WebSocket error: {str(e)}")
        ws_manager.disconnect(user_id)

@router.get("/recent-chats")
async def get_recent_chats(current_user = Depends(get_current_user)):
    try:
        # Sadece mevcut kullanıcının mesajlaştığı kişileri getir
        messages = await messages_collection.find({
            "$or": [
                {"sender_id": str(current_user["id"])},
                {"receiver_id": str(current_user["id"])}
            ]
        }).to_list(length=None)

        # Benzersiz kullanıcı ID'lerini topla
        user_ids = set()
        for msg in messages:
            if msg["sender_id"] != str(current_user["id"]):
                user_ids.add(msg["sender_id"])
            if msg["receiver_id"] != str(current_user["id"]):
                user_ids.add(msg["receiver_id"])

        # Bu kullanıcıların bilgilerini getir
        chat_users = []
        for user_id in user_ids:
            user = await users_collection.find_one({"_id": ObjectId(user_id)})
            if user:
                chat_users.append({
                    "id": str(user["_id"]),
                    "email": user["email"],
                    "first_name": user.get("first_name", ""),
                    "last_name": user.get("last_name", "")
                })

        return chat_users
    except Exception as e:
        print(f"Error in get_recent_chats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/{receiver_id}")
async def get_user_messages(receiver_id: str, current_user = Depends(get_current_user)):
    try:
        print(f"\n=== GET MESSAGES DEBUG ===")
        print(f"Current user: {current_user['id']}, Receiver: {receiver_id}")
        
        messages = await get_messages(current_user["id"], receiver_id)
        print(f"Found {len(messages)} messages")

        decrypted_messages = []

        for msg in messages:
            try:
                msg_id = str(msg["_id"]) if "_id" in msg else str(msg.get("id"))
                print(f"\n--- Processing Message {msg_id} ---")
                print(f"Raw Message Data: {msg}")

                # Dosya mesajı kontrolü
                if msg.get("content", "").startswith('[FILE:'):
                    print("File message detected, skipping decryption")
                    decrypted_messages.append({
                        "id": msg_id,
                        "content": msg["content"],
                        "sender_id": msg["sender_id"],
                        "receiver_id": msg["receiver_id"],
                        "timestamp": msg["timestamp"],
                        "is_read": msg.get("is_read", False),
                        "encryption_type": msg.get("encryption_type", "")
                    })
                    continue

                # Normal mesaj şifre çözme
                encryption_type = msg.get("encryption_type", "")
                encryption_data = msg.get("encryption_data")
                encrypted_content = msg.get("encrypted_content")

                print(f"Encryption Type: {encryption_type}")
                print(f"Encryption Data: {encryption_data}")
                print(f"Encrypted Content Type: {type(encrypted_content)}")
                if isinstance(encrypted_content, str):
                    print(f"Encrypted Content Length: {len(encrypted_content)}")

                if encryption_type and encrypted_content:
                    try:
                        print("\n--Decryption Process Start--")
                        print(f"Şifreleme Yöntemi: {encryption_type}")
                        print(f"Şifreli İçerik: {encrypted_content}")
                        print(f"Şifreleme Verisi: {encryption_data}")
                        decrypted_content = None

                        if encryption_type == "AES":
                            print("\n=== AES Decryption ===")
                            decrypted_content = encryption_service.decrypt_aes(
                                encrypted_content, encryption_data
                            )
                            print(f"Çözülmüş İçerik: {decrypted_content}")

                        elif encryption_type == "BLOWFISH":
                            print("\n=== BLOWFISH Decryption ===")
                            decrypted_content = encryption_service.decrypt_blowfish(
                                encrypted_content, encryption_data
                            )
                            print(f"Çözülmüş İçerik: {decrypted_content}")

                        elif encryption_type == "RSA":
                            print("\n=== RSA Decryption ===")
                            decrypted_content = encryption_service.decrypt_rsa(
                                encrypted_content, encryption_data
                            )
                            print(f"Çözülmüş İçerik: {decrypted_content}")

                        elif encryption_type == "VIGENERE":
                            print("\n=== VIGENERE Decryption ===")
                            decrypted_content = encryption_service.decrypt_vigenere(
                                encrypted_content, encryption_data
                            )
                            print(f"Çözülmüş İçerik: {decrypted_content}")

                        elif encryption_type == "BASE64":
                            print("\n=== BASE64 Decoding ===")
                            decrypted_content = encryption_service.decrypt_base64(
                                encrypted_content
                            )
                            print(f"Çözülmüş İçerik: {decrypted_content}")

                        print("\nŞifre Çözme Sonuçları:")
                        print(f"Çözülmüş İçerik Tipi: {type(decrypted_content)}")
                        if isinstance(decrypted_content, str):
                            print(f"Çözülmüş İçerik Uzunluğu: {len(decrypted_content)} karakter")
                        print("--Decryption Process End--\n")

                    except Exception as e:
                        print(f"\nDECRYPTION ERROR: {str(e)}")
                        print(f"Error Type: {type(e)}")
                        print(f"Error Args: {e.args}")
                        decrypted_content = "Mesaj çözülemedi"
                else:
                    decrypted_content = msg.get("content", "")

                decrypted_messages.append({
                    "id": msg_id,
                    "content": decrypted_content,
                    "sender_id": msg["sender_id"],
                    "receiver_id": msg["receiver_id"],
                    "timestamp": msg["timestamp"],
                    "is_read": msg.get("is_read", False),
                    "encryption_type": encryption_type
                })

            except Exception as e:
                print(f"Error processing message: {str(e)}")
                continue

        return decrypted_messages

    except Exception as e:
        print(f"Error in get_user_messages: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

    
@router.put("/{message_id}/read")
async def mark_message_as_read(
    message_id: str,
    current_user = Depends(get_current_user)
):
    try:
        # Mesajı okundu olarak işaretle
        updated = await update_message_status(message_id, True)
        if not updated:
            raise HTTPException(status_code=404, detail="Mesaj bulunamadı")
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/find-user")
async def find_user(email: str, current_user = Depends(get_current_user)):
    try:
        if not email:
            raise HTTPException(status_code=400, detail="Email adresi gereklidir")

        # Debug: Arama parametresi
        print(f"\nSearching for email: {email}")

        # MongoDB sorgusu
        user = await users_collection.find_one({"email": email})
        
        # Debug: MongoDB yanıtı
        print(f"MongoDB response: {user}")

        if not user:
            raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")

        # Result objesi oluştur
        result = {
            "id": str(user.get("_id")),
            "email": user.get("email"),
            "first_name": user.get("first_name", ""),
            "last_name": user.get("last_name", "")
        }

        # Debug: Döndürülen veri
        print(f"Returning data: {result}")
        
        # Response objesi ile dön
        return JSONResponse(content=result)

    except Exception as e:
        print(f"Error in find_user endpoint: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/send-message")
async def send_message(message: MessageCreate, current_user = Depends(get_current_user)):
    try:
        # Mesaj içeriğini şifrele
        encrypted_content = None
        encryption_data = None
        
        if message.encryption_type == "RSA":
            encrypted_content, encryption_data = encryption_service.encrypt_rsa(message.content)
        elif message.encryption_type == "AES":
            encrypted_content, encryption_data = encryption_service.encrypt_aes(message.content)
        elif message.encryption_type == "BLOWFISH":
            encrypted_content, encryption_data = encryption_service.encrypt_blowfish(message.content)
        elif message.encryption_type == "VIGENERE":
            encrypted_content, encryption_data = encryption_service.encrypt_vigenere(message.content)
        elif message.encryption_type == "BASE64":
            encrypted_content, encryption_data = encryption_service.encrypt_base64(message.content)
        else:
            raise ValueError(f"Unsupported encryption type: {message.encryption_type}")

        message_data = {
            "encrypted_content": encrypted_content,
            "encryption_data": encryption_data,
            "encryption_type": message.encryption_type,
            "sender_id": str(current_user["id"]),
            "receiver_id": message.receiver_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "is_read": False
        }
        
        return await create_message(message_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-file")
async def upload_file(
    file: UploadFile = File(...),
    receiver_id: str = Form(...),
    encryption_type: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    try:
        print(f"\n=== UPLOAD MESSAGE FILE DEBUG ===")
        print(f"File: {file.filename} ({file.content_type})")
        print(f"Receiver ID: {receiver_id}")

        # Dosya içeriğini oku
        contents = await file.read()

        # Güvenli metadata oluştur
        metadata = {
            "content_type": file.content_type,
            "owner_id": str(current_user["id"]),
            "receiver_id": receiver_id,
            "upload_date": datetime.now(timezone.utc).isoformat(),  # ISO format kullan
            "encrypted": True
        }

        # Dosyayı message_files koleksiyonuna kaydet
        file_id = await message_files.upload_from_stream(
            filename=file.filename,
            source=io.BytesIO(contents),
            metadata=metadata
        )
        
        file_id_str = str(file_id)

        # Mesaj verisini oluştur
        message_data = {
            "sender_id": str(current_user["id"]),
            "receiver_id": receiver_id,
            "content": f'[FILE:{{"id":"{file_id_str}","name":"{file.filename}","type":"{file.content_type}","size":{len(contents)}}}]',
            "timestamp": datetime.now(timezone.utc).isoformat(),  # ISO format kullan
            "is_read": False,
            "encryption_type": encryption_type,
            "is_file": True,
            "file_id": file_id_str
        }

        # Mesajı kaydet
        result = await messages_collection.insert_one(message_data)
        
        response_data = {
            "id": str(result.inserted_id),
            "content": message_data["content"],
            "sender_id": message_data["sender_id"],
            "receiver_id": message_data["receiver_id"],
            "timestamp": message_data["timestamp"],  # timestamp'i response'a ekle
            "is_read": message_data["is_read"],
            "encryption_type": message_data["encryption_type"],
            "is_file": message_data["is_file"],
            "file_id": message_data["file_id"]
        }
        
        print(f"Message saved with ID: {response_data['id']}")
        return response_data

    except Exception as e:
        print(f"Error in upload_file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Dosya önizleme endpoint'i
# messages.py dosyasında preview endpoint'ini şu şekilde güncelleyin:

@router.get("/files/preview/{file_id}")
async def preview_file(file_id: str, current_user: dict = Depends(get_current_user)):
    try:
        print(f"\n=== PREVIEW MESSAGE FILE DEBUG ===")
        print(f"File ID: {file_id}")
        print(f"User ID: {current_user['id']}")

        # Dosya meta verilerini bul
        file_info = await db['message_files.files'].find_one({'_id': ObjectId(file_id)})
        if not file_info:
            raise HTTPException(status_code=404, detail="Dosya bulunamadı")

        # Yetki kontrolü
        metadata = file_info.get('metadata', {})
        if (str(current_user["id"]) != metadata.get('owner_id') and 
            str(current_user["id"]) != metadata.get('receiver_id')):
            raise HTTPException(status_code=403, detail="Bu dosyaya erişim izniniz yok")

        # Dosyayı oku
        grid_out = await message_files.open_download_stream(ObjectId(file_id))
        contents = await grid_out.read()

        # Eğer şifreliyse çöz
        if metadata.get("is_encrypted"):
            encryption_key = metadata.get("encryption_key")
            if encryption_key:
                contents = file_encryption_service.decrypt_file(contents, encryption_key)

        print("File read successfully, sending response")
        return StreamingResponse(
            io.BytesIO(contents),
            media_type=metadata.get("content_type", "application/octet-stream")
        )

    except Exception as e:
        print(f"Error in preview message file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/files/{file_id}")
async def get_message_file(file_id: str, current_user: dict = Depends(get_current_user)):
    try:
        print(f"\n=== GET MESSAGE FILE DEBUG ===")
        print(f"Getting file with ID: {file_id}")

        # message_files bucket'ından dosyayı al
        grid_out = await message_files.open_download_stream(ObjectId(file_id))
        contents = await grid_out.read()

        # Meta verileri al
        file_info = await db['message_files.files'].find_one({"_id": ObjectId(file_id)})
        if not file_info:
            raise HTTPException(status_code=404, detail="Dosya bulunamadı")

        return StreamingResponse(
            io.BytesIO(contents),
            media_type=file_info.get("metadata", {}).get("content_type", "application/octet-stream")
        )

    except Exception as e:
        print(f"Error in get_message_file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/clear-rsa")
async def clear_rsa_messages(current_user = Depends(get_current_user)):
    try:
        deleted_count = await delete_rsa_messages()
        return {"message": f"{deleted_count} RSA mesajı silindi"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))