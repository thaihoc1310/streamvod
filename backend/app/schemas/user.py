from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# User Registration Schema
class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, pattern="^[a-zA-Z0-9_-]+$")
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)

# User Login Schema
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Token Response Schema
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# Token Data for JWT payload
class TokenData(BaseModel):
    user_id: Optional[str] = None

# User Profile Schema (Public)
class UserProfile(BaseModel):
    model_config = ConfigDict(json_encoders={datetime: lambda v: v.isoformat()})
    
    id: str
    username: str
    profile_picture: Optional[str] = None
    created_at: datetime

# User Detail Schema (Private - includes email)
class UserDetail(BaseModel):
    model_config = ConfigDict(json_encoders={datetime: lambda v: v.isoformat()})
    
    id: str
    username: str
    email: str
    profile_picture: Optional[str] = None
    created_at: datetime
    updated_at: datetime

# Uploader Info Schema (for video details)
class UploaderInfo(BaseModel):
    id: str
    username: str
    profile_picture: Optional[str] = None

