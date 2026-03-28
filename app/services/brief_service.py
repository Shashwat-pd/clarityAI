import uuid
from datetime import datetime, timezone

from app.integrations.gemini_client import GeminiClient
from app.models.db.brief import Brief
from app.repositories.message_repo import MessageRepository
from app.repositories.session_repo import SessionRepository
from app.repositories.signal_repo import SignalRepository

BRIEF_LANGUAGE_RULES = """
CRITICAL LANGUAGE REQUIREMENTS:
- Never use clinical diagnostic language
- Never say "the student has anxiety" — say "behavioural signals consistent with elevated stress were observed"
- Never say "rumination detected" — say "the student returned to this theme X times without resolution — this may reflect rumination"
- Never assign numerical scores to the student
- Always use uncertainty framing: "may indicate", "consistent with", "observed", "suggested by"
- Never recommend therapy or clinical referral — use "the counsellor may wish to explore..."
- All statements must be behavioural observations, not character assessments
"""


class BriefService:
    def __init__(
        self,
        gemini: GeminiClient,
        session_repo: SessionRepository,
        message_repo: MessageRepository,
        signal_repo: SignalRepository,
        db,
    ):
        self.gemini = gemini
        self.session_repo = session_repo
        self.message_repo = message_repo
        self.signal_repo = signal_repo
        self.db = db

    async def generate(
        self,
        student_id: str,
        session_ids: list[str] | None = None,
        days_back: int = 30,
    ) -> Brief:
        sid = uuid.UUID(student_id)

        if session_ids:
            from sqlalchemy import select
            from app.models.db.session import Session as SessionModel
            result = await self.db.execute(
                select(SessionModel).where(SessionModel.id.in_([uuid.UUID(s) for s in session_ids]))
            )
            sessions = list(result.scalars().all())
        else:
            sessions = await self.session_repo.get_for_student(sid, days_back)

        if not sessions:
            raise ValueError("No sessions found for this student in the specified period")

        s_ids = [s.id for s in sessions]
        all_messages = await self.message_repo.get_for_sessions(s_ids)
        all_signals = await self.signal_repo.get_for_sessions(s_ids)

        # Build conversation summary for Gemini
        conversation_text = "\n".join(
            f"[{m.role.upper()}] {m.content}" for m in all_messages
        )

        # Generate each section
        overview = await self._generate_section(
            "session_overview",
            f"Write a 2-3 sentence overview of {len(sessions)} counselling sessions with {len(all_messages)} total messages. "
            f"Sessions span from {sessions[0].created_at.date()} to {sessions[-1].created_at.date()}.\n\n"
            f"{BRIEF_LANGUAGE_RULES}",
        )

        concerns = await self._generate_section(
            "core_concerns",
            f"Based on the following conversation transcript, identify 3-5 core concerns the student has expressed. "
            f"Return as a JSON array of strings.\n\n{BRIEF_LANGUAGE_RULES}\n\nTranscript:\n{conversation_text[:4000]}",
        )

        signal_summary = self._summarize_signals(all_signals)

        trajectory = await self._generate_section(
            "trajectory",
            f"Describe the trajectory of the student's cognitive clarity over {len(sessions)} sessions. "
            f"Signal summary: {signal_summary}\n\n{BRIEF_LANGUAGE_RULES}",
        )

        focus_areas = await self._generate_section(
            "focus_areas",
            f"Based on the concerns and trajectory, suggest 3-5 focus areas for the counsellor's next session. "
            f"Return as a JSON array of strings.\n\nConcerns: {concerns}\nTrajectory: {trajectory}\n\n{BRIEF_LANGUAGE_RULES}",
        )

        content = {
            "session_overview": overview,
            "core_concerns": concerns,
            "behavioural_signals": signal_summary,
            "trajectory": trajectory,
            "suggested_focus_areas": focus_areas,
        }

        period_start = sessions[0].created_at if sessions else None
        period_end = sessions[-1].created_at if sessions else None

        brief = Brief(
            student_id=sid,
            generated_at=datetime.now(timezone.utc),
            period_start=period_start,
            period_end=period_end,
            session_count=len(sessions),
            content=content,
            crisis_flagged=any(
                s.clarity_mode == "grounding"
                for s in all_signals
                if hasattr(s, "clarity_mode")
            ),
        )
        self.db.add(brief)
        await self.db.commit()
        await self.db.refresh(brief)
        return brief

    async def _generate_section(self, section_name: str, prompt: str) -> str:
        try:
            return await self.gemini.classify(prompt)
        except Exception:
            return f"[Section '{section_name}' could not be generated]"

    def _summarize_signals(self, signals) -> dict:
        if not signals:
            return {"avg_clarity": None, "trend": "insufficient data"}
        scores = [s.clarity_score for s in signals]
        avg = sum(scores) / len(scores)
        if len(scores) >= 2:
            first_half = scores[: len(scores) // 2]
            second_half = scores[len(scores) // 2 :]
            trend = "improving" if sum(second_half) / len(second_half) > sum(first_half) / len(first_half) else "declining"
        else:
            trend = "stable"
        return {
            "avg_clarity": round(avg, 3),
            "min_clarity": round(min(scores), 3),
            "max_clarity": round(max(scores), 3),
            "total_readings": len(scores),
            "trend": trend,
        }
