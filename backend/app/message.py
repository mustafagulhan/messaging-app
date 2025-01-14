# backend/app/models/message.py
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from ..database import Base
from datetime import datetime

class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True)
    content = Column(String)
    encrypted_content = Column(String)
    sender_id = Column(String, ForeignKey("users.id"))
    receiver_id = Column(String, ForeignKey("users.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    is_read = Column(Boolean, default=False)