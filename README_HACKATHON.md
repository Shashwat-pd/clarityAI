# ClarityAI Hackathon README

ClarityAI is a cognitive-adaptive career guidance platform for students and school counsellors.
This project combines voice + text conversation, behavioral signal extraction, adaptive LLM mode switching, and counsellor-ready brief generation.

This document is a human-friendly hackathon README with a complete setup guide.
It does not replace existing docs. It includes them as part of the full project documentation set:

- Main technical README: [README.md](README.md)
- Frontend README: [frontend/README.md](frontend/README.md)

## 1. What We Built

ClarityAI supports:

- Voice and text conversation with students
- Real-time signal extraction from language and interaction patterns
- A rolling clarity score per session
- Adaptive response modes: grounding, structuring, guidance
- Multi-session pattern aggregation
- Counsellor brief generation and export (PDF and DOCX)

## 2. Hackathon Value Proposition

Typical chatbot systems respond to content only.
ClarityAI responds to state:

- It estimates how cognitively clear the student currently is
- It changes guidance style based on that score
- It provides explainable, structured outputs for counsellors

In short: we are not just answering questions, we are adapting support style to student readiness.

## 3. Tech Stack

Backend:

- FastAPI
- PostgreSQL + SQLAlchemy (async)
- Alembic migrations
- Gemini (LLM + TTS)
- Deepgram (STT)
- WeasyPrint for PDF export

Frontend:

- React Native with Expo (web + mobile)
- TypeScript
- Axios API client
- AsyncStorage for session persistence

## 4. Project Structure

```text
.
|- app/                    # FastAPI backend
|  |- api/                 # HTTP routes + websocket
|  |- services/            # LLM, voice, brief, cognitive logic
|  |- repositories/        # Data access layer
|  |- models/              # DB models + request/response schemas
|- alembic/                # DB migration scripts
|- tests/                  # Backend tests
|- templates/              # Brief rendering templates
|- frontend/               # Expo React Native app
|- docker-compose.yml      # API + Postgres local stack
|- Dockerfile              # Backend container build
```

## 5. Complete Setup (Recommended: Docker)

### 5.1 Prerequisites

Install:

- Docker Desktop
- Node.js 18+
- npm

API keys needed:

- Gemini API key
- Deepgram API key

### 5.2 Environment Setup

From repo root:

```bash
cp .env.example .env
```

Open `.env` and set:

```env
GEMINI_API_KEY=your_real_key
DEEPGRAM_API_KEY=your_real_key
```

### 5.3 Start Backend + Database

From repo root:

```bash
docker compose up --build
```

What this does:

- Starts PostgreSQL on port 5432
- Builds and starts FastAPI on port 8000
- Runs `alembic upgrade head` automatically before API start

### 5.4 Verify Backend

Health check:

```bash
curl http://localhost:8000/api/v1/health
```

Swagger docs:

- http://localhost:8000/docs

Root endpoint:

- http://localhost:8000/

## 6. Frontend Setup (Expo)

From repo root:

```bash
cd frontend
npm install
```

Run web app:

```bash
npm run web
```

Other targets:

```bash
npm run android
npm run ios
```

Frontend is configured to call:

- `http://localhost:8000/api/v1`

If needed, update API URL in [frontend/app.json](frontend/app.json).

## 7. Manual Backend Setup (Without Docker)

Use this only if you do not want Docker.

### 7.1 Requirements

- Python 3.11+
- PostgreSQL 15+
- System libraries for WeasyPrint and ffmpeg

### 7.2 Install dependencies

```bash
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 7.3 Configure DB + env

- Create Postgres DB and user matching `.env` values
- Ensure `DATABASE_URL` points to your local database

### 7.4 Run migrations and server

```bash
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## 8. Test Commands

Backend tests:

```bash
python -m unittest tests/test_text_features.py
```

Optional quick compile check:

```bash
python -m compileall app
```

## 9. Key API Endpoints

Session:

- `POST /api/v1/sessions`
- `GET /api/v1/sessions/{id}`

Conversation:

- `POST /api/v1/chat/message`
- `POST /api/v1/voice/turn`
- `WS /ws/voice/{session_id}`

Briefs:

- `POST /api/v1/briefs/generate`
- `GET /api/v1/briefs/{brief_id}/preview`
- `GET /api/v1/briefs/{brief_id}/pdf`
- `GET /api/v1/briefs/{brief_id}/export`

Health:

- `GET /api/v1/health`

## 10. Demo Script (Hackathon Friendly)

1. Start backend: `docker compose up --build`
2. Start frontend: `cd frontend && npm run web`
3. Create a session in UI
4. Send a few text turns and one voice turn
5. Show clarity changes and response mode shifts
6. Generate a counsellor brief
7. Export PDF/DOCX and show deterministic output

## 11. Troubleshooting

Backend does not start:

- Check Docker is running
- Confirm `.env` exists and keys are set
- Inspect logs with `docker compose logs -f api`

Database connection errors:

- Verify Postgres container is healthy
- Confirm `DATABASE_URL` matches compose values

Voice features not working:

- Verify Deepgram/Gemini keys are valid
- Ensure browser/device microphone permission is granted

Frontend cannot hit API:

- Ensure backend is at `http://localhost:8000`
- Confirm API URL in [frontend/app.json](frontend/app.json)

## 12. Included Existing README Content

This hackathon README intentionally includes and extends the existing docs:

- [README.md](README.md): detailed signal formulas, scoring pipeline, architecture notes
- [frontend/README.md](frontend/README.md): frontend feature and platform details

If you want a deeper technical explanation, read those files directly after finishing this quickstart.

## 13. Team Handoff Checklist

- [ ] `.env` configured with real API keys
- [ ] `docker compose up --build` succeeds
- [ ] Health endpoint returns OK
- [ ] Frontend loads and creates sessions
- [ ] Text + voice interactions work
- [ ] Brief generation and export succeed

---

For judges: start with Sections 5, 6, and 10 to get a live demo running quickly.
