import json
import logging

from app.integrations.gemini_client import GeminiClient
from app.models.schemas.common import LinguisticSignals

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

    async def classify(self, message: str) -> LinguisticSignals:
        if len(message.strip()) < 3:
            return LinguisticSignals.empty()

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
            return LinguisticSignals(**data)
        except Exception as e:
            logger.warning(f"Linguistic classification failed: {e}")
            return LinguisticSignals.empty()
