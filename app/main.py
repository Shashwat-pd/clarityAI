import logging

from fastapi import FastAPI, Depends, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.routes import health, session, voice, chat, brief
from app.api.websocket.voice_ws import voice_websocket_handler
from app.dependencies import get_db

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="ClarityAI",
    description="Cognitive-Adaptive Career Guidance Platform — Backend API",
    version="1.0.0",
)

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",  # Expo web dev server
        "http://localhost:19006",  # Alternative Expo port
        "http://127.0.0.1:8081",
        "http://127.0.0.1:19006",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routes under /api/v1
app.include_router(health.router, prefix="/api/v1")
app.include_router(session.router, prefix="/api/v1")
app.include_router(voice.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(brief.router, prefix="/api/v1")


@app.websocket("/ws/voice/{session_id}")
async def websocket_voice(websocket: WebSocket, session_id: str, db: AsyncSession = Depends(get_db)):
    await voice_websocket_handler(websocket, session_id, db)


@app.get("/")
async def root():
    return {"name": "ClarityAI", "version": "1.0.0", "docs": "/docs"}
