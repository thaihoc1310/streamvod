from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.schemas.user import UserRegister, UserLogin, Token, UserDetail
from app.models.user import User
from app.utils.video_utils import get_db
from app.utils.auth_utils import get_password_hash, verify_password, create_access_token
from app.utils.auth_middleware import get_current_user

router = APIRouter()

@router.post("/register", response_model=UserDetail, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    Register a new user
    """
    # Check if username already exists
    stmt = select(User).where(User.username == user_data.username)
    existing_user = db.execute(stmt).scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists
    stmt = select(User).where(User.email == user_data.email)
    existing_user = db.execute(stmt).scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return UserDetail(
        id=new_user.id,
        username=new_user.username,
        email=new_user.email,
        profile_picture=new_user.profile_picture,
        created_at=new_user.created_at,
        updated_at=new_user.updated_at
    )

@router.post("/login", response_model=Token)
def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Login user and return JWT token
    """
    # Find user by email
    stmt = select(User).where(User.email == user_credentials.email)
    user = db.execute(stmt).scalar_one_or_none()
    
    if not user or not verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    return Token(access_token=access_token, token_type="bearer")

@router.get("/me", response_model=UserDetail)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user's profile
    """
    return UserDetail(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        profile_picture=current_user.profile_picture,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at
    )

@router.post("/logout")
def logout():
    """
    Logout user (client should delete the token)
    In a stateless JWT system, actual logout is handled on the client side
    This endpoint is here for completeness and can be extended for token blacklisting
    """
    return {"message": "Successfully logged out"}

