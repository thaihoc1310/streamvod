import math
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy import func, select, or_
from sqlalchemy.orm import Session

from app.schemas.video import (
    VideoCreate,
    VideoDetail,
    VideoItem,
    VideoListResponse,
    VideoUpdate,
    presignedresponse,
)
from app.utils.video_utils import get_db
from app.models.video import Video
from app.utils.s3_utils import generate_presigned_post

router = APIRouter()

@router.get("", response_model = VideoListResponse)
def list_videos(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    q: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    try:
        base_query = select(Video).where(Video.status == "ready")
        if q:
            pattern = f"%{q}%"
            base_query = base_query.where(
                or_(
                    Video.title.ilike(pattern),
                    Video.description.ilike(pattern),
                )
            )

        total_items = db.execute(
            select(func.count()).select_from(base_query.subquery())
        ).scalar_one()

        query = (
            base_query.order_by(Video.created_at.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
        )
        results = db.execute(query).scalars().all()

        items = [
            VideoItem(
                id=v.id,
                title=v.title,
                description=v.description,
                thumbnail_url=v.thumbnail_url,
                status=v.status,
                duration_seconds=v.duration_seconds,
                created_at=v.created_at,
            )
            for v in results
        ]

        total_pages = math.ceil(total_items / per_page) if total_items > 0 else 0

        return VideoListResponse(
            page=page,
            per_page=per_page,
            total_items=total_items,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1,
            videos=items,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}",
        )

@router.get("/{id}", response_model=VideoDetail)
def get_video(id: str, db: Session = Depends(get_db)):
    try:
        video = db.get(Video, id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}",
        )

    if not video or video.status != "ready":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found",
        )

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
        hls_master_key=video.hls_master_key,
    )

@router.put("/{id}", response_model=VideoDetail)
def update_video(
    id: str,
    info_new: VideoUpdate,
    db: Session = Depends(get_db)
):
    try:
        video = db.get(Video, id)

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
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}",
        )

@router.post("/initiate", response_model=VideoCreate)
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
        s3_dest_prefix=f"hls/{vid}/",
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