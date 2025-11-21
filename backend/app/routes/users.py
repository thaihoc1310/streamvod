from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.video import Video
from app.schemas.user import UserProfile
from app.schemas.video import VideoItem
from app.schemas.user import UploaderInfo
from app.utils.video_utils import get_db

router = APIRouter()

@router.get("/{user_id}", response_model=UserProfile)
def get_user_profile(
    user_id: str,
    db: Session = Depends(get_db)
):
    """
    Get public profile of a user by ID
    """
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserProfile(
        id=user.id,
        username=user.username,
        profile_picture=user.profile_picture,
        created_at=user.created_at
    )

@router.get("/{user_id}/videos")
def get_user_videos(
    user_id: str,
    db: Session = Depends(get_db)
):
    """
    Get all videos uploaded by a specific user
    """
    # Check if user exists
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get all videos uploaded by the user (only ready videos)
    stmt = (
        select(Video)
        .where(Video.uploader_id == user_id, Video.status == "ready")
        .order_by(Video.created_at.desc())
    )
    videos = db.execute(stmt).scalars().all()
    
    uploader_info = UploaderInfo(
        id=user.id,
        username=user.username,
        profile_picture=user.profile_picture
    )
    
    video_items = [
        VideoItem(
            id=v.id,
            title=v.title,
            description=v.description,
            thumbnail_url=v.thumbnail_url,
            status=v.status,
            duration_seconds=v.duration_seconds,
            created_at=v.created_at,
            uploader=uploader_info
        )
        for v in videos
    ]
    
    return {
        "user": UserProfile(
            id=user.id,
            username=user.username,
            profile_picture=user.profile_picture,
            created_at=user.created_at
        ),
        "total": len(video_items),
        "videos": video_items
    }

