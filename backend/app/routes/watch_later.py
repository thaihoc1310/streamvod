from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.video import Video
from app.models.watch_later import WatchLater
from app.schemas.video import VideoItem
from app.schemas.user import UploaderInfo
from app.utils.video_utils import get_db
from app.utils.auth_middleware import get_current_user

router = APIRouter()

@router.post("/{video_id}/watch-later")
def toggle_watch_later(
    video_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Toggle watch later for a video (add if not added, remove if already added)
    """
    # Check if video exists
    video = db.get(Video, video_id)
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    
    # Check if user has already added the video to watch later
    stmt = select(WatchLater).where(
        WatchLater.video_id == video_id,
        WatchLater.user_id == current_user.id
    )
    existing_watch_later = db.execute(stmt).scalar_one_or_none()
    
    if existing_watch_later:
        # Remove from watch later
        db.delete(existing_watch_later)
        db.commit()
        
        return {
            "message": "Removed from watch later",
            "is_watch_later": False
        }
    else:
        # Add to watch later
        new_watch_later = WatchLater(
            user_id=current_user.id,
            video_id=video_id
        )
        db.add(new_watch_later)
        db.commit()
        
        return {
            "message": "Added to watch later",
            "is_watch_later": True
        }

@router.get("/me/watch-later")
def get_watch_later_videos(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all videos in the current user's watch later list
    """
    # Get all watch later entries for the current user, ordered by most recent first
    stmt = (
        select(WatchLater)
        .where(WatchLater.user_id == current_user.id)
        .order_by(WatchLater.added_at.desc())
    )
    watch_later_items = db.execute(stmt).scalars().all()
    
    videos = []
    for item in watch_later_items:
        video = item.video
        if video and video.status == "ready":
            uploader_info = None
            if video.uploader:
                uploader_info = UploaderInfo(
                    id=video.uploader.id,
                    username=video.uploader.username,
                    profile_picture=video.uploader.profile_picture
                )
            
            videos.append(VideoItem(
                id=video.id,
                title=video.title,
                description=video.description,
                thumbnail_url=video.thumbnail_url,
                status=video.status,
                duration_seconds=video.duration_seconds,
                created_at=video.created_at,
                uploader=uploader_info
            ))
    
    return {
        "total": len(videos),
        "videos": videos
    }

