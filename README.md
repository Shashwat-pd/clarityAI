# ClarityAI

Cognitive-adaptive career guidance platform for students and school counsellors.

This repository now contains the ClarityAI backend and frontend prototype, not the original mock interviewer project the repo started from.

## What The System Does

- Runs student conversations over text and voice
- Infers behavioural and linguistic indicators from each turn
- Computes a rolling `clarity_score`
- Switches the LLM between `grounding`, `structuring`, and `guidance` modes
- Aggregates multi-session behavioural data into a counsellor brief
- Exports that brief as PDF and DOCX

## Current Signal Pipeline

The signal system is modular and currently supports these implemented indicators:

1. `temporal_collapse`
2. `rumination`
3. `negative_valence`

### Indicator 1: Temporal Collapse

Implemented in `app/services/signal_extractors/text_features.py`.

What is extracted:

- `past_count`
- `present_count`
- `future_count`
- `past_ratio`
- `present_ratio`
- `future_ratio`
- `future_absent`
- explanation string

How it is used:

- deterministic tense extraction runs for every message
- `temporal_collapse` score is derived from those features
- the score is written into the indicator map
- the clarity engine uses that score to influence mode selection

### Indicator 2: Rumination / Phrase Repetition

Implemented in `app/services/signal_extractors/cross_turn_features.py`.

What is extracted:

- repeated bi-grams and tri-grams across prior user turns
- `repeated_phrases`
- `repetition_ratio`
- `repeated_turn_count`
- explanation string

How it is used:

- the current message is compared against prior user turns in the session
- repeated concern phrases are scored into `rumination`
- that score contributes to the overall clarity score

### Indicator 6: Negative vs Positive Valence

Implemented in `app/services/signal_extractors/valence_features.py`.

What is extracted:

- `negative_word_count`
- `positive_word_count`
- `negative_word_ratio`
- `positive_word_ratio`
- `valence_balance`
- explanation string

How it is used:

- a deterministic lexicon-based pass runs on each message
- the resulting `negative_valence` score is added to the indicator map
- the clarity engine includes it in weighted scoring

## Scoring Formulas

The current implementation uses deterministic feature extraction followed by weighted scoring. The formulas below describe the math that is actually used in code.

### 1. Tense Ratios

Implemented in `app/services/signal_extractors/text_features.py`.

Counts:

- `past_count`
- `present_count`
- `future_count`

Formula:

```text
total_tense_markers = past_count + present_count + future_count
past_ratio = past_count / total_tense_markers
present_ratio = present_count / total_tense_markers
future_ratio = future_count / total_tense_markers
```

If `total_tense_markers = 0`, all ratios default to `0.0`.

### 2. Temporal Collapse Score

Implemented in `app/services/signal_extractors/text_features.py`.

The score starts at `0.0` and then applies additive penalties:

```text
temporal_distress = 0.0
+ 0.55 if future_absent = true
+ 0.20 if present_ratio >= 0.60
+ 0.15 if past_ratio >= 0.60
+ 0.10 if present-dread phrase is matched
- 0.25 if future_ratio >= 0.25
```

Final score:

```text
temporal_collapse = clamp(temporal_distress, 0.0, 1.0)
```

Higher `temporal_collapse` means more stress-consistent temporal narrowing.

### 3. Rumination / Phrase Repetition

Implemented in `app/services/signal_extractors/cross_turn_features.py`.

The system compares the current user message against prior user turns using repeated 2-word and 3-word phrases.

Formula:

```text
repetition_ratio = repeated_phrases_count / current_phrase_count
```

Scoring:

```text
rumination_distress = 0.0
+ 0.35 if repeated_turn_count >= 1
+ 0.25 if repeated_turn_count >= 2
+ 0.20 if repetition_ratio >= 0.20
+ 0.10 if repeated_phrases_count >= 2
```

Final score:

```text
rumination = clamp(rumination_distress, 0.0, 1.0)
```

### 4. Valence Features

Implemented in `app/services/signal_extractors/valence_features.py`.

Counts:

- `negative_word_count`
- `positive_word_count`
- `token_count`

Formulas:

```text
negative_word_ratio = negative_word_count / token_count
positive_word_ratio = positive_word_count / token_count
valence_balance = negative_word_ratio - positive_word_ratio
```

Interpretation:

- `valence_balance > 0` means more negative language than positive
- `valence_balance < 0` means more positive language than negative

### 5. Negative Valence Score

Implemented in `app/services/signal_extractors/valence_features.py`.

Scoring:

```text
valence_distress = 0.0
+ 0.35 if negative_word_ratio >= 0.08
+ 0.20 if negative_word_ratio >= 0.15
+ min(0.25, valence_balance * 2) if valence_balance > 0
- 0.15 if positive_word_ratio >= 0.10
```

Final score:

```text
negative_valence = clamp(valence_distress, 0.0, 1.0)
```

### 6. Weighted Linguistic Distress

Implemented in `app/services/cognitive_engine.py`.

Current registry weights:

```text
catastrophising      0.25
rumination           0.20
avoidance            0.20
temporal_collapse    0.15
negative_valence     0.10
cognitive_narrowing  0.10
self_deprecation     0.10
```

Formula:

```text
linguistic_distress =
  catastrophising * 0.25
+ rumination * 0.20
+ avoidance * 0.20
+ temporal_collapse * 0.15
+ negative_valence * 0.10
+ cognitive_narrowing * 0.10
+ self_deprecation * 0.10
```

