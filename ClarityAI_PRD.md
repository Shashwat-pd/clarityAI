# ClarityAI — Product Requirements Document
### Voice-First Cognitive-Adaptive Career Guidance Platform
**Version:** 1.0 — Hackathon Build  
**Date:** March 2026  
**Status:** Phase 1 — Backend MVP  
**Confidential**

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Problem Statement](#2-problem-statement)
3. [Build Scope & Phase Structure](#3-build-scope--phase-structure)
4. [Tech Stack & Constraints](#4-tech-stack--constraints)
5. [System Architecture — Phase 1 Backend](#5-system-architecture--phase-1-backend)
6. [API Service Contracts](#6-api-service-contracts)
7. [Voice Pipeline (Primary Feature)](#7-voice-pipeline-primary-feature)
8. [Conversation & LLM Engine](#8-conversation--llm-engine)
9. [Cognitive Signal Layer](#9-cognitive-signal-layer)
10. [Session & Persistence Layer](#10-session--persistence-layer)
11. [Counsellor Brief Generator](#11-counsellor-brief-generator)
12. [Docker & Deployment Spec](#12-docker--deployment-spec)
13. [Data Models](#13-data-models)
14. [Phase 2 — Frontend Handoff Notes](#14-phase-2--frontend-handoff-notes)
15. [Constraints, Risks & Mitigations](#15-constraints-risks--mitigations)
16. [Appendix: Environment Variables](#16-appendix-environment-variables)

---

## 1. Product Overview

ClarityAI is a cognitive-adaptive career guidance platform designed for high school students (Years 11–13) who are navigating university and career decisions under acute stress. The platform functions primarily as a **voice-first conversational AI** — students talk to it as they would a knowledgeable mentor — while simultaneously and passively inferring their emotional and cognitive state from behavioural signals.

The output is twofold:
- **For the student:** An AI guide that adapts its tone, depth, and content to the student's real-time cognitive readiness.
- **For the counsellor:** A structured PDF behavioural brief ready before every scheduled session, replacing the intake phase that consumes the first 20 minutes of most counselling appointments.

### What Makes This Not Just a Chatbot

| Capability | Simple Chatbot | ClarityAI |
|---|---|---|
| Input source | Typed/spoken text only | Text + voice + keystroke dynamics + session metadata |
| Response strategy | Static system prompt | Dynamically rewritten system prompt per cognitive state |
| Output | Conversation | Conversation + structured behavioural brief + PDF |
| Third-party value | None | Counsellor receives a complete briefing before meeting the student |
| State awareness | None | Continuous clarity score driving a 3-mode state machine |

---

## 2. Problem Statement

Final-year students make decade-long decisions while their prefrontal cortex is physiologically suppressed by anxiety. Counsellors have no visibility into that state — only transcripts and 50-minute sessions that spend the first 20 minutes on context-gathering.

ClarityAI bridges this gap. The student interacts with what feels like a brilliant, always-available mentor. The counsellor receives a structured behavioural brief before every session. The platform infers cognitive state from what the student *does*, not what they *say* about themselves.

**Voice is not a secondary feature.** The primary onboarding and ongoing interaction modality is voice. Text input is a fallback and complement, not the default. This distinction must be preserved in all architectural decisions.

---

## 3. Build Scope & Phase Structure

### Phase 1 — Backend MVP (Current Sprint)
Build a fully functional, containerised Python backend that exposes REST and WebSocket APIs consumable by any frontend. The backend must handle the complete voice conversation loop and all intelligence layers end-to-end.

**Phase 1 is complete when:**
- A client can send an audio chunk and receive an audio response (full STT → LLM → TTS loop)
- Sessions persist to the database across multiple API calls
- The cognitive clarity score is computed and drives LLM system prompt selection
- A counsellor brief can be generated on demand and returned as a PDF
- The whole system runs via `docker compose up`

### Phase 2 — Frontend (Subsequent Sprint, React Native)
A React Native developer will consume the Phase 1 APIs to build the student-facing mobile/web UI. This PRD includes a dedicated handoff section (Section 14) with everything they need.

### Phase 3 — Hardening & Features
Multi-session persistence, theme extraction, institution admin portal, school SIS integration, counsellor dashboard.

---

## 4. Tech Stack & Constraints

### Hard Requirements
| Layer | Technology | Rationale |
|---|---|---|
| Backend language | Python 3.11+ | Required |
| LLM / Chat | Google Gemini API (`gemini-2.0-flash`) | Primary AI provider |
| Speech-to-Text | DeepGram API (free tier) | Proven, free for MVP |
| Text-to-Speech | Gemini TTS (`gemini-2.5-flash-preview-tts`) | Same API key as LLM — zero additional setup |
| Containerisation | Docker + Docker Compose | Required; must be `docker compose up` deployable |
| Web framework | FastAPI | Async-native, WebSocket support, OpenAPI auto-docs |
| Database | PostgreSQL 15 (via Docker) | Session persistence, signal history |
| ORM | SQLAlchemy 2.0 + Alembic | Migrations, type safety |
| Task queue | None for MVP (inline async) | Avoid complexity; add Celery in Phase 3 if needed |

### Soft Constraints (Free Tier Priority)
- Prefer free API tiers throughout the MVP. Only upgrade to paid if a free tier is genuinely non-functional (not merely suboptimal).
- DeepGram free tier: 45,000 minutes/month — sufficient for MVP/hackathon.
- Gemini free tier: 15 RPM, 1M tokens/day on `gemini-2.0-flash` — sufficient for MVP.
- Gemini TTS: same API key, same quota pool — no separate signup or billing required.

### What We Are NOT Building in Phase 1
- Any frontend UI
- Authentication / user login (use session tokens for MVP)
- Payment / subscription management
- Institution admin portal
- Mobile push notifications
- School SIS integration

---

## 5. System Architecture — Phase 1 Backend

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT (any frontend)                      │
│         React Native App / Browser / Postman / curl              │
└────────────┬────────────────────────────────────┬────────────────┘
             │ REST (HTTP/JSON)                    │ WebSocket
             ▼                                     ▼
┌──────────────────────────────────────────────────────────────────┐
│                     FastAPI Application                           │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │  REST API   │  │  WebSocket   │  │     Background Tasks   │  │
│  │  Routes     │  │  Handler     │  │  (async, no queue)     │  │
│  └──────┬──────┘  └──────┬───────┘  └───────────┬────────────┘  │
│         └────────────────┼──────────────────────┘               │
│                          ▼                                        │
│         ┌────────────────────────────────┐                       │
│         │        Service Orchestrator    │                       │
│         └──┬──────────┬──────────┬───────┘                       │
│            │          │          │                                │
│     ┌──────▼──┐  ┌────▼────┐ ┌──▼──────────┐                    │
│     │  Voice  │  │  LLM    │ │  Cognitive  │                    │
│     │ Service │  │ Service │ │   Engine    │                    │
│     └──┬──────┘  └────┬────┘ └──┬──────────┘                    │
│        │              │          │                                │
│   ┌────▼────┐    ┌────▼────┐ ┌──▼─────────┐                     │
│   │DeepGram │    │ Gemini  │ │  Clarity   │                     │
│   │  STT    │    │  Chat   │ │  Score     │                     │
│   └─────────┘    └────┬────┘ │  Computer  │                     │
│                        │     └────────────┘                      │
│                   ┌────▼────┐                                     │
│                   │ Google  │                                     │
│                   │   TTS   │                                     │
│                   └─────────┘                                     │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              Brief Generator + PDF Renderer                │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              Repository Layer (SQLAlchemy)                 │  │
│  └────────────────────────┬───────────────────────────────────┘  │
└───────────────────────────┼──────────────────────────────────────┘
                            │
              ┌─────────────▼──────────────┐
              │        PostgreSQL           │
              │   (sessions, messages,      │
              │    signals, briefs)         │
              └────────────────────────────┘
```

### Directory Structure

```
clarityai-backend/
├── app/
│   ├── main.py                    # FastAPI app entry point
│   ├── config.py                  # Settings from env vars (pydantic-settings)
│   ├── dependencies.py            # FastAPI dependency injection
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes/
│   │   │   ├── voice.py           # Voice endpoints (STT/TTS)
│   │   │   ├── chat.py            # Text chat endpoints
│   │   │   ├── session.py         # Session management
│   │   │   ├── brief.py           # Brief generation + PDF export
│   │   │   └── health.py          # Health check
│   │   └── websocket/
│   │       └── voice_ws.py        # Real-time voice WebSocket handler
│   │
│   ├── services/
│   │   ├── voice_service.py       # STT + TTS orchestration
│   │   ├── llm_service.py         # Gemini chat + prompt management
│   │   ├── cognitive_engine.py    # Clarity score computation
│   │   ├── linguistic_classifier.py  # NLP signal extraction
│   │   ├── brief_service.py       # Brief generation logic
│   │   └── pdf_service.py         # PDF rendering (WeasyPrint)
│   │
│   ├── integrations/
│   │   ├── deepgram_client.py     # DeepGram STT wrapper
│   │   ├── gemini_client.py       # Gemini LLM wrapper
│   │   └── gemini_tts_client.py   # Gemini TTS wrapper (same API key, no extra setup)
│   │
│   ├── models/
│   │   ├── db/
│   │   │   ├── base.py
│   │   │   ├── session.py         # DB: Session model
│   │   │   ├── message.py         # DB: Message model
│   │   │   ├── signal.py          # DB: ClaritySignal model
│   │   │   └── brief.py           # DB: Brief model
│   │   └── schemas/
│   │       ├── voice.py           # Pydantic request/response schemas
│   │       ├── chat.py
│   │       ├── session.py
│   │       └── brief.py
│   │
│   ├── repositories/
│   │   ├── session_repo.py
│   │   ├── message_repo.py
│   │   └── signal_repo.py
│   │
│   └── utils/
│       ├── audio.py               # Audio format conversion helpers
│       └── prompts.py             # System prompt templates
│
├── alembic/                       # DB migrations
│   ├── env.py
│   └── versions/
│
├── templates/
│   └── brief_template.html        # Jinja2 HTML template for PDF
│
├── tests/
│   ├── test_voice.py
│   ├── test_cognitive.py
│   └── test_brief.py
│
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
├── .env.example
└── README.md
```

---

## 6. API Service Contracts

All endpoints return JSON unless otherwise specified. Base URL: `http://localhost:8000/api/v1`

### 6.1 Session Management

#### `POST /sessions`
Create a new student session.

**Request body:**
```json
{
  "student_id": "optional-existing-student-uuid",
  "consent_given": true
}
```

**Response:**
```json
{
  "session_id": "uuid",
  "student_id": "uuid",
  "created_at": "2026-03-28T10:00:00Z",
  "clarity_mode": "guidance",
  "clarity_score": null
}
```

---

#### `GET /sessions/{session_id}`
Retrieve session state including current clarity score and mode.

**Response:**
```json
{
  "session_id": "uuid",
  "student_id": "uuid",
  "created_at": "2026-03-28T10:00:00Z",
  "clarity_mode": "grounding",
  "clarity_score": 0.23,
  "message_count": 7,
  "signals": {
    "backspace_rate": 0.31,
    "catastrophising_score": 0.72,
    "late_night": true
  }
}
```

---

### 6.2 Voice Endpoints

#### `POST /voice/transcribe`
Send an audio file, receive transcribed text. This is the STT step in isolation.

**Request:** `multipart/form-data`
- `audio` (file): Audio blob. Accepted formats: `webm`, `ogg`, `mp3`, `wav`, `m4a`
- `session_id` (string): Active session UUID
- `language` (string, optional): Default `en-US`

**Response:**
```json
{
  "transcript": "I don't know which universities to even look at anymore",
  "confidence": 0.94,
  "duration_seconds": 4.2
}
```

---

#### `POST /voice/synthesise`
Convert text to speech audio. Returns audio bytes.

**Request body:**
```json
{
  "text": "It sounds like you have a lot on your mind right now.",
  "voice": "en-US-Neural2-F",
  "session_id": "uuid"
}
```

**Response:** `audio/mpeg` binary stream (or `audio/webm` depending on config)

Also returns headers:
```
X-Audio-Duration: 3.4
X-Voice-Used: en-US-Neural2-F
```

---

#### `POST /voice/turn`
**Primary endpoint.** Full voice turn: audio in → transcribe → LLM → synthesise → audio out. This is the main loop the frontend calls for each student voice input.

**Request:** `multipart/form-data`
- `audio` (file): Student's spoken audio chunk
- `session_id` (string): Active session UUID
- `keystroke_signals` (JSON string, optional): Client-side keystroke metrics if available (see Section 9)

**Response:** `multipart/mixed` with two parts:
1. JSON metadata part:
```json
{
  "session_id": "uuid",
  "transcript": "I don't think I can do this anymore",
  "ai_text": "That sounds really overwhelming. What's the one thing weighing on you most right now?",
  "clarity_mode": "grounding",
  "clarity_score": 0.18,
  "turn_id": "uuid",
  "processing_ms": {
    "stt": 420,
    "llm": 1100,
    "tts": 380,
    "total": 1900
  }
}
```
2. Audio part: `audio/mpeg` — the synthesised AI response

> **Note for frontend dev:** If multipart response parsing is complex in React Native, an alternative is `POST /voice/turn` returning JSON with a `audio_url` field pointing to `GET /voice/audio/{turn_id}`. The backend should support both modes via an `response_mode=url|binary` query param.

---

#### `WebSocket /ws/voice/{session_id}`
Real-time streaming voice. For lower latency than the REST turn endpoint. Designed for when the frontend streams audio chunks as they are recorded rather than sending a complete file.

**Client → Server messages:**
```json
{ "type": "audio_chunk", "data": "<base64 encoded audio chunk>", "sequence": 1 }
{ "type": "end_of_speech" }
{ "type": "keystroke_signals", "data": { "backspace_rate": 0.12, ... } }
```

**Server → Client messages:**
```json
{ "type": "transcript_partial", "text": "I don't think..." }
{ "type": "transcript_final", "text": "I don't think I can do this anymore", "confidence": 0.91 }
{ "type": "ai_text_start" }
{ "type": "ai_text_chunk", "text": "That sounds really " }
{ "type": "ai_text_chunk", "text": "overwhelming." }
{ "type": "ai_text_end", "clarity_mode": "grounding", "clarity_score": 0.18 }
{ "type": "audio_chunk", "data": "<base64 encoded TTS audio>", "sequence": 1 }
{ "type": "audio_end" }
```

---

### 6.3 Text Chat Endpoints

For text-based interaction (fallback to voice, or for frontend chat UI).

#### `POST /chat/message`

**Request body:**
```json
{
  "session_id": "uuid",
  "message": "What are good universities for psychology in the UK?",
  "keystroke_signals": {
    "backspace_rate": 0.08,
    "typing_rhythm_std_dev": 120,
    "pre_send_pause_ms": 2400,
    "message_abandoned_count": 0
  }
}
```

**Response:**
```json
{
  "turn_id": "uuid",
  "ai_message": "The UK has several strong options for psychology...",
  "clarity_mode": "guidance",
  "clarity_score": 0.78,
  "linguistic_signals": {
    "catastrophising": 0.05,
    "rumination": 0.10,
    "avoidance": 0.08,
    "temporal_collapse": 0.02
  }
}
```

---

### 6.4 Brief Generation

#### `POST /briefs/generate`
Generate a counsellor brief from session data.

**Request body:**
```json
{
  "student_id": "uuid",
  "session_ids": ["uuid1", "uuid2"],
  "days_back": 30
}
```
Either `session_ids` or `days_back` must be provided. If `days_back` is used, the backend fetches all sessions for the student in that window.

**Response:**
```json
{
  "brief_id": "uuid",
  "student_id": "uuid",
  "generated_at": "2026-03-28T10:00:00Z",
  "period_start": "2026-02-26T00:00:00Z",
  "period_end": "2026-03-28T00:00:00Z",
  "session_count": 8,
  "sections": {
    "session_overview": "...",
    "core_concerns": [...],
    "behavioural_signals": [...],
    "trajectory": "...",
    "suggested_focus_areas": [...]
  },
  "status": "ready"
}
```

---

#### `GET /briefs/{brief_id}/pdf`
Download the brief as a PDF.

**Response:** `application/pdf` binary stream

**Response headers:**
```
Content-Disposition: attachment; filename="clarityai-brief-2026-03-28.pdf"
Content-Type: application/pdf
```

---

#### `GET /briefs/{brief_id}/preview`
Return brief content as JSON for student preview before sharing. Same schema as `POST /briefs/generate` response.

---

## 7. Voice Pipeline (Primary Feature)

Voice is the **primary interaction modality**. The architecture must reflect this: voice is not a thin wrapper over the text pipeline; it is the primary pipeline, and text is the secondary path.

### 7.1 Speech-to-Text — DeepGram

**Provider:** DeepGram Nova-2 model (free tier)  
**SDK:** `deepgram-sdk` Python package

```python
# integrations/deepgram_client.py

from deepgram import DeepgramClient, PrerecordedOptions, LiveOptions
import asyncio

class DeepgramSTTClient:
    def __init__(self, api_key: str):
        self.client = DeepgramClient(api_key)

    async def transcribe_file(self, audio_bytes: bytes, mimetype: str = "audio/webm") -> dict:
        """Transcribe a complete audio file. Used in REST /voice/turn endpoint."""
        options = PrerecordedOptions(
            model="nova-2",
            smart_format=True,
            language="en-US",
            punctuate=True,
            utterances=False,
        )
        source = {"buffer": audio_bytes, "mimetype": mimetype}
        response = await self.client.listen.asyncprerecorded.v("1").transcribe_file(source, options)
        channel = response.results.channels[0]
        alternative = channel.alternatives[0]
        return {
            "transcript": alternative.transcript,
            "confidence": alternative.confidence,
        }

    async def transcribe_stream(self, audio_generator, on_transcript_callback):
        """Streaming transcription for WebSocket path."""
        options = LiveOptions(
            model="nova-2",
            language="en-US",
            smart_format=True,
            interim_results=True,
            endpointing=500,  # ms silence before end-of-utterance
        )
        # Implementation: open a DeepGram live connection and pipe audio_generator chunks
        # Call on_transcript_callback(text, is_final) for each result
        ...
```

**Audio format notes:**
- Accept: `webm/opus` (default React Native output), `ogg/opus`, `wav`, `mp3`, `m4a`
- Do not transcode on the server unless DeepGram rejects the format. DeepGram handles most formats natively.
- Max audio chunk for REST endpoint: 25MB (matches DeepGram prerecorded limit)
- For WebSocket path: stream in 100ms chunks

---

### 7.2 Text-to-Speech — Gemini TTS

**Provider:** Gemini TTS via `gemini-2.5-flash-preview-tts`  
**SDK:** `google-generativeai` — the same package already used for the LLM. No additional signup, no billing, no new credentials.

This is the deliberate choice for the hackathon: one API key, one SDK, zero setup friction.

```python
# integrations/gemini_tts_client.py

import google.generativeai as genai
from google.generativeai import types

VOICE_BY_MODE = {
    "grounding":    {"voice_name": "Aoede",   "style_hint": "Speak very slowly, softly, and warmly. Be calm and unhurried."},
    "structuring":  {"voice_name": "Aoede",   "style_hint": "Speak gently and clearly, at a measured pace."},
    "guidance":     {"voice_name": "Charon",  "style_hint": "Speak clearly and confidently, at a natural conversational pace."},
}

class GeminiTTSClient:
    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)

    async def synthesise(self, text: str, mode: str = "guidance") -> bytes:
        """
        Returns raw PCM audio bytes (LINEAR16, 24kHz).
        Convert to MP3/WebM in the audio utility layer before sending to client.
        """
        voice_config = VOICE_BY_MODE.get(mode, VOICE_BY_MODE["guidance"])

        # Prepend a style instruction as a spoken direction — Gemini TTS
        # respects natural language instructions about delivery
        styled_text = f"[{voice_config['style_hint']}] {text}"

        response = self.client.models.generate_content(
            model="gemini-2.5-flash-preview-tts",
            contents=styled_text,
            config=types.GenerateContentConfig(
                response_modalities=["AUDIO"],
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(
                            voice_name=voice_config["voice_name"],
                        )
                    )
                ),
            ),
        )

        # Extract raw audio bytes from response
        audio_data = response.candidates[0].content.parts[0].inline_data.data
        return audio_data  # Raw PCM bytes — pipe through ffmpeg or soundfile to get MP3
```

**Available Gemini voices (as of March 2026):**
`Zephyr`, `Puck`, `Charon`, `Kore`, `Fenrir`, `Leda`, `Orus`, `Aoede`, `Callirrhoe`, `Autonoe`, `Enceladus`, `Iapetus`, `Umbriel`, `Algieba`, `Despina`, `Erinome`, `Algenib`, `Rasalgethi`, `Laomedeia`, `Achernar`, `Alnilam`, `Schedar`, `Gacrux`, `Pulcherrima`, `Achird`, `Zubenelgenubi`, `Vindemiatrix`, `Sadachbia`, `Sadaltager`, `Sulafat`

**Voice selection per clarity mode:**

| Clarity Mode | Voice | Style instruction |
|---|---|---|
| Grounding | `Aoede` | Slow, soft, warm — unhurried |
| Structuring | `Aoede` | Gentle, measured pace |
| Guidance | `Charon` | Clear, confident, natural |

Since Gemini TTS doesn't expose speaking rate/pitch as numeric params, tone is shaped via the style hint prepended to the text. This works reliably — Gemini TTS responds to natural language delivery instructions.

**Audio format note:** Gemini TTS returns raw PCM (LINEAR16, 24kHz mono). Add `ffmpeg` to the Dockerfile to convert to MP3 or WebM before sending to the client. This is a one-line conversion and must be in the `audio.py` utility:

```python
# utils/audio.py
import subprocess

def pcm_to_mp3(pcm_bytes: bytes, sample_rate: int = 24000) -> bytes:
    """Convert raw PCM bytes to MP3 using ffmpeg."""
    result = subprocess.run(
        [
            "ffmpeg", "-f", "s16le", "-ar", str(sample_rate), "-ac", "1",
            "-i", "pipe:0", "-f", "mp3", "pipe:1"
        ],
        input=pcm_bytes,
        capture_output=True,
        check=True,
    )
    return result.stdout
```

---

### 7.3 Full Voice Turn — Orchestration

```python
# services/voice_service.py

class VoiceService:
    async def process_voice_turn(
        self,
        session_id: str,
        audio_bytes: bytes,
        audio_mimetype: str,
        keystroke_signals: dict | None = None,
    ) -> VoiceTurnResult:
        
        # 1. STT
        stt_result = await self.deepgram.transcribe_file(audio_bytes, audio_mimetype)
        transcript = stt_result["transcript"]
        
        # 2. Load session state + message history
        session = await self.session_repo.get(session_id)
        history = await self.message_repo.get_recent(session_id, limit=20)
        
        # 3. Extract linguistic signals from transcript
        linguistic_signals = await self.linguistic_classifier.classify(transcript)
        
        # 4. Compute clarity score
        clarity_result = await self.cognitive_engine.compute(
            session_id=session_id,
            linguistic_signals=linguistic_signals,
            keystroke_signals=keystroke_signals or {},
            session_metadata=session.to_metadata_dict(),
        )
        
        # 5. Select system prompt based on clarity mode
        system_prompt = self.prompt_builder.build(
            mode=clarity_result.mode,
            student_context=session.student_context,
        )
        
        # 6. LLM — generate response
        ai_text = await self.llm_service.chat(
            system_prompt=system_prompt,
            history=history,
            user_message=transcript,
        )
        
        # 7. TTS — synthesise response via Gemini TTS
        pcm_bytes = await self.gemini_tts.synthesise(
            text=ai_text,
            mode=clarity_result.mode.value,
        )
        audio_bytes_out = pcm_to_mp3(pcm_bytes)  # Convert PCM → MP3 via ffmpeg
        
        # 8. Persist everything
        await self.message_repo.save_turn(
            session_id=session_id,
            user_text=transcript,
            ai_text=ai_text,
            linguistic_signals=linguistic_signals,
            keystroke_signals=keystroke_signals,
            clarity_score=clarity_result.score,
            clarity_mode=clarity_result.mode,
        )
        
        return VoiceTurnResult(
            transcript=transcript,
            ai_text=ai_text,
            audio_bytes=audio_bytes_out,
            clarity_mode=clarity_result.mode,
            clarity_score=clarity_result.score,
        )
```

---

## 8. Conversation & LLM Engine

### 8.1 Gemini Integration

**Model:** `gemini-2.0-flash` (fast, cheap, free tier generous)  
**SDK:** `google-generativeai` Python package

```python
# integrations/gemini_client.py

import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold

class GeminiClient:
    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            safety_settings={
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            },
        )

    async def chat(
        self,
        system_prompt: str,
        history: list[dict],
        user_message: str,
        max_tokens: int = 512,
    ) -> str:
        """Non-streaming chat completion."""
        # Build Gemini-format history
        gemini_history = [
            {"role": msg["role"], "parts": [msg["content"]]}
            for msg in history
        ]
        chat_session = self.model.start_chat(
            history=gemini_history,
            # Gemini doesn't take a system prompt in the same call — prepend it
        )
        # Prepend system prompt to first user message if history is empty,
        # otherwise inject as a context reminder
        full_message = f"{system_prompt}\n\n---\n\nStudent: {user_message}"
        response = await chat_session.send_message_async(full_message)
        return response.text
```

**Important:** Gemini does not support a separate `system` role the way OpenAI does. The system prompt must be prepended to the user message or injected as an initial model context. The `llm_service.py` must handle this translation layer cleanly so that swapping providers later does not require touching other services.

---

### 8.2 System Prompt Architecture

The system prompt is the control surface for the cognitive state machine. It is rebuilt on every turn.

```python
# utils/prompts.py

BASE_CONTEXT = """
You are a supportive career and university guidance advisor for high school students 
aged 16–18. You are knowledgeable, warm, and patient. You never diagnose, never 
prescribe, and never replace professional counselling.

You are speaking with a student who is navigating university applications and career 
decisions. Your responses will be read aloud to them via text-to-speech, so:
- Write in natural spoken English, not bullet points or markdown
- Keep sentences short enough to be comfortable to hear
- Never use headers, bold text, or list formatting
- Speak as you would in a real conversation

Student context: {student_context}
"""

GROUNDING_MODE_INSTRUCTIONS = """
CURRENT MODE: GROUNDING

The student appears to be in a state of cognitive overload or high anxiety. 
Your behaviour in this mode:
- Respond in 2–3 short sentences MAXIMUM
- Do NOT introduce new information, comparisons, or options
- Reflect back what you heard before asking anything
- Ask only ONE grounding question: focus on the single biggest thing on their mind
- Acknowledge difficulty without amplifying it
- Do NOT give advice, rankings, or recommendations
- Your tone is calm, slow, and warm — like a trusted older sibling who has been there

Example opening: "That sounds like a lot to hold all at once."
"""

STRUCTURING_MODE_INSTRUCTIONS = """
CURRENT MODE: STRUCTURING

The student is beginning to stabilise. They need help externalising and organising 
their thinking.
- Begin naming and gently organising what the student has expressed
- Introduce light Socratic questions: "You've mentioned X a few times — is that 
  the main thing you're worried about?"
- Separate facts from fears in what they say
- Do NOT yet introduce rankings, recommendations, or comparisons
- Validate while introducing gentle cognitive structure
- Keep responses to 4–5 sentences maximum
"""

GUIDANCE_MODE_INSTRUCTIONS = """
CURRENT MODE: GUIDANCE

The student is cognitively available for substantive guidance.
- Provide real career and university guidance — specific, comparative, useful
- Offer structured comparisons, rankings, and option analyses when helpful
- Introduce frameworks: values clarification, pros/cons, timeline mapping
- Answer specific questions about courses, countries, entry requirements accurately
- Build continuity with earlier parts of the conversation
- You can be more comprehensive now — up to 8–10 sentences if the content warrants it
"""

CRISIS_ADDENDUM = """
CRISIS OVERRIDE: The student has used language consistent with genuine distress 
beyond career anxiety. Before responding to any career content, say exactly:
"It sounds like things are really difficult right now. Please speak to a trusted 
adult or call a support line — in the UK, you can reach Samaritans on 116 123."
Then respond briefly and warmly to their message.
"""
```

---

### 8.3 Prompt Builder

```python
# services/llm_service.py

class PromptBuilder:
    def build(self, mode: ClarityMode, student_context: str, crisis: bool = False) -> str:
        mode_instructions = {
            ClarityMode.GROUNDING: GROUNDING_MODE_INSTRUCTIONS,
            ClarityMode.STRUCTURING: STRUCTURING_MODE_INSTRUCTIONS,
            ClarityMode.GUIDANCE: GUIDANCE_MODE_INSTRUCTIONS,
        }[mode]

        prompt = BASE_CONTEXT.format(student_context=student_context or "Not provided")
        prompt += "\n\n" + mode_instructions

        if crisis:
            prompt += "\n\n" + CRISIS_ADDENDUM

        return prompt
```

---

## 9. Cognitive Signal Layer

### 9.1 Linguistic Classifier

Runs on every message (spoken transcript or typed text). Uses Gemini with a structured JSON output prompt to classify signals. This avoids building a custom NLP model for the MVP.

```python
# services/linguistic_classifier.py

CLASSIFIER_PROMPT = """
You are a linguistic analysis tool. Analyse the following student message and return 
a JSON object with scores between 0.0 and 1.0 for each of these signal categories.
Return ONLY valid JSON, no other text.

Categories:
- catastrophising: absolute/extreme language ("never", "always", "ruined", "impossible")
- rumination: repeating the same concern without resolution
- avoidance: deflecting, "I don't know" frequency, subject changes mid-thought
- temporal_collapse: absence of future-tense language, present-tense dread only
- cognitive_narrowing: very short or vocabulary-contracted response
- self_deprecation: attributing difficulty to personal failure

Message: "{message}"

Return format:
{
  "catastrophising": 0.0,
  "rumination": 0.0,
  "avoidance": 0.0,
  "temporal_collapse": 0.0,
  "cognitive_narrowing": 0.0,
  "self_deprecation": 0.0,
  "summary": "one sentence description"
}
"""

class LinguisticClassifier:
    async def classify(self, message: str) -> LinguisticSignals:
        if len(message.strip()) < 3:
            return LinguisticSignals.empty()
        
        response = await self.gemini.classify(CLASSIFIER_PROMPT.format(message=message))
        return LinguisticSignals(**json.loads(response))
```

---

### 9.2 Keystroke Signals (Client-Side, Forwarded to Backend)

**These signals are computed on the client and forwarded as a JSON payload.** The backend never receives raw keystrokes. The client computes the following metrics and sends them with each turn:

```json
{
  "backspace_rate": 0.12,
  "typing_rhythm_std_dev_ms": 145,
  "pre_send_pause_ms": 3200,
  "message_abandoned_count_this_session": 2,
  "burst_pattern_detected": false
}
```

**For Phase 1 backend testing:** If no keystroke data is provided, default all signals to `null` and exclude them from the clarity score computation. The score must still be computable from linguistic signals and session metadata alone.

---

### 9.3 Clarity Score Engine

```python
# services/cognitive_engine.py

class CognitiveEngine:
    """
    Computes the Cognitive Clarity Score and maps it to a 3-state mode.
    
    Weights:
    - Linguistic signals: 50%
    - Keystroke signals: 30% (0% if not provided)
    - Session metadata: 20%
    
    Score range: 0.0 (lowest clarity) to 1.0 (highest clarity)
    Mode mapping:
    - 0.00–0.33 → GROUNDING
    - 0.34–0.66 → STRUCTURING
    - 0.67–1.00 → GUIDANCE
    
    Score is a rolling average of the last 5 readings to prevent rapid oscillation.
    """

    async def compute(
        self,
        session_id: str,
        linguistic_signals: LinguisticSignals,
        keystroke_signals: dict,
        session_metadata: dict,
    ) -> ClarityResult:
        
        linguistic_score = self._score_linguistic(linguistic_signals)
        keystroke_score = self._score_keystroke(keystroke_signals)
        metadata_score = self._score_metadata(session_metadata)
        
        # Weighted combination
        if keystroke_signals:
            raw_score = (linguistic_score * 0.50 + keystroke_score * 0.30 + metadata_score * 0.20)
        else:
            # Redistribute keystroke weight to linguistic
            raw_score = (linguistic_score * 0.70 + metadata_score * 0.30)
        
        # Rolling average
        recent_scores = await self.signal_repo.get_recent_scores(session_id, limit=5)
        all_scores = recent_scores + [raw_score]
        smoothed_score = sum(all_scores) / len(all_scores)
        
        mode = self._score_to_mode(smoothed_score)
        
        await self.signal_repo.save_score(session_id, smoothed_score, mode)
        
        return ClarityResult(score=smoothed_score, mode=mode)

    def _score_linguistic(self, signals: LinguisticSignals) -> float:
        # High distress signals reduce clarity
        distress = (
            signals.catastrophising * 0.25 +
            signals.rumination * 0.20 +
            signals.avoidance * 0.20 +
            signals.temporal_collapse * 0.15 +
            signals.cognitive_narrowing * 0.10 +
            signals.self_deprecation * 0.10
        )
        return max(0.0, 1.0 - distress)

    def _score_metadata(self, metadata: dict) -> float:
        score = 1.0
        hour = metadata.get("session_hour", 12)
        if 22 <= hour or hour <= 4:
            score -= 0.3  # Late night penalty
        return max(0.0, score)

    def _score_to_mode(self, score: float) -> ClarityMode:
        if score < 0.34:
            return ClarityMode.GROUNDING
        elif score < 0.67:
            return ClarityMode.STRUCTURING
        else:
            return ClarityMode.GUIDANCE
```

---

### 9.4 Crisis Detection

A separate, non-scored check runs on every message. If triggered, it overrides the LLM system prompt with the crisis addendum regardless of clarity mode.

**Crisis trigger keywords/phrases** (regex, case-insensitive):
- `\b(i want to die|kill myself|end it all|not worth living|can't go on)\b`
- `\b(self harm|hurting myself)\b`

This is a blunt instrument — deliberately so. False positives are preferable to false negatives. When triggered:
1. Inject `CRISIS_ADDENDUM` into system prompt
2. Log the trigger to database with a flag (for counsellor brief)
3. Return a `crisis_flag: true` field in the API response (frontend can show a persistent banner)

---

## 10. Session & Persistence Layer

### 10.1 Database Schema

```sql
-- sessions: one per student interaction period
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    consent_given BOOLEAN NOT NULL DEFAULT FALSE,
    student_context JSONB DEFAULT '{}',
    session_hour INTEGER,  -- hour of day session started (for metadata scoring)
    message_count INTEGER DEFAULT 0
);

-- messages: every conversational turn
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    role VARCHAR(20) NOT NULL,  -- 'user' | 'assistant'
    content TEXT NOT NULL,
    input_modality VARCHAR(10) DEFAULT 'voice',  -- 'voice' | 'text'
    clarity_mode VARCHAR(20),
    clarity_score FLOAT,
    linguistic_signals JSONB,
    keystroke_signals JSONB
);

-- clarity_signals: per-turn signal history for trend analysis
CREATE TABLE clarity_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    clarity_score FLOAT NOT NULL,
    clarity_mode VARCHAR(20) NOT NULL,
    raw_signals JSONB  -- full signal breakdown for brief generation
);

-- briefs: generated counsellor briefs
CREATE TABLE briefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    session_count INTEGER,
    content JSONB NOT NULL,  -- structured brief sections
    pdf_bytes BYTEA,  -- stored PDF (optional; can regenerate on demand)
    crisis_flagged BOOLEAN DEFAULT FALSE
);
```

---

### 10.2 Session State Management

Sessions are stateless on the server between requests — all state is reconstructed from the database. There is no in-memory session cache in Phase 1. This keeps the architecture simple and horizontally scalable.

The client identifies itself by sending `session_id` (a UUID) with every request. For Phase 1, session tokens are the UUID itself. In Phase 3, replace with JWT authentication.

**Session lifecycle:**
1. Client calls `POST /sessions` → receives `session_id`
2. Client stores `session_id` locally (AsyncStorage in React Native)
3. Client sends `session_id` with every subsequent request
4. Sessions do not expire during Phase 1 (add TTL in Phase 3)

---

## 11. Counsellor Brief Generator

### 11.1 Brief Generation Pipeline

```python
# services/brief_service.py

class BriefService:
    async def generate(self, student_id: str, days_back: int = 30) -> BriefContent:
        
        # 1. Fetch all sessions and messages in period
        sessions = await self.session_repo.get_for_student(student_id, days_back)
        all_messages = await self.message_repo.get_for_sessions([s.id for s in sessions])
        all_signals = await self.signal_repo.get_for_sessions([s.id for s in sessions])
        
        # 2. Compute aggregate behavioural stats
        stats = self._compute_stats(sessions, all_messages, all_signals)
        
        # 3. Extract recurring themes via Gemini
        themes = await self._extract_themes(all_messages)
        
        # 4. Generate each brief section via Gemini with structured prompts
        overview = await self._generate_overview(stats, sessions)
        concerns = await self._generate_core_concerns(themes, all_messages)
        signals_section = await self._generate_signals_table(stats)
        trajectory = await self._generate_trajectory(all_signals)
        focus_areas = await self._generate_focus_areas(themes, all_signals)
        
        return BriefContent(
            session_overview=overview,
            core_concerns=concerns,
            behavioural_signals=signals_section,
            trajectory=trajectory,
            suggested_focus_areas=focus_areas,
            stats=stats,
            crisis_flagged=any(s.crisis_flagged for s in sessions),
        )
```

### 11.2 Brief Language Standards

Every Gemini prompt for brief generation must include this instruction:

```
CRITICAL LANGUAGE REQUIREMENTS:
- Never use clinical diagnostic language
- Never say "the student has anxiety" — say "behavioural signals consistent with elevated stress were observed"
- Never say "rumination detected" — say "the student returned to this theme X times without resolution — this may reflect rumination"
- Never assign numerical scores to the student
- Always use uncertainty framing: "may indicate", "consistent with", "observed", "suggested by"
- Never recommend therapy or clinical referral — use "the counsellor may wish to explore..."
- All statements must be behavioural observations, not character assessments
```

### 11.3 PDF Rendering

**Library:** WeasyPrint (pure Python, no browser dependency)

```python
# services/pdf_service.py

from weasyprint import HTML, CSS
from jinja2 import Environment, FileSystemLoader

class PDFService:
    def __init__(self):
        self.jinja_env = Environment(loader=FileSystemLoader("templates/"))

    def render(self, brief_content: BriefContent) -> bytes:
        template = self.jinja_env.get_template("brief_template.html")
        html_str = template.render(brief=brief_content)
        return HTML(string=html_str).write_pdf()
```

**Brief template design requirements** (for `templates/brief_template.html`):
- Clean, clinical aesthetic — white background, dark text, subtle accent colour
- ClarityAI logo + school name in header
- Mandatory disclaimer on every page: *"This document is generated from behavioural observations and is intended as an input to counsellor judgment, not a clinical assessment or diagnosis."*
- 2–3 pages maximum
- Each section labelled clearly with plain headings
- Trajectory section includes a simple line chart of clarity score over time (rendered as SVG embedded in HTML)
- Print-safe: no external fonts, no CDN dependencies

---

## 12. Docker & Deployment Spec

### 12.1 docker-compose.yml

```yaml
version: "3.9"

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://clarity:clarity@db:5432/clarityai
      - DEEPGRAM_API_KEY=${DEEPGRAM_API_KEY}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - ENVIRONMENT=development
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: clarity
      POSTGRES_PASSWORD: clarity
      POSTGRES_DB: clarityai
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U clarity"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

### 12.2 Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# WeasyPrint dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libcairo2 \
    libgdk-pixbuf2.0-0 \
    libffi-dev \
    shared-mime-info \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run DB migrations then start server
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"]
```

### 12.3 requirements.txt

```
fastapi==0.115.0
uvicorn[standard]==0.30.0
sqlalchemy[asyncio]==2.0.30
asyncpg==0.29.0
alembic==1.13.0
pydantic==2.7.0
pydantic-settings==2.3.0

# AI / Voice
google-generativeai==0.7.0
deepgram-sdk==3.4.0

# PDF
weasyprint==62.3
jinja2==3.1.4

# Utilities
python-multipart==0.0.9
httpx==0.27.0
python-dotenv==1.0.1
```

### 12.4 Running the Project

```bash
# 1. Clone the repo
git clone <repo-url>
cd clarityai-backend

# 2. Set up environment variables — only two API keys needed
cp .env.example .env
# Edit .env: set DEEPGRAM_API_KEY and GEMINI_API_KEY — that's it

# 3. Start everything
docker compose up --build

# 4. Verify
curl http://localhost:8000/api/v1/health
# → {"status": "ok", "db": "connected", "version": "1.0.0"}

# 5. View API docs
open http://localhost:8000/docs
```

---

## 13. Data Models (Pydantic Schemas)

```python
# models/schemas/voice.py

from pydantic import BaseModel
from enum import Enum

class ClarityMode(str, Enum):
    GROUNDING = "grounding"
    STRUCTURING = "structuring"
    GUIDANCE = "guidance"

class KeystrokeSignals(BaseModel):
    backspace_rate: float | None = None
    typing_rhythm_std_dev_ms: float | None = None
    pre_send_pause_ms: float | None = None
    message_abandoned_count: int | None = None
    burst_pattern_detected: bool | None = None

class VoiceTurnResponse(BaseModel):
    session_id: str
    turn_id: str
    transcript: str
    ai_text: str
    clarity_mode: ClarityMode
    clarity_score: float
    crisis_flag: bool = False
    audio_url: str | None = None  # Set when response_mode=url
    processing_ms: dict

class ChatMessageRequest(BaseModel):
    session_id: str
    message: str
    keystroke_signals: KeystrokeSignals | None = None

class ChatMessageResponse(BaseModel):
    turn_id: str
    ai_message: str
    clarity_mode: ClarityMode
    clarity_score: float
    crisis_flag: bool = False
    linguistic_signals: dict

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

class ClarityResult(BaseModel):
    score: float
    mode: ClarityMode
```

---

## 14. Phase 2 — Frontend Handoff Notes

This section is written for the React Native developer who will build the frontend.

### What the Backend Provides
- All intelligence is server-side. The frontend is a thin UI layer.
- **No API key needed in the frontend.** All third-party calls (DeepGram, Gemini, Google TTS) happen on the backend.

### Primary Interaction Loop (Voice)
```
User speaks
    ↓
Record audio (React Native: expo-av or react-native-audio-recorder-player)
    ↓
Send to POST /api/v1/voice/turn (multipart with audio + session_id)
    ↓
Receive JSON metadata + audio bytes (or audio_url)
    ↓
Play audio response (the AI speaking back)
    ↓
Display transcript below (user's speech and AI's response)
```

### Keystroke Signal Collection (If Text Input Used)
The frontend must collect and forward these signals when the student uses the text input field. The backend will include them in the clarity score.

```javascript
// Collect on the text input component
const keystrokes = [];
let lastKeystrokeTime = null;
let abandonedCount = 0;

onKeyPress = (e) => {
    const now = Date.now();
    if (e.key === 'Backspace') keystokes.push({ type: 'backspace', t: now });
    else keystrokes.push({ type: 'key', t: now });
    lastKeystrokeTime = now;
};

onSubmit = () => {
    const backspaceRate = keystrokes.filter(k => k.type === 'backspace').length / keystrokes.length;
    const gaps = keystrokes.slice(1).map((k, i) => k.t - keystrokes[i].t);
    const std = standardDeviation(gaps);
    const preSendPause = Date.now() - lastKeystrokeTime;
    
    sendToBackend({
        backspace_rate: backspaceRate,
        typing_rhythm_std_dev_ms: std,
        pre_send_pause_ms: preSendPause,
        message_abandoned_count: abandonedCount,
    });
};
```

### Critical: Crisis Flag
If the API response includes `"crisis_flag": true`, the frontend **must** display a persistent, non-dismissable banner:
> *"It sounds like things are really difficult right now. Please speak to a trusted adult or contact a support line."*

The banner should link to appropriate crisis resources for the student's region.

### WebSocket vs REST
For Phase 2 MVP, use the REST endpoint (`POST /voice/turn`). The WebSocket endpoint is for Phase 3 when sub-second latency becomes a priority.

### Session Persistence
Store `session_id` in AsyncStorage. On app launch, check if a `session_id` exists. If it does, resume by calling `GET /sessions/{session_id}`. If not (or if it returns 404), call `POST /sessions` to create one.

### Audio Format
Send audio as `audio/webm` (the default output of `expo-av` recording). The backend handles this natively via DeepGram.

---

## 15. Constraints, Risks & Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| DeepGram free tier quota exhausted during hackathon demo | Medium | Monitor usage dashboard. 45k minutes/month = ~750 hours. Very unlikely to hit during hackathon. |
| Gemini free tier rate limit (15 RPM) | Medium | Add exponential backoff with jitter on all Gemini calls. For MVP with 1–2 concurrent users, this will not be hit. |
| WeasyPrint font rendering differences across OS | Low | Test PDF generation in Docker container, not on host machine. The Dockerfile installs all required system libraries. |
| Gemini TTS returns raw PCM — must convert to MP3 | Medium | `ffmpeg` is included in the Dockerfile. `pcm_to_mp3()` utility in `utils/audio.py` handles this. Test this conversion in Docker, not on host. |
| Gemini linguistic classifier returning malformed JSON | High | Wrap all classifier calls in try/except. On parse failure, return `LinguisticSignals.empty()` and log the raw response. |
| Long TTS audio increasing perceived latency | Medium | Keep AI responses short in GROUNDING mode (2–3 sentences). In GUIDANCE mode, longer is acceptable. |
| Privacy: student conversations contain sensitive content | High | No data leaves the Docker environment except to Gemini/DeepGram APIs. Per-student session isolation in DB. Consent flow required before first message. |

---

## 16. Appendix: Environment Variables

```bash
# .env.example

# Database
DATABASE_URL=postgresql+asyncpg://clarity:clarity@db:5432/clarityai

# Google Gemini — covers both LLM and TTS (get from https://aistudio.google.com/apikey)
GEMINI_API_KEY=your_gemini_api_key_here

# DeepGram STT (get from https://console.deepgram.com — free tier, no card required)
DEEPGRAM_API_KEY=your_deepgram_api_key_here

# App config
ENVIRONMENT=development
LOG_LEVEL=INFO
MAX_SESSION_HISTORY_MESSAGES=20
CRISIS_DETECTION_ENABLED=true

# Brief config  
DEFAULT_BRIEF_DAYS_BACK=30
PDF_WATERMARK_TEXT=ClarityAI — Confidential
```

---

*This PRD is the authoritative build specification for Phase 1. Any feature not listed above is out of scope for Phase 1. Questions or scope clarifications should be resolved against this document before implementing.*

*ClarityAI — Cognitive-Adaptive Career Guidance Platform — Hackathon Build — March 2026*
