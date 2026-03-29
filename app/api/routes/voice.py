import json
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.dependencies import get_db
from app.integrations.deepgram_client import DeepgramSTTClient
from app.integrations.gemini_client import GeminiClient
from app.integrations.gemini_tts_client import GeminiTTSClient
from app.models.schemas.voice import TranscribeResponse, VoiceTurnResponse
from app.repositories.message_repo import MessageRepository
from app.repositories.session_repo import SessionRepository
from app.repositories.signal_repo import SignalRepository
from app.services.cognitive_engine import CognitiveEngine
from app.services.linguistic_classifier import LinguisticClassifier
from app.services.llm_service import LLMService
from app.services.voice_service import VoiceService
from app.utils.audio import normalize_mimetype

router = APIRouter(prefix="/voice", tags=["voice"])

# In-memory store for audio from voice turns (for /voice/audio/{turn_id} retrieval)
_audio_cache: dict[str, bytes] = {}


def _build_voice_service(db: AsyncSession) -> VoiceService:
    gemini = GeminiClient(settings.GEMINI_API_KEY)
    return VoiceService(
        deepgram=DeepgramSTTClient(settings.DEEPGRAM_API_KEY),
        gemini_tts=GeminiTTSClient(settings.GEMINI_API_KEY),
        llm_service=LLMService(gemini),
        linguistic_classifier=LinguisticClassifier(gemini),
        cognitive_engine=CognitiveEngine(SignalRepository(db)),
        session_repo=SessionRepository(db),
        message_repo=MessageRepository(db),
    )


@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_audio(
    audio: UploadFile = File(...),
    session_id: str = Form(...),
    language: str = Form("en-US"),
    db: AsyncSession = Depends(get_db),
):
    audio_bytes = await audio.read()
    mimetype = normalize_mimetype(audio.content_type or "audio/webm")
    client = DeepgramSTTClient(settings.DEEPGRAM_API_KEY)
    result = await client.transcribe_file(audio_bytes, mimetype)
    return TranscribeResponse(
        transcript=result["transcript"],
        confidence=result["confidence"],
        duration_seconds=result.get("duration"),
    )


@router.post("/synthesise")
async def synthesise_speech(
    text: str = Form(...),
    session_id: str = Form(...),
    voice: str = Form(None),
    db: AsyncSession = Depends(get_db),
):
    tts = GeminiTTSClient(settings.GEMINI_API_KEY)
    from app.utils.audio import pcm_to_mp3

    pcm = await tts.synthesise(text=text, mode="guidance")
    mp3_bytes = pcm_to_mp3(pcm)
    return Response(content=mp3_bytes, media_type="audio/mpeg")


@router.post("/turn")
async def voice_turn(
    audio: UploadFile = File(...),
    session_id: str = Form(...),
    keystroke_signals: str = Form(None),
    response_mode: str = Form("json"),
    db: AsyncSession = Depends(get_db),
):
    audio_bytes = await audio.read()
    mimetype = normalize_mimetype(audio.content_type or "audio/webm")

    ks = None
    if keystroke_signals:
        try:
            ks = json.loads(keystroke_signals)
        except json.JSONDecodeError:
            pass

    voice_service = _build_voice_service(db)
    result = await voice_service.process_voice_turn(
        session_id=session_id,
        audio_bytes=audio_bytes,
        audio_mimetype=mimetype,
        keystroke_signals=ks,
    )

    response_data = VoiceTurnResponse(
        session_id=session_id,
        turn_id=result.turn_id,
        transcript=result.transcript,
        ai_text=result.ai_text,
        clarity_mode=result.clarity_mode,
        clarity_score=result.clarity_score,
        crisis_flag=result.crisis_flag,
        processing_ms=result.processing_ms,
        indicator_scores=result.indicator_scores,
        explainable_signals=result.explainable_signals,
    )

    if response_mode == "url":
        _audio_cache[result.turn_id] = result.audio_bytes
        response_data.audio_url = f"/api/v1/voice/audio/{result.turn_id}"
        return response_data.model_dump()

    # Default: return JSON with audio as a separate downloadable endpoint
    _audio_cache[result.turn_id] = result.audio_bytes
    data = response_data.model_dump()
    data["audio_url"] = f"/api/v1/voice/audio/{result.turn_id}"
    return data


@router.get("/audio/{turn_id}")
async def get_turn_audio(turn_id: str):
    audio = _audio_cache.get(turn_id)
    if not audio:
        raise HTTPException(status_code=404, detail="Audio not found or expired")
    return Response(content=audio, media_type="audio/mpeg")
