from fastapi import APIRouter
from sqlalchemy import func, select

from app.db import SessionLocal

router = APIRouter()

@router.get("/healthz")
def health_check():
    db = SessionLocal()
    try:
        tmp = db.execute(select(func.now())).scalar()
        return {"status": "ok", "db": "ok", "timestamp": str(tmp)}
    except Exception as e:
        return {"status": "error", "db": "error", "detail": str(e)}
    finally:
        db.close()
        