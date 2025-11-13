from datetime import datetime, timezone
import uuid
from sqlalchemy import (
    Column, String, Text, Enum, Integer, DateTime
)
from sqlalchemy.dialects.mysql import CHAR, VARCHAR
from sqlalchemy.ext.declarative import declarative_base

from app.db import Base

class Video(Base):
    __tablename__ = "videos"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(VARCHAR(255), nullable=False)
    description = Column(Text)
    status = Column(Enum("uploading", "processing", "ready", "failed"), nullable=False, default="uploading")

    s3_source_key = Column(VARCHAR(1024), nullable=False)
    s3_dest_prefix = Column(VARCHAR(1024))
    hls_master_key = Column(VARCHAR(1024))
    playback_url = Column(VARCHAR(2048))
    thumbnail_url = Column(VARCHAR(2048))

    duration_seconds = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
