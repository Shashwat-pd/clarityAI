# ClarityAI Signal Implementation Plan

## Goal

Implement stress indicators in a way that fully supports indicator `1` first, while making indicators `2`, `3`, and `6` additive rather than architectural rewrites.

Selected indicators:

1. Verb tense / temporal collapse
2. Phrase repetition / rumination
3. Conversation timing
6. Negative vs positive emotional valence words

Core requirement:

- Indicator `1` must be implemented end-to-end.
- Indicators `2`, `3`, and `6` must plug into the same pipeline with minimal additional work.

---

## Current Repo Fit

The current codebase already has the right backbone:

- `app/services/linguistic_classifier.py` extracts message-level language signals
- `app/services/cognitive_engine.py` converts signals into `clarity_score`
- `app/models/db/message.py` stores `linguistic_signals`
- `app/models/db/signal.py` stores score history
- `app/services/brief_service.py` already consumes signal history
- frontend already consumes `clarity_mode` and `clarity_score`

What is missing is a modular signal architecture. Right now the pipeline treats linguistic analysis as a mostly flat payload. That works for MVP, but it will make new indicators expensive unless we refactor first.

---

## Target Architecture

Build the signal system in 4 layers:

1. Raw feature extraction
2. Derived indicator scoring
3. Clarity scoring
4. Presentation and storage

Desired flow:

`message/audio -> feature extractors -> indicator scores -> clarity engine -> DB -> frontend/brief`

This architecture makes indicator `1` the first full implementation and turns indicators `2`, `3`, and `6` into additions to a stable system.

---

## Phase 1: Refactor for Extensibility

This phase must happen before implementing indicator `1`.

### 1. Split raw features from scored indicators

Keep compatibility with the current top-level `linguistic_signals`, but add a structured explainable feature object behind it.

Suggested backend models:

```python
class TenseFeatures(BaseModel):
    past_ratio: float = 0.0
    present_ratio: float = 0.0
    future_ratio: float = 0.0
    future_absent: bool = False

class RuminationFeatures(BaseModel):
    repeated_phrases: list[str] = []
    repetition_ratio: float = 0.0

class TimingFeatures(BaseModel):
    response_latency_ms: float | None = None
    speech_rate_wpm: float | None = None
    silence_ratio: float | None = None
    intra_utterance_pause_ms_avg: float | None = None

class ValenceFeatures(BaseModel):
    negative_word_ratio: float = 0.0
    positive_word_ratio: float = 0.0
    valence_balance: float = 0.0

class ExplainableSignals(BaseModel):
    tense: TenseFeatures = TenseFeatures()
    rumination: RuminationFeatures = RuminationFeatures()
    timing: TimingFeatures = TimingFeatures()
    valence: ValenceFeatures = ValenceFeatures()
```

### 2. Add a config-driven signal registry

Define all signals in one place:

- signal name
- source type: `text`, `voice`, `cross_turn`
- distress direction
- clarity weight
- whether it should be shown in UI/brief

Example:

```python
SIGNAL_REGISTRY = {
    "temporal_collapse": {"weight": 0.18, "source": "text"},
    "rumination": {"weight": 0.15, "source": "cross_turn"},
    "timing_distress": {"weight": 0.12, "source": "voice"},
    "negative_valence": {"weight": 0.10, "source": "text"},
}
```

This removes hardcoded assumptions from the clarity engine.

### 3. Persist raw explainable features separately from summary scores

Use storage like this:

- `message.linguistic_signals`: high-level indicator scores
- `signal.raw_signals`: raw explainable features used to compute those scores

This is important because later indicators should not require another schema redesign.

### 4. Make the clarity engine generic

Instead of only scoring the current fixed fields, make `CognitiveEngine` accept a dictionary of indicator scores:

```python
{
    "temporal_collapse": 0.8,
    "rumination": 0.4,
    "negative_valence": 0.6
}
```

Then weight them through the registry.

This is the key design decision. If this is done properly, indicators `2`, `3`, and `6` become additions rather than rewrites.

---

## Phase 2: Fully Implement Indicator 1

Indicator `1` is verb tense / temporal collapse. This should be complete before building anything else.

### Scope

Indicator `1` must be supported across:

- extraction
- scoring
- clarity integration
- persistence
- frontend debug visibility
- brief generation
- tests

### 1. Build a deterministic text feature extractor

Create:

- `app/services/signal_extractors/text_features.py`

Compute:

- `past_ratio`
- `present_ratio`
- `future_ratio`
- `future_absent`
- count of future markers such as `will`, `going to`, `plan to`, `hope to`, `want to`
- count of past-failure language such as `failed`, `was never`, `used to`, `always messed up`

Use deterministic rules first, not an LLM. This signal must be stable, testable, and explainable.

### 2. Convert tense features into a temporal collapse score

Add a scorer for `temporal_collapse_score`.

Suggested distress logic:

- High distress:
  - `future_ratio < 0.05`
  - `present_ratio > 0.60`
  - `future_absent == True`
- Medium distress:
  - some future language exists, but language is dominated by fear or paralysis
- Low distress:
  - future-oriented planning language appears naturally

