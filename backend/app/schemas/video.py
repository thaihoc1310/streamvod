
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

from app.schemas.user import UploaderInfo

# healper schema
class presignedresponse(BaseModel):
    url: str
    fields: dict

# main schemas
class VideoItem(BaseModel):
    model_config = ConfigDict(json_encoders={datetime: lambda v: v.isoformat()})
    
    id: str
    title: str
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    status: str
    duration_seconds: Optional[int] = None
    views: int = 0
    created_at:  datetime
    uploader: Optional[UploaderInfo] = None

class VideoDetail(BaseModel):
    model_config = ConfigDict(json_encoders={datetime: lambda v: v.isoformat()})
    
    id: str
    title: str
    description: Optional[str] = None
    status: str
    duration_seconds: Optional[int] = None
    views: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

    thumbnail_url: Optional[str] = None
    playback_url: Optional[str] = None

    s3_source_key: Optional[str] = None
    s3_dest_prefix: Optional[str] = None
    hls_master_key: Optional[str] = None
    
    # Engagement fields
    uploader: Optional[UploaderInfo] = None
    like_count: int = 0
    is_liked: bool = False
    is_watch_later: bool = False

class VideoCreate(BaseModel):
    video_id: str
    s3_source_key: str
    presigned: presignedresponse

class VideoUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = None

# summary schemas
class VideoListResponse(BaseModel):
    page: int
    per_page: int
    total_items: int
    total_pages: int
    has_next: bool
    has_prev: bool
    videos: Optional[list[VideoItem]] = None