# backend/app/utils/file_handler.py
import os
import aiofiles
from fastapi import UploadFile
from ..config import settings
import shutil

class FileHandler:
    @staticmethod
    async def save_file(file: UploadFile, user_id: str) -> str:
        user_folder = os.path.join(settings.UPLOAD_FOLDER, str(user_id))
        os.makedirs(user_folder, exist_ok=True)
        
        file_path = os.path.join(user_folder, file.filename)
        
        async with aiofiles.open(file_path, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)
            
        return file_path

    @staticmethod
    async def delete_file(file_path: str):
        if os.path.exists(file_path):
            os.remove(file_path)

    @staticmethod
    def get_file_size(file_path: str) -> int:
        return os.path.getsize(file_path)