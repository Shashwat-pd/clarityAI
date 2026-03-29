import logging
import re
from collections import Counter

from app.models.schemas.common import RuminationFeatures

WORD_RE = re.compile(r"\b[a-z']+\b", re.IGNORECASE)
MIN_PHRASE_TOKENS = 2
logger = logging.getLogger(__name__)

STOPWORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "but",
    "for",
    "i",
    "if",
    "in",
    "is",
    "it",
    "me",
    "my",
    "of",
    "on",
    "or",
    "so",
    "that",
    "the",
    "this",
    "to",
    "we",
}


def _normalize_tokens(text: str) -> list[str]:
    return [token.lower() for token in WORD_RE.findall(text) if token.lower() not in STOPWORDS]


def _extract_phrases(tokens: list[str], n: int = 2) -> list[str]:
    if len(tokens) < n:
        return []
    return [" ".join(tokens[i : i + n]) for i in range(len(tokens) - n + 1)]


def extract_rumination_features(message: str, prior_user_messages: list[str] | None = None) -> RuminationFeatures:
    prior_user_messages = prior_user_messages or []
    current_tokens = _normalize_tokens(message)
    if len(current_tokens) < MIN_PHRASE_TOKENS:
        logger.debug("extract_rumination_features: insufficient tokens message=%r", message)
        return RuminationFeatures(explanation="Not enough language to evaluate repetition patterns.")

    current_phrases = set(_extract_phrases(current_tokens, 2) + _extract_phrases(current_tokens, 3))
    if not current_phrases:
        logger.debug("extract_rumination_features: insufficient phrases message=%r", message)
        return RuminationFeatures(explanation="Not enough language to evaluate repetition patterns.")

    history_phrase_counter: Counter[str] = Counter()
    repeated_turn_count = 0

    for prior_message in prior_user_messages[-6:]:
        prior_tokens = _normalize_tokens(prior_message)
        prior_phrases = set(_extract_phrases(prior_tokens, 2) + _extract_phrases(prior_tokens, 3))
        overlap = current_phrases & prior_phrases
        if overlap:
            repeated_turn_count += 1
            history_phrase_counter.update(overlap)

    repeated_phrases = [phrase for phrase, _count in history_phrase_counter.most_common(5)]
    repetition_ratio = round(len(repeated_phrases) / max(1, len(current_phrases)), 3)

    if repeated_phrases:
        explanation = f"Repeated concern language appeared across {repeated_turn_count} prior turn(s)."
    else:
        explanation = "No strong cross-turn phrase repetition was observed."

    features = RuminationFeatures(
        repeated_phrases=repeated_phrases,
        repetition_ratio=repetition_ratio,
        repeated_turn_count=repeated_turn_count,
        explanation=explanation,
    )
    logger.debug(
        "extract_rumination_features: message=%r prior_user_messages=%s features=%s",
        message,
        prior_user_messages,
        features.model_dump(),
    )
    return features


def score_rumination(features: RuminationFeatures) -> float:
    distress = 0.0
    if features.repeated_turn_count >= 1:
        distress += 0.35
    if features.repeated_turn_count >= 2:
        distress += 0.25
    if features.repetition_ratio >= 0.2:
        distress += 0.20
    if len(features.repeated_phrases) >= 2:
        distress += 0.10
    score = max(0.0, min(1.0, round(distress, 3)))
    logger.debug("score_rumination: score=%s features=%s", score, features.model_dump())
    return score
