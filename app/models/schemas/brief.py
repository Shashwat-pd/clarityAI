from datetime import datetime

from pydantic import BaseModel


class BriefGenerateRequest(BaseModel):
    student_id: str
    session_ids: list[str] | None = None
    days_back: int | None = None


class BriefResponse(BaseModel):
    brief_id: str
    student_id: str
    generated_at: datetime
    period_start: datetime | None = None
    period_end: datetime | None = None
    session_count: int
    sections: dict
    status: str = "ready"
    crisis_flagged: bool = False
