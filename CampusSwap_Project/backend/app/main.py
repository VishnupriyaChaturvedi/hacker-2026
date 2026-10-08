"""CampusSwap FastAPI application entry point.

Run with:
    uvicorn app.main:app --reload

Interactive docs: http://127.0.0.1:8000/docs
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import Base, SessionLocal, engine
from .routers import auth, chats, listings, meta, users
from .seed import seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables and seed demo data on first boot.
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed(db)
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Backend for the CampusSwap campus marketplace (Python / FastAPI).",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["health"])
def root() -> dict:
    return {"status": "ok", "service": settings.app_name, "docs": "/docs"}


@app.get("/health", tags=["health"])
def health() -> dict:
    return {"status": "healthy"}


for router in (meta.router, auth.router, listings.router, chats.router, users.router):
    app.include_router(router, prefix=settings.api_prefix)
