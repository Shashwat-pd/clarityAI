import json
import logging

from app.integrations.gemini_client import GeminiClient
from app.models.schemas.common import ExplainableSignals, LinguisticSignals
from app.services.signal_extractors import (
    extract_rumination_features,
    extract_tense_features,
    extract_valence_features,
    score_negative_valence,
    score_rumination,
    score_temporal_collapse,
)

logger = logging.getLogger(__name__)

CLASSIFIER_PROMPT = """
You are a linguistic analysis tool. Analyse the following student message and return
a JSON object with scores between 0.0 and 1.0 for each of these signal categories.
Return ONLY valid JSON, no other text. No markdown code fences.

Categories:
- catastrophising: absolute/extreme language ("never", "always", "ruined", "impossible")
- rumination: repeating the same concern without resolution
- avoidance: deflecting, "I don't know" frequency, subject changes mid-thought
- temporal_collapse: absence of future-tense language, present-tense dread only
- cognitive_narrowing: very short or vocabulary-contracted response
- self_deprecation: attributing difficulty to personal failure

Message: "{message}"

Return format:
{{"catastrophising": 0.0, "rumination": 0.0, "avoidance": 0.0, "temporal_collapse": 0.0, "cognitive_narrowing": 0.0, "self_deprecation": 0.0, "summary": "one sentence description"}}
"""


class LinguisticClassifier:
    def __init__(self, gemini: GeminiClient):
        self.gemini = gemini

    async def classify(self, message: str, prior_user_messages: list[str] | None = None) -> LinguisticSignals:
        tense_features = extract_tense_features(message)
        rumination_features = extract_rumination_features(message, prior_user_messages)
        valence_features = extract_valence_features(message)
        temporal_collapse = score_temporal_collapse(message, tense_features)
        rumination_score = score_rumination(rumination_features)
        negative_valence = score_negative_valence(valence_features)

        if len(message.strip()) < 3:
            return LinguisticSignals(
                temporal_collapse=temporal_collapse,
                rumination=rumination_score,
                indicator_scores={
                    "temporal_collapse": temporal_collapse,
                    "rumination": rumination_score,
                    "negative_valence": negative_valence,
                },
                explainable_signals=ExplainableSignals(
                    tense=tense_features,
                    rumination=rumination_features,
                    valence=valence_features,
                ),
                summary=tense_features.explanation,
            )

        try:
            response = await self.gemini.classify(CLASSIFIER_PROMPT.format(message=message))
            cleaned = response.strip()
            # Strip markdown code fences if present
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3]
                cleaned = cleaned.strip()
            data = json.loads(cleaned)
            return LinguisticSignals(
                catastrophising=float(data.get("catastrophising", 0.0)),
                rumination=rumination_score,
                avoidance=float(data.get("avoidance", 0.0)),
                temporal_collapse=temporal_collapse,
                cognitive_narrowing=float(data.get("cognitive_narrowing", 0.0)),
                self_deprecation=float(data.get("self_deprecation", 0.0)),
                summary=data.get("summary", rumination_features.explanation or tense_features.explanation),
                indicator_scores={
                    "temporal_collapse": temporal_collapse,
                    "rumination": rumination_score,
                    "negative_valence": negative_valence,
                },
                explainable_signals=ExplainableSignals(
                    tense=tense_features,
                    rumination=rumination_features,
                    valence=valence_features,
                ),
            )
        except Exception as e:
            logger.warning(f"Linguistic classification failed: {e}")
            return LinguisticSignals(
                temporal_collapse=temporal_collapse,
                rumination=rumination_score,
                indicator_scores={
                    "temporal_collapse": temporal_collapse,
                    "rumination": rumination_score,
                    "negative_valence": negative_valence,
                },
                explainable_signals=ExplainableSignals(
                    tense=tense_features,
                    rumination=rumination_features,
                    valence=valence_features,
                ),
                summary=rumination_features.explanation or tense_features.explanation,
            )
