from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import health, videos

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(videos.router, prefix="/videos", tags=["videos"])
app.include_router(health.router, prefix="/health", tags=["health"])