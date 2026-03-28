import uuid
from datetime import datetime

from sqlalchemy import Boolean, Integer, DateTime, func, LargeBinary
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.db.base import Base


class Brief(Base):
    __tablename__ = "briefs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    period_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    period_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    session_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    content: Mapped[dict] = mapped_column(JSONB, nullable=False)
    pdf_bytes: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    crisis_flagged: Mapped[bool] = mapped_column(Boolean, default=False)
