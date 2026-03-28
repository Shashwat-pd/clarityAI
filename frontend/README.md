# ClarityAI Frontend

React Native mobile/web UI for ClarityAI - Voice-first cognitive-adaptive career guidance platform.

## Features

- **Voice-first interaction** - Primary modality using expo-av for recording/playback
- **Text chat fallback** - With keystroke signal collection for cognitive analysis
- **Crisis detection** - Non-dismissable banner when AI detects distress
- **Session persistence** - Automatic session management with AsyncStorage
- **Real-time transcript** - Conversation history display
- **Cross-platform** - iOS, Android, and Web support via Expo

## Prerequisites

- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac only) or Android Studio (for mobile testing)
- ClarityAI backend running on `http://localhost:8000`

## Installation

```bash
cd frontend
npm install
```

## Running the App

### Web (easiest for testing)
```bash
npm run web
```

### iOS Simulator (Mac only)
```bash
npm run ios
```

### Android Emulator
```bash
npm run android
```

### Development Server
```bash
npm start
# Then press:
# - w for web
# - i for iOS simulator
# - a for Android emulator
```

## Configuration

API endpoint is configured in `app.json`:

```json
"extra": {
  "apiUrl": "http://localhost:8000/api/v1"
}
```

For production, update this to your deployed backend URL.

## Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── AudioPlayer.tsx
│   │   ├── CrisisBanner.tsx
│   │   ├── TextInputWithTracking.tsx
│   │   ├── Transcript.tsx
│   │   └── VoiceRecorder.tsx
│   ├── hooks/            # Custom React hooks
│   │   ├── useKeystrokeTracking.ts
│   │   └── useSession.ts
│   ├── screens/          # Screen components
│   │   └── ChatScreen.tsx
│   ├── services/         # API integration
│   │   └── api.ts
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   └── utils/            # Utility functions
├── App.tsx               # Entry point
├── app.json              # Expo configuration
├── package.json
└── tsconfig.json
```

## Key Components

### VoiceRecorder
Handles audio recording with expo-av. Outputs webm/opus format compatible with Deepgram STT.

### AudioPlayer
Plays AI voice responses from base64 or URL. Auto-plays and shows playback status.

### TextInputWithTracking
Text input with keystroke signal collection (backspace rate, typing rhythm, pauses).

### CrisisBanner
Non-dismissable banner that appears when `crisis_flag: true` in API response.

### useSession Hook
Manages session lifecycle with AsyncStorage persistence. Auto-creates/resumes sessions.

### useKeystrokeTracking Hook
Tracks typing patterns for cognitive clarity analysis.

## API Integration

The app integrates with ClarityAI Phase 1 backend:

- `POST /api/v1/sessions` - Create session
- `GET /api/v1/sessions/{id}` - Resume session
- `POST /api/v1/voice/turn` - Voice interaction (STT → LLM → TTS)
- `POST /api/v1/chat/message` - Text interaction with keystroke signals

## Testing

1. Start the backend: `cd .. && docker compose up`
2. Start the frontend: `npm run web`
3. Test voice recording by clicking "🎤 Speak"
4. Test text input with the message box at the bottom

## Platform-Specific Notes

### iOS
- Microphone permission required (configured in app.json)
- Audio format: .caf (converted to webm by backend)

### Android
- Microphone permission required
- Audio format: .webm with opus codec

### Web
- Microphone permission via browser
- Audio format: .webm
- Use Chrome/Edge for best compatibility

## Troubleshooting

**"Failed to initialize session"**
- Ensure backend is running on localhost:8000
- Check `docker compose ps` in the backend directory

**"Microphone permission denied"**
- Grant permission in device settings
- iOS: Settings → Privacy → Microphone → ClarityAI
- Android: Settings → Apps → ClarityAI → Permissions

**Audio not playing**
- Check browser console for errors
- Verify backend is returning audio in response

## Phase 2 Deliverables ✅

All Phase 2 requirements from PRD Section 14 are implemented:

- [x] React Native mobile/web UI
- [x] Voice recording component (expo-av)
- [x] Audio playback component
- [x] Transcript display
- [x] Session management UI
- [x] Keystroke signal collection
- [x] Crisis banner UI
- [x] Integration with Phase 1 APIs

## Next Steps (Phase 3)

- WebSocket support for real-time streaming
- Push notifications
- Multi-session history view
- Counsellor brief access
- Performance optimizations
