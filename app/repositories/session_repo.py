import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.db.session import Session


class SessionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, student_id: uuid.UUID | None = None, consent_given: bool = True) -> Session:
        session = Session(
            student_id=student_id or uuid.uuid4(),
            consent_given=consent_given,
            session_hour=datetime.now(timezone.utc).hour,
        )
        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)
        return session

    async def get(self, session_id: uuid.UUID) -> Session | None:
        result = await self.db.execute(select(Session).where(Session.id == session_id))
        return result.scalar_one_or_none()

    async def get_for_student(self, student_id: uuid.UUID, days_back: int = 30) -> list[Session]:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days_back)
        result = await self.db.execute(
            select(Session)
            .where(Session.student_id == student_id, Session.created_at >= cutoff)
            .order_by(Session.created_at)
        )
        return list(result.scalars().all())

    async def increment_message_count(self, session_id: uuid.UUID) -> None:
        session = await self.get(session_id)
        if session:
            session.message_count += 1
            await self.db.commit()
