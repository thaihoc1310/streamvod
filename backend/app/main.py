from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import health, videos, auth, likes, watch_later, users
import app.models
from app.db import Base, engine


app = FastAPI()

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    print("Database tables created")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# API Routes
app.include_router(auth.router, prefix="/auth", tags=["authentication"])
app.include_router(videos.router, prefix="/videos", tags=["videos"])
app.include_router(likes.router, prefix="/videos", tags=["likes"])
app.include_router(watch_later.router, prefix="/videos", tags=["watch-later"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(health.router, prefix="/health", tags=["health"])

