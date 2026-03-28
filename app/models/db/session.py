import uuid
from datetime import datetime

from sqlalchemy import String, Boolean, Integer, DateTime, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.db.base import Base


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, default=uuid.uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    consent_given: Mapped[bool] = mapped_column(Boolean, default=False)
    student_context: Mapped[dict] = mapped_column(JSONB, default=dict)
    session_hour: Mapped[int | None] = mapped_column(Integer, nullable=True)
    message_count: Mapped[int] = mapped_column(Integer, default=0)

    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan")
    clarity_signals = relationship("ClaritySignal", back_populates="session", cascade="all, delete-orphan")

    def to_metadata_dict(self) -> dict:
        return {
            "session_hour": self.session_hour or self.created_at.hour,
            "message_count": self.message_count,
        }
