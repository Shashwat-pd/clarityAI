"""Initial schema

Revision ID: 001
Revises: None
Create Date: 2026-03-28

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("student_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("consent_given", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("student_context", postgresql.JSONB(), server_default=sa.text("'{}'")),
        sa.Column("session_hour", sa.Integer(), nullable=True),
        sa.Column("message_count", sa.Integer(), server_default=sa.text("0")),
    )

    op.create_table(
        "messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("sessions.id", ondelete="CASCADE")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("input_modality", sa.String(10), server_default=sa.text("'voice'")),
        sa.Column("clarity_mode", sa.String(20), nullable=True),
        sa.Column("clarity_score", sa.Float(), nullable=True),
        sa.Column("linguistic_signals", postgresql.JSONB(), nullable=True),
        sa.Column("keystroke_signals", postgresql.JSONB(), nullable=True),
    )

    op.create_table(
        "clarity_signals",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("sessions.id", ondelete="CASCADE")),
        sa.Column("message_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("messages.id", ondelete="CASCADE"), nullable=True),
        sa.Column("recorded_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("clarity_score", sa.Float(), nullable=False),
        sa.Column("clarity_mode", sa.String(20), nullable=False),
        sa.Column("raw_signals", postgresql.JSONB(), nullable=True),
    )

    op.create_table(
        "briefs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("student_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("generated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("period_start", sa.DateTime(timezone=True), nullable=True),
        sa.Column("period_end", sa.DateTime(timezone=True), nullable=True),
        sa.Column("session_count", sa.Integer(), nullable=True),
        sa.Column("content", postgresql.JSONB(), nullable=False),
        sa.Column("pdf_bytes", sa.LargeBinary(), nullable=True),
        sa.Column("crisis_flagged", sa.Boolean(), server_default=sa.text("false")),
    )


def downgrade() -> None:
    op.drop_table("briefs")
    op.drop_table("clarity_signals")
    op.drop_table("messages")
    op.drop_table("sessions")
