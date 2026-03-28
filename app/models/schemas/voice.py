from pydantic import BaseModel

from app.models.schemas.common import ClarityMode


class TranscribeResponse(BaseModel):
    transcript: str
    confidence: float
    duration_seconds: float | None = None


class SynthesiseRequest(BaseModel):
    text: str
    voice: str | None = None
    session_id: str


class VoiceTurnResponse(BaseModel):
    session_id: str
    turn_id: str
    transcript: str
    ai_text: str
    clarity_mode: ClarityMode
    clarity_score: float
    crisis_flag: bool = False
    audio_url: str | None = None
    processing_ms: dict
