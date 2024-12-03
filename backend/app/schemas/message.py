# backend/app/schemas/message.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class MessageBase(BaseModel):
    content: str

class MessageCreate(MessageBase):
    receiver_id: str

class MessageResponse(MessageBase):
    id: str
    sender_id: str
    receiver_id: str
    timestamp: datetime
    is_read: bool

    class Config:
        from_attributes = True