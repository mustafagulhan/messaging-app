# backend/app/routers/files.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Body
from fastapi.responses import StreamingResponse
from typing import List, Optional
from ..database import fs
from ..services.encryption import encryption_service
from ..services.file_encryption import file_encryption_service
from .auth import get_current_user
from bson import ObjectId
import io
import json
from datetime import datetime, timezone

router = APIRouter()

# Yardımcı fonksiyonlar
async def get_gridfs_file(file_id: str, check_owner: str = None):
    """GridFS'den dosya getir ve yetkiyi kontrol et"""
    try:
        cursor = fs.find({"_id": ObjectId(file_id)})
        file = await cursor.next()
        if check_owner:
            owner_id = file.metadata.get("owner_id") or file.metadata.get("created_by")
            if owner_id != check_owner:
                raise HTTPException(status_code=403, detail="Bu dosyaya erişim izniniz yok")
        return file
    except StopAsyncIteration:
        raise HTTPException(status_code=404, detail="Dosya bulunamadı")

async def create_gridfs_entry(filename: str, content: bytes, metadata: dict):
    """GridFS'e yeni dosya/klasör ekle"""
    try:
        file_id = await fs.upload_from_stream(
            filename,
            io.BytesIO(content),
            metadata=metadata
        )
        return str(file_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dosya kaydedilemedi: {str(e)}")

# API Endpoint'leri
@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    folder_id: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    try:
        print("\n=== UPLOAD FILE DEBUG ===")
        print(f"User ID: {current_user['id']}")
        print(f"File: {file.filename} ({file.content_type})")
        print(f"Folder ID: {folder_id}")
        
        contents = await file.read()
        encrypted_contents, encryption_key = file_encryption_service.encrypt_file(contents)
        
        metadata = {
            "filename": file.filename,
            "content_type": file.content_type,
            "size": len(contents),
            "owner_id": str(current_user["id"]),
            "folder_id": folder_id,
            "encryption_key": encryption_key,
            "upload_date": datetime.now(timezone.utc),
            "is_encrypted": True
        }
        
        print(f"Metadata prepared: {metadata}")
        
        file_id = await fs.upload_from_stream(
            file.filename,
            io.BytesIO(encrypted_contents),
            metadata=metadata
        )
        
        response_data = {
            "id": str(file_id),
            "name": file.filename,
            "type": file.content_type,
            "size": len(contents),
            "uploadedBy": str(current_user["id"]),
            "uploadDate": metadata["upload_date"].isoformat(),
            "isEncrypted": True
        }
        
        print(f"File uploaded successfully: {response_data}")
        print("=======================\n")
        
        return response_data
        
    except Exception as e:
        print(f"Error in upload_file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
async def list_files(
    folder_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        print("\n=== LIST FILES DEBUG ===")
        print(f"User ID: {current_user['id']}")
        print(f"Folder ID: {folder_id}")

        # Temel sorgu - "_folder" olmayanları getir
        base_query = {
            "metadata.owner_id": str(current_user["id"]),
            "filename": {"$ne": "_folder"}
        }

        # Eğer klasör ID'si varsa ekle
        if folder_id:
            base_query["metadata.folder_id"] = folder_id

        print(f"Query: {base_query}")
        cursor = fs.find(base_query)
        
        files = []
        async for doc in cursor:
            try:
                files.append({
                    "id": str(doc._id),
                    "name": doc.filename,
                    "type": doc.metadata.get("content_type"),
                    "size": doc.length,
                    "uploadedBy": doc.metadata.get("owner_id"),
                    "uploadDate": doc.metadata.get("upload_date").isoformat(),
                    "isEncrypted": doc.metadata.get("is_encrypted", False)
                })
                print(f"Added file: {doc.filename}")
            except Exception as e:
                print(f"Error processing file {doc._id}: {str(e)}")
                continue
        
        print(f"Total files found: {len(files)}")
        return files

    except Exception as e:
        print(f"Error listing files: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/download/{file_id}")
async def download_file(
    file_id: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        # Dosya kontrolü
        cursor = fs.find({"_id": ObjectId(file_id)})
        file = await cursor.next()
        
        if file.metadata.get("owner_id") != str(current_user["id"]):
            raise HTTPException(status_code=403, detail="Bu dosyaya erişim izniniz yok")

        # Dosya içeriğini oku
        file_data = await fs.open_download_stream(ObjectId(file_id))
        contents = await file_data.read()

        # Şifreliyse çöz
        if file.metadata.get("encryption_key"):
            try:
                contents = file_encryption_service.decrypt_file(
                    contents,
                    file.metadata["encryption_key"]
                )
            except Exception as e:
                print(f"Decryption error: {str(e)}")
                # Şifre çözme başarısız olursa orijinal içeriği gönder
                pass

        return StreamingResponse(
            io.BytesIO(contents),
            media_type=file.metadata.get("content_type", "application/octet-stream"),
            headers={
                "Content-Disposition": f'attachment; filename="{file.filename}"'
            }
        )

    except Exception as e:
        print(f"Error downloading file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/preview/{file_id}")
async def preview_file(file_id: str, current_user: dict = Depends(get_current_user)):
    try:
        print(f"\n=== PREVIEW FILE DEBUG ===")
        print(f"File ID: {file_id}")

        # Meta veriyi al
        cursor = fs.find({"_id": ObjectId(file_id)})
        file_info = await cursor.next()
        
        # Yetki kontrolü
        metadata = file_info.metadata if hasattr(file_info, 'metadata') else {}
        if str(current_user["id"]) != metadata.get("owner_id"):
            raise HTTPException(status_code=403, detail="Bu dosyaya erişim izniniz yok")

        # Dosyayı oku
        grid_out = await fs.open_download_stream(ObjectId(file_id))
        contents = await grid_out.read()

        # Eğer dosya şifreliyse çöz
        if metadata.get("is_encrypted"):
            encryption_key = metadata.get("encryption_key")
            if encryption_key:
                try:
                    contents = file_encryption_service.decrypt_file(contents, encryption_key)
                    print("File decrypted successfully")
                except Exception as e:
                    print(f"Decryption error: {str(e)}")
                    raise HTTPException(status_code=500, detail="Dosya çözülemedi")

        print("File read successfully, sending response")
        return StreamingResponse(
            io.BytesIO(contents),
            media_type=metadata.get("content_type", "application/octet-stream"),
            headers={
                "Content-Disposition": f'inline; filename="{file_info.filename}"'
            }
        )

    except Exception as e:
        print(f"Error in preview file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/files/{file_id}")
async def delete_file(
    file_id: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        print(f"\n=== Delete File Debug ===")
        print(f"File ID: {file_id}")
        print(f"User ID: {current_user['id']}")

        # Dosya kontrolü
        cursor = fs.find({"_id": ObjectId(file_id)})
        file = None
        try:
            file = await cursor.next()
            print(f"File found: {file.filename}")
        except StopAsyncIteration:
            print("File not found")
            raise HTTPException(status_code=404, detail="Dosya bulunamadı")

        # Yetki kontrolü
        owner_id = file.metadata.get("owner_id")
        print(f"File owner: {owner_id}")
        
        if owner_id != str(current_user["id"]):
            raise HTTPException(status_code=403, detail="Bu dosyayı silme yetkiniz yok")

        # Dosyayı sil
        await fs.delete(ObjectId(file_id))
        print("File deleted successfully")
        
        return {"message": "Dosya başarıyla silindi"}
    except Exception as e:
        print(f"Error deleting file: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/files/{file_id}")
async def get_file(file_id: str, current_user: dict = Depends(get_current_user)):
    try:
        print(f"\n=== GET FILE DEBUG ===")
        print(f"Getting file with ID: {file_id}")
        print(f"Current user: {current_user}")

        if not ObjectId.is_valid(file_id):
            print(f"Invalid ObjectID: {file_id}")
            raise HTTPException(status_code=400, detail="Geçersiz dosya ID'si")

        try:
            # GridFS'den dosyayı bul
            cursor = fs.find({"_id": ObjectId(file_id)})
            try:
                file_info = await cursor.next()
                print(f"File info metadata: {file_info.metadata}")
                
                # Yetki kontrolü
                metadata = file_info.metadata if hasattr(file_info, 'metadata') else {}
                owner_id = metadata.get("owner_id")
                print(f"File owner_id: {owner_id}, Current user id: {current_user['id']}")

                if str(current_user["id"]) != owner_id:
                    raise HTTPException(status_code=403, detail="Bu dosyaya erişim izniniz yok")

                # Dosyayı oku
                grid_out = await fs.open_download_stream(ObjectId(file_id))
                contents = await grid_out.read()

                print(f"File read, size before decryption: {len(contents)} bytes")

                # Şifreli dosyayı çöz
                if metadata.get("is_encrypted") and metadata.get("encryption_key"):
                    try:
                        print("Attempting to decrypt file...")
                        contents = file_encryption_service.decrypt_file(
                            contents,
                            metadata["encryption_key"]
                        )
                        print(f"File decrypted, new size: {len(contents)} bytes")
                    except Exception as e:
                        print(f"Decryption error: {str(e)}")
                        raise HTTPException(status_code=500, detail="Dosya çözülemedi")

                return StreamingResponse(
                    io.BytesIO(contents),
                    media_type=metadata.get("content_type", "application/octet-stream"),
                    headers={
                        "Content-Type": metadata.get("content_type", "application/octet-stream"),
                        "Content-Disposition": f'inline; filename="{file_info.filename}"',
                        "Cache-Control": "no-cache"
                    }
                )

            except StopAsyncIteration:
                print(f"File not found in cursor for ID: {file_id}")
                raise HTTPException(status_code=404, detail="Dosya bulunamadı")

        except Exception as inner_e:
            print(f"Inner error: {str(inner_e)}")
            raise inner_e

    except HTTPException as he:
        print(f"HTTP error: {str(he)}")
        raise he
    except Exception as e:
        print(f"Outer error in get_file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/folders")
async def create_folder(
    name: str = Body(..., embed=True),
    current_user: dict = Depends(get_current_user)
):
    try:
        if not name or not name.strip():
            raise HTTPException(status_code=400, detail="Klasör adı boş olamaz")
        
        name = name.strip()
        metadata = {
            "name": name,
            "created_by": str(current_user["id"]),
            "created_date": datetime.now(timezone.utc),
            "is_folder": True,
            "parent_id": None,
            "path": f"/{name}"
        }
        
        folder_id = await create_gridfs_entry("_folder", b"", metadata)
        
        return {
            "id": folder_id,
            "name": name,
            "createdBy": str(current_user["id"]),
            "createdDate": metadata["created_date"].isoformat()
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/folders")
async def list_folders(
    current_user: dict = Depends(get_current_user)
):
    try:
        cursor = fs.find({
            "filename": "_folder",
            "metadata.created_by": str(current_user["id"])
        })
        
        folders = []
        async for grid_out in cursor:
            folders.append({
                "id": str(grid_out._id),
                "name": grid_out.metadata.get("name"),
                "createdBy": grid_out.metadata.get("created_by"),
                "createdDate": grid_out.metadata.get("created_date").isoformat(),
                "parentId": grid_out.metadata.get("parent_id"),
                "path": grid_out.metadata.get("path")
            })
            
        return folders
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/folders/{folder_id}")
async def delete_folder(
    folder_id: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        folder = await get_gridfs_file(folder_id, str(current_user["id"]))
        path = folder.metadata.get("path", "")
        
        # Alt klasörleri ve dosyaları sil
        async for item in fs.find({"metadata.path": {"$regex": f"^{path}/"}}):
            await fs.delete(item._id)

        # Klasörü sil
        await fs.delete(ObjectId(folder_id))
        return {"message": "Klasör ve içeriği başarıyla silindi"}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/folders/{parent_id}/subfolders")
async def create_subfolder(
    parent_id: str,
    name: str = Body(..., embed=True),
    current_user: dict = Depends(get_current_user)
):
    try:
        print(f"\n=== Create Subfolder Debug ===")
        print(f"Parent ID: {parent_id}")
        print(f"Name: {name}")

        # Parent klasör kontrolü
        cursor = fs.find({"_id": ObjectId(parent_id), "filename": "_folder"})
        parent_folder = None
        try:
            parent_folder = await cursor.next()
        except StopAsyncIteration:
            raise HTTPException(status_code=404, detail="Üst klasör bulunamadı")

        if not name or not name.strip():
            raise HTTPException(status_code=400, detail="Klasör adı boş olamaz")
        
        name = name.strip()

        # Parent klasörün metadata'sını al
        parent_path = parent_folder.metadata.get("path", "")
        
        # Yeni klasör metadata'sı
        metadata = {
            "name": name,
            "created_by": str(current_user["id"]),
            "created_date": datetime.now(timezone.utc),
            "is_folder": True,
            "parent_id": parent_id,
            "path": f"{parent_path}/{name}",
        }
        
        print(f"Creating folder with metadata: {metadata}")
        
        file_id = await fs.upload_from_stream(
            "_folder",
            io.BytesIO(b""),
            metadata=metadata
        )
        
        print(f"Created folder with ID: {file_id}")
        
        return {
            "id": str(file_id),
            "name": name,
            "createdBy": str(current_user["id"]),
            "createdDate": metadata["created_date"].isoformat(),
            "parentId": parent_id,
            "path": metadata["path"]
        }
    except Exception as e:
        print(f"Error creating subfolder: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))