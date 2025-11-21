from datetime import datetime, timezone
import uuid
from sqlalchemy import (
    Column, String, Text, Enum, Integer, DateTime, ForeignKey
)
from sqlalchemy.dialects.mysql import CHAR, VARCHAR
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

from app.db import Base

class Video(Base):
    __tablename__ = "videos"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(VARCHAR(255), nullable=False)
    description = Column(Text)
    status = Column(Enum("processing", "ready", "failed"), nullable=False, default="processing")
    
    # Foreign key to user who uploaded the video
    uploader_id = Column(CHAR(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    s3_source_key = Column(VARCHAR(1024), nullable=False)
    s3_dest_prefix = Column(VARCHAR(1024))
    hls_master_key = Column(VARCHAR(1024))
    playback_url = Column(VARCHAR(2048))
    thumbnail_url = Column(VARCHAR(2048))

    duration_seconds = Column(Integer)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    uploader = relationship("User", back_populates="videos")
    likes = relationship("Like", back_populates="video", cascade="all, delete-orphan")
    watch_later_items = relationship("WatchLater", back_populates="video", cascade="all, delete-orphan")
