from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.video import Video
from app.models.like import Like
from app.schemas.video import VideoItem
from app.schemas.user import UploaderInfo
from app.utils.video_utils import get_db
from app.utils.auth_middleware import get_current_user

router = APIRouter()

@router.post("/{video_id}/like")
def toggle_like(
    video_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Toggle like on a video (like if not liked, unlike if already liked)
    """
    # Check if video exists
    video = db.get(Video, video_id)
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    
    # Check if user has already liked the video
    stmt = select(Like).where(
        Like.video_id == video_id,
        Like.user_id == current_user.id
    )
    existing_like = db.execute(stmt).scalar_one_or_none()
    
    if existing_like:
        # Unlike - delete the like
        db.delete(existing_like)
        db.commit()
        
        # Get updated like count
        like_count = db.execute(
            select(func.count()).select_from(Like).where(Like.video_id == video_id)
        ).scalar_one()
        
        return {
            "message": "Video unliked",
            "is_liked": False,
            "like_count": like_count
        }
    else:
        # Like - create new like
        new_like = Like(
            user_id=current_user.id,
            video_id=video_id
        )
        db.add(new_like)
        db.commit()
        
        # Get updated like count
        like_count = db.execute(
            select(func.count()).select_from(Like).where(Like.video_id == video_id)
        ).scalar_one()
        
        return {
            "message": "Video liked",
            "is_liked": True,
            "like_count": like_count
        }

@router.get("/{video_id}/likes")
def get_video_likes(
    video_id: str,
    db: Session = Depends(get_db)
):
    """
    Get like count for a specific video
    """
    # Check if video exists
    video = db.get(Video, video_id)
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found"
        )
    
    like_count = db.execute(
        select(func.count()).select_from(Like).where(Like.video_id == video_id)
    ).scalar_one()
    
    return {
        "video_id": video_id,
        "like_count": like_count
    }

@router.get("/me/liked-videos")
def get_liked_videos(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all videos liked by the current user
    """
    # Get all likes for the current user, ordered by most recent first
    stmt = (
        select(Like)
        .where(Like.user_id == current_user.id)
        .order_by(Like.created_at.desc())
    )
    likes = db.execute(stmt).scalars().all()
    
    videos = []
    for like in likes:
        video = like.video
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
                views=video.views,
                created_at=video.created_at,
                uploader=uploader_info
            ))
    
    return {
        "total": len(videos),
        "videos": videos
    }

