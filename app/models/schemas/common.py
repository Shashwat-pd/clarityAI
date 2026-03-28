from enum import Enum

from pydantic import BaseModel


class ClarityMode(str, Enum):
    GROUNDING = "grounding"
    STRUCTURING = "structuring"
    GUIDANCE = "guidance"


class LinguisticSignals(BaseModel):
    catastrophising: float = 0.0
    rumination: float = 0.0
    avoidance: float = 0.0
    temporal_collapse: float = 0.0
    cognitive_narrowing: float = 0.0
    self_deprecation: float = 0.0
    summary: str = ""

    @classmethod
    def empty(cls) -> "LinguisticSignals":
        return cls()


class KeystrokeSignals(BaseModel):
    backspace_rate: float | None = None
    typing_rhythm_std_dev_ms: float | None = None
    pre_send_pause_ms: float | None = None
    message_abandoned_count: int | None = None
    burst_pattern_detected: bool | None = None


class ClarityResult(BaseModel):
    score: float
    mode: ClarityMode
