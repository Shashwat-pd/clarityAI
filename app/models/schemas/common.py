from enum import Enum

from pydantic import BaseModel, Field


class ClarityMode(str, Enum):
    GROUNDING = "grounding"
    STRUCTURING = "structuring"
    GUIDANCE = "guidance"


class TenseFeatures(BaseModel):
    past_count: int = 0
    present_count: int = 0
    future_count: int = 0
    past_ratio: float = 0.0
    present_ratio: float = 0.0
    future_ratio: float = 0.0
    future_absent: bool = True
    explanation: str = ""


class RuminationFeatures(BaseModel):
    repeated_phrases: list[str] = Field(default_factory=list)
    repetition_ratio: float = 0.0
    repeated_turn_count: int = 0
    explanation: str = ""


class ValenceFeatures(BaseModel):
    negative_word_count: int = 0
    positive_word_count: int = 0
    negative_word_ratio: float = 0.0
    positive_word_ratio: float = 0.0
    valence_balance: float = 0.0
    explanation: str = ""


class ExplainableSignals(BaseModel):
    tense: TenseFeatures = Field(default_factory=TenseFeatures)
    rumination: RuminationFeatures = Field(default_factory=RuminationFeatures)
    valence: ValenceFeatures = Field(default_factory=ValenceFeatures)


class LinguisticSignals(BaseModel):
    catastrophising: float = 0.0
    rumination: float = 0.0
    avoidance: float = 0.0
    temporal_collapse: float = 0.0
    cognitive_narrowing: float = 0.0
    self_deprecation: float = 0.0
    summary: str = ""
    indicator_scores: dict[str, float] = Field(default_factory=dict)
    explainable_signals: ExplainableSignals = Field(default_factory=ExplainableSignals)

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
