import uuid
from datetime import datetime

from sqlalchemy import String, Float, Text, DateTime, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.db.base import Base


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    input_modality: Mapped[str] = mapped_column(String(10), default="voice")
    clarity_mode: Mapped[str | None] = mapped_column(String(20), nullable=True)
    clarity_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    linguistic_signals: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    keystroke_signals: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    session = relationship("Session", back_populates="messages")
