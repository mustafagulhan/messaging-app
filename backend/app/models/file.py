# backend/app/models/file.py
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey
from ..database import Base
from datetime import datetime

class File(Base):
    __tablename__ = "files"

    id = Column(String, primary_key=True)
    name = Column(String)
    type = Column(String)
    size = Column(Integer)
    path = Column(String)
    is_encrypted = Column(Boolean, default=True)
    salt = Column(String, nullable=True)
    uploaded_by = Column(String, ForeignKey("users.id"))
    folder_id = Column(String, ForeignKey("folders.id"), nullable=True)
    upload_date = Column(DateTime, default=datetime.utcnow)

class Folder(Base):
    __tablename__ = "folders"

    id = Column(String, primary_key=True)
    name = Column(String)
    created_by = Column(String, ForeignKey("users.id"))
    parent_id = Column(String, ForeignKey("folders.id"), nullable=True)
    created_date = Column(DateTime, default=datetime.utcnow)