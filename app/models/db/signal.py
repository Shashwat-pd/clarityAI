import uuid
from datetime import datetime

from sqlalchemy import String, Float, DateTime, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.db.base import Base


class ClaritySignal(Base):
    __tablename__ = "clarity_signals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"))
    message_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("messages.id", ondelete="CASCADE"), nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    clarity_score: Mapped[float] = mapped_column(Float, nullable=False)
    clarity_mode: Mapped[str] = mapped_column(String(20), nullable=False)
    raw_signals: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    session = relationship("Session", back_populates="clarity_signals")
