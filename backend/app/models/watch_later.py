from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.orm import relationship

from app.db import Base

class WatchLater(Base):
    __tablename__ = "watch_later"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(CHAR(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    video_id = Column(CHAR(36), ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    added_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="watch_later")
    video = relationship("Video", back_populates="watch_later_items")

    # Ensure a user can only add a video to watch later once
    __table_args__ = (
        UniqueConstraint('user_id', 'video_id', name='unique_user_video_watch_later'),
    )

