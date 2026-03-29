import logging
import re

from app.models.schemas.common import ValenceFeatures

WORD_RE = re.compile(r"\b[a-z']+\b", re.IGNORECASE)
logger = logging.getLogger(__name__)

NEGATIVE_WORDS = {
    "afraid",
    "anxious",
    "bad",
    "confused",
    "difficult",
    "fail",
    "failed",
    "failing",
    "fear",
    "hopeless",
    "impossible",
    "lost",
    "overwhelmed",
    "panic",
    "scared",
    "stressed",
    "stuck",
    "terrible",
    "worried",
    "worse",
}

POSITIVE_WORDS = {
    "calm",
    "clear",
    "confident",
    "excited",
    "good",
    "great",
    "hope",
    "hopeful",
    "interested",
    "okay",
    "possible",
    "ready",
    "relieved",
    "stable",
}


def extract_valence_features(message: str) -> ValenceFeatures:
    tokens = [token.lower() for token in WORD_RE.findall(message)]
    token_count = len(tokens)
    if token_count == 0:
        logger.debug("extract_valence_features: empty token set message=%r", message)
        return ValenceFeatures(explanation="No lexical valence signal detected.")

    negative_word_count = sum(1 for token in tokens if token in NEGATIVE_WORDS)
    positive_word_count = sum(1 for token in tokens if token in POSITIVE_WORDS)
    negative_word_ratio = round(negative_word_count / token_count, 3)
    positive_word_ratio = round(positive_word_count / token_count, 3)
    valence_balance = round(negative_word_ratio - positive_word_ratio, 3)

    if valence_balance > 0:
        explanation = "Negative emotional language outweighed positive language."
    elif valence_balance < 0:
        explanation = "Positive emotional language outweighed negative language."
    else:
        explanation = "Positive and negative emotional language were balanced or absent."

    features = ValenceFeatures(
        negative_word_count=negative_word_count,
        positive_word_count=positive_word_count,
        negative_word_ratio=negative_word_ratio,
        positive_word_ratio=positive_word_ratio,
        valence_balance=valence_balance,
        explanation=explanation,
    )
    logger.debug("extract_valence_features: message=%r features=%s", message, features.model_dump())
    return features


def score_negative_valence(features: ValenceFeatures) -> float:
    distress = 0.0
    if features.negative_word_ratio >= 0.08:
        distress += 0.35
    if features.negative_word_ratio >= 0.15:
        distress += 0.20
    if features.valence_balance > 0:
        distress += min(0.25, max(0.0, features.valence_balance * 2))
    if features.positive_word_ratio >= 0.10:
        distress -= 0.15
    score = max(0.0, min(1.0, round(distress, 3)))
    logger.debug("score_negative_valence: score=%s features=%s", score, features.model_dump())
    return score