This score should replace or strengthen the current `temporal_collapse` signal so it is based on deterministic features rather than only prompt-based classification.

### 3. Feed the score into the clarity engine

`temporal_collapse_score` becomes a first-class clarity input through the registry.

### 4. Persist the explanation

Each turn should be able to explain why temporal collapse was elevated.

Examples:

- future-oriented language absent
- present-tense distress dominant
- past-failure language elevated

This is important for demos and for counsellor trust.

### 5. Add frontend debug visibility for indicator 1

Do not build the full dashboard yet. Add an internal debug panel showing:

- past ratio
- present ratio
- future ratio
- temporal collapse score
- explanation string

This proves the architecture before the additional indicators are added.

### 6. Add brief support for indicator 1

Translate temporal patterns into non-clinical language in the brief.

Examples:

- "Future-oriented language was limited in early sessions and increased later."
- "The student often described their situation in immediate, high-pressure terms."

### 7. Add tests

Create fixtures covering:

- healthy future planning
- present-tense panic
- past-focused rumination
- mixed language
- short neutral messages
- future language recovery across turns

Indicator `1` is only complete when it is extracted, scored, saved, visible, included in the brief, and tested.

---

## Phase 3: Lock the Extension Seam

Before adding indicators `2`, `3`, and `6`, stop and verify the extension model.

A new indicator should require only:

1. a feature extractor
2. a score function
3. one registry entry
4. optional UI and brief formatter

If adding a new indicator still requires touching unrelated parts of the pipeline, the architecture is not ready yet.

---

## Phase 4: Add Indicator 2

Indicator `2` is phrase repetition / rumination.

### Design

Source:

- recent user turns, not just the current message

Add:

- `app/services/signal_extractors/cross_turn_features.py`

Compute:

- repeated n-grams
- semantically similar repeated concerns
- repetition count across the last `N` user turns
- repeated phrase list for debug visibility

Output:

- `RuminationFeatures`
- `rumination_score`
- one explanation sentence

Because the pipeline is already modular, this should only require:

- one extractor
- one scorer
- one registry entry
- optional UI card

---

## Phase 5: Add Indicator 6

Indicator `6` is negative vs positive emotional valence words.

### Design

Source:

- current message text

Add deterministic lexicon-based extraction first.

Compute:

- negative word count
- positive word count
- negative-to-positive ratio
- valence balance score

Store matched words for internal debug mode only.

Output:

- `ValenceFeatures`
- `negative_valence_score`
- one explanation sentence

This should also be additive once the architecture is in place.

---

## Phase 6: Add Indicator 3

Indicator `3` is conversation timing.

### Design

Source:

- voice turns only

Add:

- `app/services/signal_extractors/voice_features.py`

Compute:

- `response_latency_ms`
- `speech_rate_wpm`
- `silence_ratio`
- `avg_pause_ms`

Important constraint:

This depends on timestamp quality from the STT provider and the frontend voice flow. It is the only selected indicator that may require API-contract changes.

### Implementation note

First confirm whether Deepgram response data already includes enough timing information for:

- utterance start and end
- word timestamps
- audio duration

If it does not, use an MVP fallback:

- response latency from frontend recording events
- speech rate from `word_count / audio_duration`
- silence ratio deferred if necessary

This indicator should be added last because it is the most integration-heavy.

---

## Recommended Build Order

1. Refactor signal architecture
2. Fully implement indicator `1`
3. Verify indicator `1` in API, DB, frontend debug panel, and brief
4. Add indicator `2`
5. Add indicator `6`
6. Add indicator `3`

Why this order:

- indicators `1`, `2`, and `6` are text-first and fit the current backend cleanly
- indicator `3` depends on voice metadata and may require interface changes
- the text pipeline should be proven before the voice-timing layer is added

---

## Concrete File Plan

### Backend

Add:

- `app/services/signal_extractors/text_features.py`
- `app/services/signal_extractors/cross_turn_features.py`
- `app/services/signal_extractors/voice_features.py`

Update:

- `app/models/schemas/common.py`
- `app/services/linguistic_classifier.py`
- `app/services/cognitive_engine.py`
- `app/services/voice_service.py`
- `app/api/routes/chat.py`
- `app/api/websocket/voice_ws.py`
- `app/services/brief_service.py`

### Frontend

Update:

- `frontend/src/types/index.ts`
- `frontend/src/services/api.ts`
- `frontend/app/(tabs)/index.tsx`

Add:

- an internal debug panel for explainable signal display

---

## Acceptance Criteria for Indicator 1

Indicator `1` is considered fully supported only if all of the following are true:

- a text message produces deterministic tense features
- those features generate a temporal collapse score
- that score contributes to clarity mode changes
- raw features and score are saved in the database
- the frontend can display them in a debug panel
- the brief can summarize the pattern over time
- unit tests cover at least six tense scenarios
- adding a new indicator afterward does not require another schema redesign

---

## Engineering Rule

Do not implement indicator `1` as a one-off field bolted onto the existing classifier prompt.

If indicator `1` is implemented as a special case, indicators `2`, `3`, and `6` will each become additional special cases and the pipeline will get harder to extend.

Implement indicator `1` as the first member of a modular signal system.
