import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.db.message import Message


class MessageRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_recent(self, session_id: uuid.UUID, limit: int = 20) -> list[dict]:
        result = await self.db.execute(
            select(Message)
            .where(Message.session_id == session_id)
            .order_by(Message.created_at.desc())
            .limit(limit)
        )
        messages = list(result.scalars().all())
        messages.reverse()
        return [{"role": m.role, "content": m.content} for m in messages]

    async def get_for_sessions(self, session_ids: list[uuid.UUID]) -> list[Message]:
        result = await self.db.execute(
            select(Message)
            .where(Message.session_id.in_(session_ids))
            .order_by(Message.created_at)
        )
        return list(result.scalars().all())

    async def save_turn(
        self,
        session_id: uuid.UUID,
        user_text: str,
        ai_text: str,
        input_modality: str = "voice",
        linguistic_signals: dict | None = None,
        keystroke_signals: dict | None = None,
        clarity_score: float | None = None,
        clarity_mode: str | None = None,
    ) -> tuple[Message, Message]:
        user_msg = Message(
            session_id=session_id,
            role="user",
            content=user_text,
            input_modality=input_modality,
            clarity_mode=clarity_mode,
            clarity_score=clarity_score,
            linguistic_signals=linguistic_signals,
            keystroke_signals=keystroke_signals,
        )
        ai_msg = Message(
            session_id=session_id,
            role="assistant",
            content=ai_text,
            input_modality="text",
            clarity_mode=clarity_mode,
            clarity_score=clarity_score,
        )
        self.db.add(user_msg)
        self.db.add(ai_msg)
        await self.db.commit()
        await self.db.refresh(user_msg)
        return user_msg, ai_msg
