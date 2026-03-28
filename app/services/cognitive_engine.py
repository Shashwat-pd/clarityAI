import re

from app.models.schemas.common import ClarityMode, ClarityResult, LinguisticSignals
from app.repositories.signal_repo import SignalRepository

CRISIS_PATTERNS = [
    re.compile(r"\b(i want to die|kill myself|end it all|not worth living|can't go on)\b", re.IGNORECASE),
    re.compile(r"\b(self harm|hurting myself)\b", re.IGNORECASE),
]


class CognitiveEngine:
    def __init__(self, signal_repo: SignalRepository):
        self.signal_repo = signal_repo

    async def compute(
        self,
        session_id,
        linguistic_signals: LinguisticSignals,
        keystroke_signals: dict | None = None,
        session_metadata: dict | None = None,
    ) -> ClarityResult:
        linguistic_score = self._score_linguistic(linguistic_signals)
        metadata_score = self._score_metadata(session_metadata or {})

        if keystroke_signals:
            keystroke_score = self._score_keystroke(keystroke_signals)
            raw_score = linguistic_score * 0.50 + keystroke_score * 0.30 + metadata_score * 0.20
        else:
            raw_score = linguistic_score * 0.70 + metadata_score * 0.30

        recent_scores = await self.signal_repo.get_recent_scores(session_id, limit=5)
        all_scores = recent_scores + [raw_score]
        smoothed_score = sum(all_scores) / len(all_scores)

        mode = self._score_to_mode(smoothed_score)
        await self.signal_repo.save_score(session_id, smoothed_score, mode.value)

        return ClarityResult(score=round(smoothed_score, 3), mode=mode)

    def _score_linguistic(self, signals: LinguisticSignals) -> float:
        distress = (
            signals.catastrophising * 0.25
            + signals.rumination * 0.20
            + signals.avoidance * 0.20
            + signals.temporal_collapse * 0.15
            + signals.cognitive_narrowing * 0.10
            + signals.self_deprecation * 0.10
        )
        return max(0.0, 1.0 - distress)

    def _score_keystroke(self, signals: dict) -> float:
        score = 1.0
        backspace_rate = signals.get("backspace_rate")
        if backspace_rate is not None and backspace_rate > 0.2:
            score -= 0.3
        pre_send_pause = signals.get("pre_send_pause_ms")
        if pre_send_pause is not None and pre_send_pause > 5000:
            score -= 0.2
        abandoned = signals.get("message_abandoned_count")
        if abandoned is not None and abandoned > 2:
            score -= 0.2
        rhythm_std = signals.get("typing_rhythm_std_dev_ms")
        if rhythm_std is not None and rhythm_std > 200:
            score -= 0.15
        return max(0.0, score)

    def _score_metadata(self, metadata: dict) -> float:
        score = 1.0
        hour = metadata.get("session_hour", 12)
        if 22 <= hour or hour <= 4:
            score -= 0.3
        return max(0.0, score)

    def _score_to_mode(self, score: float) -> ClarityMode:
        if score < 0.34:
            return ClarityMode.GROUNDING
        elif score < 0.67:
            return ClarityMode.STRUCTURING
        else:
            return ClarityMode.GUIDANCE

    @staticmethod
    def detect_crisis(text: str) -> bool:
        return any(p.search(text) for p in CRISIS_PATTERNS)
