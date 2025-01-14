# backend/app/models/message.py
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from ..database import Base

class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, index=True)
    content = Column(String)
    encrypted_content = Column(String)
    sender_id = Column(String, ForeignKey("users.id"))
    receiver_id = Column(String, ForeignKey("users.id"))
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())