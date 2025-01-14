# backend/app/database.py
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
from pymongo.server_api import ServerApi
from bson import ObjectId
from .config import settings
import io
from datetime import datetime, timezone, timedelta

print("Connecting to MongoDB...")

# MongoDB connection
try:
    client = AsyncIOMotorClient(
        settings.DATABASE_URL,
        server_api=ServerApi('1')
    )
    
    # Database
    db = client.get_database("Bitirme")

    # Collections
    users_collection = db.users
    messages_collection = db.messages
    files_collection = db.files

    # GridFS buckets
    try:
        # GridFS buckets
        fs = AsyncIOMotorGridFSBucket(db)
        print("GridFS bucket initialized")
    except Exception as e:
        print(f"GridFS initialization error: {str(e)}")
        raise e
    message_files = AsyncIOMotorGridFSBucket(db, 'message_files')
    print("MongoDB connected successfully")
    print("MongoDB collections initialized")
except Exception as e:
    print(f"MongoDB connection error: {str(e)}")
    raise e

# Export everything needed
__all__ = [
    'users_collection',
    'messages_collection',
    'files_collection',
    'fs',
    'db',
    'save_file',
    'get_file',
    'get_messages',
    'create_message'
]

# GridFS fonksiyonları
# Helper functions

async def save_message_file(file_data: bytes, metadata: dict):
    """Mesaj dosyalarını ayrı bir koleksiyonda sakla"""
    try:
        file_id = await message_files.upload_from_stream(
            'message_file',  # Güvenlik için gerçek dosya adını kullanmıyoruz
            io.BytesIO(file_data),
            metadata=metadata
        )
        return str(file_id)
    except Exception as e:
        print(f"Error saving message file: {str(e)}")
        raise e
    
async def save_file(file_data: bytes, filename: str):
    """Dosyayı GridFS'e kaydet."""
    try:
        file_id = await fs.upload_from_stream(
            filename,
            file_data,
        )
        return str(file_id)
    except Exception as e:
        print(f"Error saving file: {str(e)}")
        raise e

async def get_file(file_id: str):
    """GridFS'den dosyayı getir."""
    try:
        grid_out = await fs.open_download_stream(ObjectId(file_id))
        contents = await grid_out.read()
        return contents
    except Exception as e:
        print(f"Error retrieving file: {str(e)}")
        return None

# ObjectId -> string dönüşümü için yardımcı fonksiyon
def serialize_id(item):
    """ObjectId -> string dönüşümü için yardımcı fonksiyon"""
    if item and item.get('_id'):
        item['id'] = str(item['_id'])
        del item['_id']
    return item

async def get_messages(sender_id: str, receiver_id: str):
    try:
        print(f"\nFetching messages between {sender_id} and {receiver_id}")
        
        cursor = messages_collection.find({
            '$or': [
                {'sender_id': sender_id, 'receiver_id': receiver_id},
                {'sender_id': receiver_id, 'receiver_id': sender_id}
            ]
        }).sort('timestamp', 1)

        messages = []
        async for msg in cursor:
            msg['id'] = str(msg.pop('_id'))
            
            # Timestamp formatını düzelt
            if 'timestamp' in msg:
                if isinstance(msg['timestamp'], datetime):
                    msg['timestamp'] = msg['timestamp'].strftime("%Y-%m-%dT%H:%M:%S.%fZ")
                elif not isinstance(msg['timestamp'], str):
                    msg['timestamp'] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")
            else:
                msg['timestamp'] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")
                
            messages.append(msg)

        print(f"Found {len(messages)} messages")
        return messages

    except Exception as e:
        print(f"Error in get_messages: {str(e)}")
        raise e

async def create_message(message_data: dict):
    """Yeni mesaj oluştur"""
    try:
        print(f"\nCreating message: {message_data}")

        # Eğer timestamp yoksa ekle
        if "timestamp" not in message_data:
            message_data["timestamp"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")
        elif isinstance(message_data["timestamp"], datetime):
            message_data["timestamp"] = message_data["timestamp"].strftime("%Y-%m-%dT%H:%M:%S.%fZ")

        result = await messages_collection.insert_one(message_data)
        message_data['id'] = str(result.inserted_id)
        
        if '_id' in message_data:
            del message_data['_id']
            
        print(f"Message created with ID: {message_data['id']}")
        return message_data
    except Exception as e:
        print(f"Error creating message: {str(e)}")
        raise e

async def get_user(user_id: str):
    if not ObjectId.is_valid(user_id):
        return None
    user = await users_collection.find_one({'_id': ObjectId(user_id)})
    return serialize_id(user) if user else None

async def get_user_by_email(email: str):
    user = await users_collection.find_one({'email': email})
    return serialize_id(user) if user else None

async def create_user(user_data: dict):
    result = await users_collection.insert_one(user_data)
    user_data['id'] = str(result.inserted_id)
    return user_data

async def verify_user(verification_code: str):
    result = await users_collection.find_one_and_update(
        {'verification_code': verification_code},
        {'$set': {'is_verified': True, 'verification_code': None}},
        return_document=True
    )
    return serialize_id(result) if result else None

async def delete_unverified_user(email: str):
    await users_collection.delete_one({"email": email, "is_verified": False})

async def get_user_by_verification_code(code: str):
    user = await users_collection.find_one({"verification_code": code})
    return serialize_id(user) if user else None

async def find_user(email: str):
    try:
        print(f"\nDatabase find_user called with email: {email}")
        
        # MongoDB sorgusu
        user = await users_collection.find_one({"email": email})
        
        print(f"Database find_user result: {user}")
        
        if user:
            # ObjectId'yi string'e çevir
            user['id'] = str(user['_id'])
            # _id alanını kaldır
            del user['_id']
            
        return user
    except Exception as e:
        print(f"Database error in find_user: {str(e)}")
        return None

async def delete_rsa_messages():
    """RSA şifreli tüm mesajları sil"""
    try:
        result = await messages_collection.delete_many({"encryption_type": "RSA"})
        print(f"Deleted {result.deleted_count} RSA messages")
        return result.deleted_count
    except Exception as e:
        print(f"Error deleting RSA messages: {str(e)}")
        return 0