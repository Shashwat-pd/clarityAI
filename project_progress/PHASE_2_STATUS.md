# ClarityAI - Phase 2 Frontend Status

**Status:** ✅ **COMPLETE**
**Date:** March 29, 2026
**Branch:** `aarohan`

---

## Phase 2 Deliverables (Per PRD Section 3)

Phase 2 is complete when:
- [x] React Native mobile/web UI functional
- [x] Voice recording component implemented (expo-av)
- [x] Audio playback component implemented
- [x] Transcript display working
- [x] Session management with AsyncStorage
- [x] Keystroke signal collection functional
- [x] Crisis banner UI implemented
- [x] Full integration with Phase 1 APIs

---

## Completed Components

### ✅ Project Structure
- **Framework:** React Native with Expo 51
- **Language:** TypeScript for type safety
- **Platforms:** iOS, Android, and Web support
- **State Management:** React hooks (useState, useEffect)
- **Storage:** AsyncStorage for session persistence
- **HTTP Client:** Axios for API calls

### ✅ Core Components

#### VoiceRecorder (`src/components/VoiceRecorder.tsx`)
- Audio recording using expo-av
- Platform-specific audio formats:
  - Android: webm/opus
  - iOS: caf (backend converts)
  - Web: webm
- Microphone permission handling
- Recording state management
- Loading states during processing

#### AudioPlayer (`src/components/AudioPlayer.tsx`)
- Plays AI voice responses
- Supports both URI and base64 audio
- Auto-play functionality
- Playback status indicators
- Cleanup on component unmount

#### Transcript (`src/components/Transcript.tsx`)
- Scrollable conversation history
- User vs AI message differentiation
- Timestamps for each message
- Empty state handling
- Auto-scroll to latest messages

#### TextInputWithTracking (`src/components/TextInputWithTracking.tsx`)
- Text input with multiline support
- Keystroke signal collection:
  - Backspace rate tracking
  - Typing rhythm (std deviation)
  - Pre-send pause measurement
  - Message abandonment count
- Character limit (500 chars)
- Submit button with loading state

#### CrisisBanner (`src/components/CrisisBanner.tsx`)
- Non-dismissable alert banner
- Displays when `crisis_flag: true`
- Links to international support resources
- Red warning styling per PRD requirements

### ✅ Custom Hooks

#### useSession (`src/hooks/useSession.ts`)
- Automatic session initialization
- AsyncStorage persistence
- Session resume logic
- Error handling
- Session refresh capability
- Clear session function

#### useKeystrokeTracking (`src/hooks/useKeystrokeTracking.ts`)
- Keystroke event logging
- Backspace rate calculation
- Typing rhythm analysis (std dev)
- Pre-send pause measurement
- Abandon tracking
- Signal extraction for API submission

### ✅ API Integration

#### ApiService (`src/services/api.ts`)
All Phase 1 endpoints integrated:
- `POST /api/v1/sessions` - Session creation
- `GET /api/v1/sessions/{id}` - Session retrieval
- `POST /api/v1/voice/turn` - Voice interaction
- `POST /api/v1/chat/message` - Text chat with keystroke signals
- `GET /api/v1/health` - Health check

Supports:
- Multipart form data for audio uploads
- JSON request/response parsing
- 30s default timeout (60s for voice)
- Base URL configuration via Expo config

### ✅ Main Screen

#### ChatScreen (`src/screens/ChatScreen.tsx`)
Orchestrates all components:
- Session initialization on mount
- Message state management
- Crisis flag handling
- Voice and text input modes
- Loading states
- Error handling
- Header with clarity mode badge

---

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── AudioPlayer.tsx          # AI voice playback
│   │   ├── CrisisBanner.tsx         # Crisis alert banner
│   │   ├── TextInputWithTracking.tsx # Text input with signals
│   │   ├── Transcript.tsx           # Message history
│   │   └── VoiceRecorder.tsx        # Voice recording
│   │
│   ├── hooks/
│   │   ├── useKeystrokeTracking.ts  # Keystroke signal hook
│   │   └── useSession.ts            # Session management hook
│   │
│   ├── screens/
│   │   └── ChatScreen.tsx           # Main app screen
│   │
│   ├── services/
│   │   └── api.ts                   # Backend API client
│   │
│   └── types/
│       └── index.ts                 # TypeScript interfaces
│
├── App.tsx                          # Entry point
├── app.json                         # Expo configuration
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
├── .gitignore
└── README.md                        # Setup instructions
```

**Total:** 16 TypeScript files

---

## Tech Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | React Native | 0.74.5 |
| Runtime | Expo | ~51.0.0 |
| Language | TypeScript | ~5.3.3 |
| Audio | expo-av | ~14.0.0 |
| Storage | @react-native-async-storage | 1.23.1 |
| HTTP | axios | ^1.7.0 |
| File System | expo-file-system | ~17.0.0 |

---

## Key Features

### Voice-First Design
- Primary interaction modality is voice
- Large, prominent "🎤 Speak" button
- Text input as fallback/complement
- Audio playback with status indicators

### Cognitive Signal Collection
When users type (not voice):
- **Backspace rate** - Hesitation/uncertainty measure
- **Typing rhythm** - Consistency of keystroke timing
- **Pre-send pause** - Time between last keystroke and send
- **Abandon count** - Messages started but cleared

### Crisis Detection
- Monitors `crisis_flag` in all API responses
- Shows persistent red banner with support resources
- Links to https://findahelpline.com (international)

### Session Management
- Auto-creates session on first launch
- Persists session_id in AsyncStorage
- Resumes existing sessions on app restart
- Graceful fallback if session expires

---

## Platform Support

### iOS
- ✅ Microphone permission configured
- ✅ Audio recording in .caf format
- ✅ Tested on simulator
- ✅ Tablet support enabled

### Android
- ✅ Microphone permission configured
- ✅ Audio recording in .webm/opus
- ✅ Adaptive icon configured
- ✅ Standard permissions model

### Web
- ✅ Browser microphone permission
- ✅ WebRTC audio recording
- ✅ Metro bundler configured
- ✅ Responsive design
- ✅ Chrome/Edge tested

---

## Running the Frontend

### Prerequisites
```bash
npm install -g expo-cli
cd frontend
npm install
```

### Start Backend (Terminal 1)
```bash
cd /Users/aarohan/Projects/clarityAI
docker compose up
```

### Start Frontend (Terminal 2)
```bash
cd frontend
npm run web       # Web browser
npm run ios       # iOS simulator (Mac only)
npm run android   # Android emulator
```

### Testing the Flow
1. Frontend starts → auto-creates session
2. Click "🎤 Speak" → record voice message
3. Voice sent to backend → AI responds with audio + text
4. AI audio plays automatically
5. Transcript shows conversation history
6. Text input available as fallback
7. Crisis banner appears if AI detects distress

---

## API Configuration

Default: `http://localhost:8000/api/v1`

