import math
from typing import Optional
import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.schemas.video import VideoCreate, VideoDetail, VideoItem, VideoListResponse, VideoUpdate, presignedresponse
from app.utils.video_utils import get_db
from app.models.video import Video
from app.utils.s3_utils import generate_presigned_post

router = APIRouter()

@router.get("/videos", response_model = VideoListResponse)
def list_videos(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    q: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    cmd = select(Video).where(Video.status == "ready")
    if q:
        cmd = cmd.where(Video.title.ilike(f"%{q}%"))

    total_items = db.execute(
        select(func.count()).select_from(cmd.subquery())
    ).scalar_one()

    cmd = cmd.order_by(Video.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    results = db.execute(cmd).scalars().all()

    item = []
    for video in results:
        item.append(
            VideoItem(
                id=video.id,
                title=video.title,
                description=video.description,
                thumbnail_url=video.thumbnail_url,
                status=video.status,
                duration_seconds=video.duration_seconds,
                created_at=video.created_at
            )
        )
    return VideoListResponse(
        page=page,
        per_page=per_page,
        total_items=total_items,
        total_pages= max(math.ceil(total_items / per_page), 1) if total_items else 1,
        has_next=page * per_page < total_items,
        has_prev=page > 1,
        videos=item
    )

@router.get("/videos/{id}", response_model=VideoDetail)
def get_video(id: str, db: Session = Depends(get_db)):
    video = db.get(Video, id)
    if not video or video.status != "ready":
        return None
    
    return VideoDetail(
        id=video.id,
        title=video.title,
        description=video.description,
        status=video.status,
        duration_seconds=video.duration_seconds,
        created_at=video.created_at,
        updated_at=video.updated_at,
        thumbnail_url=video.thumbnail_url,
        playback_url=video.playback_url,
        s3_source_key=video.s3_source_key,
        s3_dest_prefix=video.s3_dest_prefix,
        hls_master_key=video.hls_master_key
    )

@router.put("/videos/{id}", response_model=VideoDetail)
def update_video(
    id: str,
    info_new: VideoUpdate,
    db: Session = Depends(get_db)
):
    video = db.get(Video, id)
    if not video:
        return None
    if info_new.title is not None:
        video.title = info_new.title
    if info_new.description is not None:
        video.description = info_new.description
    db.add(video)
    db.commit()
    db.refresh(video)
    
    return VideoDetail(
        id=video.id,
        title=video.title,
        description=video.description,
        status=video.status,
        duration_seconds=video.duration_seconds,
        created_at=video.created_at,
        updated_at=video.updated_at,
        thumbnail_url=video.thumbnail_url,
        playback_url=video.playback_url,
        s3_source_key=video.s3_source_key,
        s3_dest_prefix=video.s3_dest_prefix,
        hls_master_key=video.hls_master_key
    )

@router.post("/video/initiate", response_model=VideoCreate)
def initiate_video_upload(
    db: Session = Depends(get_db)
):
    vid = str(uuid.uuid4())
    s3_source_key = f"uploads/{vid}.mp4"

    video = Video(
        id=vid,
        title="",
        description="",
        status="uploading",
        s3_source_key=s3_source_key,
        s3_dest_prefix=f"videos/{vid}/",
    )
    db.add(video)
    db.commit()

    try:
        presigned = generate_presigned_post(s3_source_key, content_type="video/mp4")
    except Exception as e:
        db.delete(video)
        db.commit()
        raise Exception(f"Failed to generate presigned URL: {str(e)}")

    return VideoCreate(
        video_id=vid,
        s3_source_key=s3_source_key,
        presigned=presignedresponse(
            url=presigned["url"],
            fields=presigned["fields"]
        )
    )