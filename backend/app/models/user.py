from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.mysql import CHAR, VARCHAR
from sqlalchemy.orm import relationship

from app.db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(VARCHAR(50), unique=True, nullable=False, index=True)
    email = Column(VARCHAR(255), unique=True, nullable=False, index=True)
    password_hash = Column(VARCHAR(255), nullable=False)
    profile_picture = Column(VARCHAR(2048))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    videos = relationship("Video", back_populates="uploader", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="user", cascade="all, delete-orphan")
    watch_later = relationship("WatchLater", back_populates="user", cascade="all, delete-orphan")