Then clarity is inverted from distress:

```text
linguistic_score = 1.0 - linguistic_distress
```

### 7. Keystroke Score

Implemented in `app/services/cognitive_engine.py`.

The keystroke score starts at `1.0` and subtracts penalties:

```text
keystroke_score = 1.0
- 0.30 if backspace_rate > 0.20
- 0.20 if pre_send_pause_ms > 5000
- 0.20 if message_abandoned_count > 2
- 0.15 if typing_rhythm_std_dev_ms > 200
```

Final score:

```text
keystroke_score = clamp(keystroke_score, 0.0, 1.0)
```

### 8. Metadata Score

Implemented in `app/services/cognitive_engine.py`.

The current metadata layer only uses session timing:

```text
metadata_score = 1.0
- 0.30 if session_hour is between 22:00 and 04:00
```

Final score:

```text
metadata_score = clamp(metadata_score, 0.0, 1.0)
```

### 9. Raw Clarity Score

Implemented in [cognitive_engine.py](/Users/shashwatpoudel/Documents/hack-clarity/Interviewer/app/services/cognitive_engine.py).

If keystroke data exists:

```text
raw_score =
  0.50 * linguistic_score
+ 0.30 * keystroke_score
+ 0.20 * metadata_score
```

If keystroke data is missing:

```text
raw_score =
  0.70 * linguistic_score
+ 0.30 * metadata_score
```

### 10. Smoothed Clarity Score

The system takes the most recent stored session scores and averages them with the new score:

```text
smoothed_score = average(recent_scores + [raw_score])
```

The current implementation uses up to the last 5 stored readings.

### 11. Mode Thresholds

Implemented in [cognitive_engine.py](/Users/shashwatpoudel/Documents/hack-clarity/Interviewer/app/services/cognitive_engine.py).

```text
if smoothed_score < 0.34:
    mode = grounding
elif smoothed_score < 0.67:
    mode = structuring
else:
    mode = guidance
```

This gives the final pipeline:

```text
raw features -> indicator scores -> weighted distress -> clarity score -> smoothed score -> mode
```

## Database Structure

The database is centered around four tables:

- `app/models/db/session.py`
- `app/models/db/message.py`
- `app/models/db/signal.py`
- `app/models/db/brief.py`

### How indicator data is stored

Turn-level storage:

- `messages.linguistic_signals` stores the scored signal payload for the user turn
- `messages.keystroke_signals` stores typing-derived input where present

Clarity-history storage:

- `clarity_signals.raw_signals` stores the raw structured evidence that fed that clarity reading

That raw payload includes:

- `indicator_scores`
- `explainable_signals`
- `keystroke_signals`
- `session_metadata`
- textual summary

This means new indicators can be added without introducing a new SQL column for each one. The evolving signal set lives inside JSONB payloads.

## Multi-Session Behaviour

One student can have many sessions. Each session can have many messages and many clarity signal snapshots.

That means the brief is generated by aggregating:

- multiple sessions
- multiple message-level signal payloads
- multiple clarity history snapshots

This is how the system can say things like:

- future-oriented language was limited in early sessions
- similar concerns reappeared across multiple turns
- negative emotional language outweighed positive language in several turns

## Brief Generation And Export

The brief flow is intentionally two-stage:

1. generate the structured brief content from stored data
2. render that stored brief deterministically into export formats

### Why export should not call the LLM again

The export endpoint should not regenerate the brief from scratch on every download. That would make the same brief drift across exports.

Current design:

- `app/services/brief_service.py` generates the brief content once from stored data
- the result is saved in `briefs.content`
- `app/services/pdf_service.py` renders PDF from stored content
- `app/services/docx_service.py` renders DOCX from stored content

### Export endpoints

- `POST /api/v1/briefs/generate`
- `GET /api/v1/briefs/{brief_id}/preview`
- `GET /api/v1/briefs/{brief_id}/pdf`
- `GET /api/v1/briefs/{brief_id}/export`

The DOCX export returns:

- MIME type: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- filename: `counselor_brief.docx`

## LLM Prompt Behaviour

The LLM currently receives:

- mode: `grounding`, `structuring`, or `guidance`
- student context
- crisis flag
- history
- current message

It does not currently receive the raw numeric `clarity_score` or the full indicator payload. Mode switching is live and is what changes the prompt behaviour.

Relevant files:

- `app/services/llm_service.py`
- `app/utils/prompts.py`

## Terminal Logging

The backend is now configured for very verbose terminal logging by default.

Relevant files:

- `app/config.py`
- `app/main.py`

Default behaviour:

- `LOG_LEVEL=DEBUG`
- logs are emitted to the terminal with timestamp, level, logger name, and message
- signal extraction functions log their inputs and computed feature payloads
- scoring functions log derived scores
- brief routes log export and preview activity

This is intentionally noisy for development so you can see every small step in the signal pipeline.

## Running The Backend

```bash
cp .env.example .env
docker compose up --build
```

Health check:

```bash
curl http://localhost:8000/api/v1/health
```

Docs:

```text
http://localhost:8000/docs
```

## Verification

Current local verification completed for backend changes:

- `python3 -m compileall app`
- `python3 -m unittest tests/test_text_features.py`
