import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.schemas.common import ClarityMode


class SessionCreateRequest(BaseModel):
    student_id: str | None = None
    consent_given: bool = True


class SessionResponse(BaseModel):
    session_id: str
    student_id: str
    created_at: datetime
    clarity_mode: ClarityMode | None = None
    clarity_score: float | None = None
    message_count: int = 0
    signals: dict | None = None

    model_config = {"from_attributes": True}
