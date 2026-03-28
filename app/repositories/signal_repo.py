import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.db.signal import ClaritySignal


class SignalRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_recent_scores(self, session_id: uuid.UUID, limit: int = 5) -> list[float]:
        result = await self.db.execute(
            select(ClaritySignal.clarity_score)
            .where(ClaritySignal.session_id == session_id)
            .order_by(ClaritySignal.recorded_at.desc())
            .limit(limit)
        )
        scores = [row[0] for row in result.all()]
        scores.reverse()
        return scores

    async def save_score(
        self,
        session_id: uuid.UUID,
        score: float,
        mode: str,
        message_id: uuid.UUID | None = None,
        raw_signals: dict | None = None,
    ) -> ClaritySignal:
        signal = ClaritySignal(
            session_id=session_id,
            message_id=message_id,
            clarity_score=score,
            clarity_mode=mode,
            raw_signals=raw_signals,
        )
        self.db.add(signal)
        await self.db.commit()
        await self.db.refresh(signal)
        return signal

    async def get_for_sessions(self, session_ids: list[uuid.UUID]) -> list[ClaritySignal]:
        result = await self.db.execute(
            select(ClaritySignal)
            .where(ClaritySignal.session_id.in_(session_ids))
            .order_by(ClaritySignal.recorded_at)
        )
        return list(result.scalars().all())
