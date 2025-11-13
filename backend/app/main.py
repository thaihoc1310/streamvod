from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import health, videos
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
    allow_methods=["GET", "POST", "PUT", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(videos.router, prefix="/videos", tags=["videos"])
app.include_router(health.router, prefix="/health", tags=["health"])

