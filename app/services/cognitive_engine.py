import logging
import re

from app.models.schemas.common import ClarityMode, ClarityResult, LinguisticSignals
from app.repositories.signal_repo import SignalRepository

CRISIS_PATTERNS = [
    re.compile(r"\b(i want to die|kill myself|end it all|not worth living|can't go on)\b", re.IGNORECASE),
    re.compile(r"\b(self harm|hurting myself)\b", re.IGNORECASE),
]

SIGNAL_REGISTRY = {
    "catastrophising": 0.25,
    "rumination": 0.20,
    "avoidance": 0.20,
    "temporal_collapse": 0.15,
    "negative_valence": 0.10,
    "cognitive_narrowing": 0.10,
    "self_deprecation": 0.10,
}

logger = logging.getLogger(__name__)


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
        logger.debug(
            "compute: session_id=%s indicator_scores=%s keystroke_signals=%s session_metadata=%s linguistic_score=%s metadata_score=%s raw_score=%s smoothed_score=%s mode=%s",
            session_id,
            self._extract_indicator_scores(linguistic_signals),
            keystroke_signals,
            session_metadata,
            linguistic_score,
            metadata_score,
            raw_score,
            smoothed_score,
            mode.value,
        )
        await self.signal_repo.save_score(
            session_id,
            smoothed_score,
            mode.value,
            raw_signals=self._build_raw_signal_payload(linguistic_signals, keystroke_signals, session_metadata or {}),
        )

        return ClarityResult(score=round(smoothed_score, 3), mode=mode)

    def _score_linguistic(self, signals: LinguisticSignals) -> float:
        distress = sum(
            score * SIGNAL_REGISTRY.get(signal_name, 0.0)
            for signal_name, score in self._extract_indicator_scores(signals).items()
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

    def _extract_indicator_scores(self, signals: LinguisticSignals) -> dict[str, float]:
        indicator_scores = {
            "catastrophising": signals.catastrophising,
            "rumination": signals.rumination,
            "avoidance": signals.avoidance,
            "temporal_collapse": signals.temporal_collapse,
            "cognitive_narrowing": signals.cognitive_narrowing,
            "self_deprecation": signals.self_deprecation,
        }
        indicator_scores.update(signals.indicator_scores)
        return indicator_scores

    def _build_raw_signal_payload(
        self,
        signals: LinguisticSignals,
        keystroke_signals: dict | None,
        session_metadata: dict,
    ) -> dict:
        return {
            "indicator_scores": self._extract_indicator_scores(signals),
            "explainable_signals": signals.explainable_signals.model_dump(),
            "keystroke_signals": keystroke_signals or {},
            "session_metadata": session_metadata,
            "summary": signals.summary,
        }

    @staticmethod
    def detect_crisis(text: str) -> bool:
        return any(p.search(text) for p in CRISIS_PATTERNS)
