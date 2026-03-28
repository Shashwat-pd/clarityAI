# ClarityAI - Quick Start Guide

## Prerequisites

**Backend:**
- Docker & Docker Compose installed
- Gemini API key: https://aistudio.google.com/apikey
- Deepgram API key: https://console.deepgram.com

**Frontend (Phase 2):**
- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`

## Setup (30 seconds)

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env and add your API keys

# 2. Start the backend
docker compose up --build

# 3. Verify it's working
curl http://localhost:8000/api/v1/health
```

Expected response:
```json
{
  "status": "ok",
  "db": "connected",
  "version": "1.0.0"
}
```

## API Documentation

Open in browser: **http://localhost:8000/docs**

Interactive Swagger UI with all endpoints and schemas.

## Quick Test

```bash
# Create a session
SESSION_ID=$(curl -s -X POST http://localhost:8000/api/v1/sessions \
  -H "Content-Type: application/json" \
  -d '{"consent_given": true}' | jq -r '.session_id')

# Send a message
curl -X POST http://localhost:8000/api/v1/chat/message \
  -H "Content-Type: application/json" \
  -d "{
    \"session_id\": \"$SESSION_ID\",
    \"message\": \"I'm not sure what to study at university\"
  }" | jq
```

## Key Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/v1/sessions` | Create new session |
| `POST /api/v1/voice/turn` | Full voice interaction |
| `POST /api/v1/chat/message` | Text chat |
| `POST /api/v1/briefs/generate` | Generate counsellor PDF |

## Stop the Backend

```bash
docker compose down
```

## Troubleshooting

**Port 8000 already in use:**
```bash
# Change port in docker-compose.yml
ports:
  - "8001:8000"  # Use 8001 instead
```

**Database connection failed:**
```bash
docker compose down -v  # Remove volumes
docker compose up --build
```

**Gemini rate limit:**
- Free tier: 15 requests/minute
- Wait 60 seconds or upgrade API key

## What's Running?

- **API:** http://localhost:8000
- **Database:** PostgreSQL on port 5432
- **Docs:** http://localhost:8000/docs

## Project Structure

```
app/
├── api/routes/        # REST endpoints
├── services/          # Business logic
├── integrations/      # External APIs
├── models/            # DB & schemas
└── repositories/      # Data access
```

## Phase 2: Running the Frontend

### Setup (1 minute)

```bash
# 1. Install dependencies
cd frontend
npm install

# 2. Start the frontend (web)
npm run web

# Or for mobile:
npm run ios       # iOS simulator (Mac only)
npm run android   # Android emulator
```

### Full Stack Test

**Terminal 1 - Backend:**
```bash
docker compose up
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run web
```

Then open http://localhost:8081 in your browser and:
1. Click "🎤 Speak" to record a voice message
2. Or type a message in the text input at the bottom
3. Watch the AI respond with voice + text

### Frontend Structure

```
frontend/
├── src/
│   ├── components/       # UI components
│   ├── hooks/            # React hooks
│   ├── screens/          # App screens
│   ├── services/         # API client
│   └── types/            # TypeScript types
└── App.tsx               # Entry point
```

## Next Steps

1. **Backend:** Test all endpoints via Swagger UI at http://localhost:8000/docs
2. **Frontend:** Launch the web app with `cd frontend && npm run web`
3. **Documentation:**
   - Read PRD: `ClarityAI_PRD.md`
   - Phase 1 Status: `project_progress/PHASE_1_STATUS.md`
   - Phase 2 Status: `project_progress/PHASE_2_STATUS.md`
4. **Phase 3:** Multi-session persistence, admin portal, WebSocket streaming
