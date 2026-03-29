from pydantic import BaseModel

from app.models.schemas.common import ClarityMode, ExplainableSignals, KeystrokeSignals


class ChatMessageRequest(BaseModel):
    session_id: str
    message: str
    keystroke_signals: KeystrokeSignals | None = None


class ChatMessageResponse(BaseModel):
    turn_id: str
    ai_message: str
    clarity_mode: ClarityMode
    clarity_score: float
    crisis_flag: bool = False
    linguistic_signals: dict
    indicator_scores: dict[str, float]
    explainable_signals: ExplainableSignals
