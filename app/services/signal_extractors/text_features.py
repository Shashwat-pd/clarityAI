import re

from app.models.schemas.common import TenseFeatures

WORD_RE = re.compile(r"\b[\w']+\b")

FUTURE_PHRASES = [
    re.compile(r"\bwill\b", re.IGNORECASE),
    re.compile(r"\bgoing to\b", re.IGNORECASE),
    re.compile(r"\bplan to\b", re.IGNORECASE),
    re.compile(r"\bhope to\b", re.IGNORECASE),
    re.compile(r"\bwant to\b", re.IGNORECASE),
    re.compile(r"\bintend to\b", re.IGNORECASE),
    re.compile(r"\bnext year\b", re.IGNORECASE),
]

PAST_MARKERS = {
    "was",
    "were",
    "had",
    "did",
    "failed",
    "felt",
    "thought",
    "wanted",
    "used",
    "before",
    "previously",
    "yesterday",
    "last",
}

PRESENT_MARKERS = {
    "am",
    "is",
    "are",
    "feel",
    "think",
    "have",
    "need",
    "want",
    "can't",
    "dont",
    "don't",
    "stuck",
    "now",
}

PRESENT_DREAD_PATTERNS = [
    re.compile(r"\bi can't\b", re.IGNORECASE),
    re.compile(r"\bi dont know\b", re.IGNORECASE),
    re.compile(r"\bi don't know\b", re.IGNORECASE),
    re.compile(r"\bfalling apart\b", re.IGNORECASE),
    re.compile(r"\boverwhelmed\b", re.IGNORECASE),
    re.compile(r"\bstuck\b", re.IGNORECASE),
]


def _safe_ratio(count: int, total: int) -> float:
    if total <= 0:
        return 0.0
    return round(count / total, 3)


def extract_tense_features(message: str) -> TenseFeatures:
    text = message.strip()
    if not text:
        return TenseFeatures()

    lowered = text.lower()
    tokens = WORD_RE.findall(lowered)

    future_count = sum(len(pattern.findall(text)) for pattern in FUTURE_PHRASES)
    past_count = sum(1 for token in tokens if token in PAST_MARKERS or token.endswith("ed"))
    present_count = sum(1 for token in tokens if token in PRESENT_MARKERS)

    total = future_count + past_count + present_count
    future_absent = future_count == 0
    past_ratio = _safe_ratio(past_count, total)
    present_ratio = _safe_ratio(present_count, total)
    future_ratio = _safe_ratio(future_count, total)

    if future_absent and present_ratio >= past_ratio and present_count > 0:
        explanation = "Future-oriented language was absent while present-tense language dominated."
    elif future_absent and past_count > 0:
        explanation = "Future-oriented language was absent and the message leaned on past-focused references."
    elif future_ratio >= 0.25:
        explanation = "Future-oriented planning language was present."
    else:
        explanation = "Tense markers were mixed or limited."

    return TenseFeatures(
        past_count=past_count,
        present_count=present_count,
        future_count=future_count,
        past_ratio=past_ratio,
        present_ratio=present_ratio,
        future_ratio=future_ratio,
        future_absent=future_absent,
        explanation=explanation,
    )


def score_temporal_collapse(message: str, features: TenseFeatures) -> float:
    distress = 0.0
    lowered = message.lower()

    if features.future_absent:
        distress += 0.55
    if features.present_ratio >= 0.60:
        distress += 0.20
    if features.past_ratio >= 0.60:
        distress += 0.15
    if any(pattern.search(lowered) for pattern in PRESENT_DREAD_PATTERNS):
        distress += 0.10
    if features.future_ratio >= 0.25:
        distress -= 0.25

    return max(0.0, min(1.0, round(distress, 3)))