Change in `frontend/app.json`:
```json
"extra": {
  "apiUrl": "http://your-backend-url/api/v1"
}
```

---

## Known Limitations

### Phase 2 Scope
- **WebSocket streaming:** Not implemented (Phase 3)
- **Multi-session history:** Single active session only
- **Brief viewing:** No counsellor brief UI yet (Phase 3)
- **Authentication:** Session tokens only, no JWT (Phase 3)
- **Offline support:** No offline mode
- **Push notifications:** Not implemented (Phase 3)

### Platform-Specific
- **iOS audio:** Backend converts .caf to .webm for Deepgram
- **Web audio:** Chrome/Edge recommended for best WebRTC support
- **Android permissions:** Must manually enable microphone in settings on some devices

---

## Files Created

| File | Purpose |
|------|---------|
| `frontend/package.json` | Dependencies and scripts |
| `frontend/tsconfig.json` | TypeScript configuration |
| `frontend/app.json` | Expo configuration |
| `frontend/App.tsx` | Application entry point |
| `frontend/src/types/index.ts` | TypeScript interfaces |
| `frontend/src/services/api.ts` | Backend API client |
| `frontend/src/hooks/useSession.ts` | Session management |
| `frontend/src/hooks/useKeystrokeTracking.ts` | Keystroke signals |
| `frontend/src/components/VoiceRecorder.tsx` | Voice recording |
| `frontend/src/components/AudioPlayer.tsx` | Audio playback |
| `frontend/src/components/Transcript.tsx` | Message history |
| `frontend/src/components/TextInputWithTracking.tsx` | Text input |
| `frontend/src/components/CrisisBanner.tsx` | Crisis alert |
| `frontend/src/screens/ChatScreen.tsx` | Main screen |
| `frontend/.gitignore` | Git ignore rules |
| `frontend/README.md` | Setup documentation |

---

## Integration with Phase 1

The frontend consumes all Phase 1 backend APIs:

### Session Flow
1. **App Launch** → `POST /sessions` (if no stored session)
2. **Resume** → `GET /sessions/{id}` (if session exists)

### Voice Flow
1. **Record Audio** → expo-av captures webm/opus
2. **Upload** → `POST /voice/turn` (multipart/form-data)
3. **Receive** → JSON with transcript + AI text + audio
4. **Play** → AudioPlayer plays response audio

### Text Flow
1. **Type Message** → Track keystrokes
2. **Send** → `POST /chat/message` with keystroke signals
3. **Receive** → JSON with AI response + clarity score

### Crisis Flow
1. **Any Response** → Check `crisis_flag` in response
2. **If True** → Display CrisisBanner
3. **Banner** → Persistent, links to support resources

---

## Next Steps: Phase 3

### Not Yet Started
Per PRD Section 3, Phase 3 includes:
- [ ] WebSocket streaming for lower latency
- [ ] Multi-session persistence and history
- [ ] Theme extraction across sessions
- [ ] Institution admin portal
- [ ] School SIS integration
- [ ] Counsellor dashboard
- [ ] JWT authentication
- [ ] Rate limiting on frontend
- [ ] Push notifications
- [ ] Brief viewer UI for students
- [ ] Performance optimization

---

**Phase 2 Status:** ✅ **COMPLETE**
**Ready for:** Phase 3 Feature Development
**Deployment:** `npm run web` to test full stack integration
**Backend:** Must be running on `localhost:8000`

---

*All Phase 2 deliverables from PRD Section 14 are implemented and functional. The frontend is a thin UI layer that consumes the Phase 1 backend APIs. Students can now interact with ClarityAI via voice or text, with cognitive signal collection and crisis detection working end-to-end.*
