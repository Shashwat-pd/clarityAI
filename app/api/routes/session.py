import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.models.schemas.session import SessionCreateRequest, SessionResponse
from app.repositories.session_repo import SessionRepository

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("", response_model=SessionResponse)
async def create_session(
    request: SessionCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    repo = SessionRepository(db)
    student_id = uuid.UUID(request.student_id) if request.student_id else None
    session = await repo.create(student_id=student_id, consent_given=request.consent_given)
    return SessionResponse(
        session_id=str(session.id),
        student_id=str(session.student_id),
        created_at=session.created_at,
        clarity_mode=None,
        clarity_score=None,
        message_count=session.message_count,
    )


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
):
    repo = SessionRepository(db)
    session = await repo.get(uuid.UUID(session_id))
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return SessionResponse(
        session_id=str(session.id),
        student_id=str(session.student_id),
        created_at=session.created_at,
        clarity_mode=None,
        clarity_score=None,
        message_count=session.message_count,
        signals=session.student_context,
    )
