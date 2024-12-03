# backend/app/routers/messages.py
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List
import json
from ..database import get_db
from ..models.message import Message
from ..schemas.message import MessageCreate, MessageResponse
from .auth import get_current_user
import uuid

router = APIRouter()

# Aktif WebSocket bağlantılarını tutacak sözlük
active_connections = {}

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await websocket.accept()
    active_connections[user_id] = websocket
    
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Mesajı alıcıya ilet
            if message_data["receiver_id"] in active_connections:
                receiver_ws = active_connections[message_data["receiver_id"]]
                await receiver_ws.send_text(data)
                
    except WebSocketDisconnect:
        del active_connections[user_id]

@router.post("/messages/", response_model=MessageResponse)
async def create_message(
    message: MessageCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    db_message = Message(
        id=str(uuid.uuid4()),
        content=message.content,
        encrypted_content="", # Şimdilik boş, sonra şifreleme ekleyeceğiz
        sender_id=current_user.id,
        receiver_id=message.receiver_id
    )
    
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    
    return db_message

@router.get("/messages/{user_id}", response_model=List[MessageResponse])
async def get_messages(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    # Kullanıcının gönderdiği ve aldığı tüm mesajları getir
    messages = db.query(Message).filter(
        ((Message.sender_id == current_user.id) & (Message.receiver_id == user_id)) |
        ((Message.sender_id == user_id) & (Message.receiver_id == current_user.id))
    ).order_by(Message.timestamp.asc()).all()
    
    return messages

@router.put("/messages/{message_id}/read")
async def mark_as_read(
    message_id: str,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
        
    if message.receiver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    message.is_read = True
    db.commit()
    
    return {"status": "success"}