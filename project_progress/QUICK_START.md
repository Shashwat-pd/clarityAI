# ClarityAI Backend - Quick Start Guide

## Prerequisites

- Docker & Docker Compose installed
- Gemini API key: https://aistudio.google.com/apikey
- Deepgram API key: https://console.deepgram.com

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

## Next Steps

1. Test all endpoints via Swagger UI: http://localhost:8000/docs
2. Read PRD: `ClarityAI_PRD.md`
3. Check detailed status: `project_progress/PHASE_1_STATUS.md`
4. Build React Native frontend (Phase 2)
