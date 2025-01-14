# backend/app/schemas/message.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class MessageBase(BaseModel):
    content: str

class MessageCreate(BaseModel):
    content: str
    receiver_id: str
    encryption_type: str

class MessageResponse(BaseModel):
    id: str
    content: str
    sender_id: str
    receiver_id: str
    timestamp: str
    is_read: bool
    encryption_type: str

    class Config:
        from_attributes = True