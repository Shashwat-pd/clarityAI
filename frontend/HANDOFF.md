# ClarityAI Frontend — Handoff Document

## What Was Completed (Phases 0–6, all code written)

### Phase 0: Scaffolding
- Migrated to `expo-router` (file-based routing in `app/` directory)
- Installed all deps: reanimated, svg, gesture-handler, fonts, linear-gradient, haptics, etc.
- Updated `package.json` main to `expo-router/entry`
- Created `babel.config.js` with reanimated plugin
- Updated `app.json` with scheme, plugins, brand colors
- Updated `tsconfig.json`

### Phase 0.3–0.4: Design Token System
- `src/theme/tokens.ts` — all colors, spacing, radius, duration, easing from brand system
- `src/theme/typography.ts` — font families (Nunito, Plus Jakarta Sans, JetBrains Mono) + type scale
- `src/theme/shadows.ts` — platform-aware shadows (iOS/Android/web)
- `src/theme/ThemeContext.tsx` — light/dark theme provider + `useTheme()` hook
- `src/theme/index.ts` — barrel export

### Phase 0.5: Assets
- Copied Lumi PNGs to `assets/lumi/` (processing, guidance, grounding exist; idle/speaking/listening use guidance as placeholder)
- Created `src/components/lumi/LumiAssets.ts` — image require map

### Phase 1: Lumi Mascot
- `src/components/lumi/Lumi.tsx` — core component with 6 states (idle, listening, processing, speaking, grounding, crisis)
- `src/components/lumi/MascotZone.tsx` — top 40% container with crossfading clarity mode backgrounds
- Animation hooks (all using react-native-reanimated):
  - `useBreathing.ts` — idle: scale 1→1.05, translateY float, glow pulse, 3000ms loop
  - `useListeningRings.ts` — 3 concentric rings reactive to audio amplitude
  - `useProcessingOrbit.ts` — dashed circle + amber dot, 1400ms rotation
  - `useSpeakingGlow.ts` — scale 1.03, fast 600ms glow pulse

### Phase 2: Screen Layout & Components
- `app/_layout.tsx` — root layout with font loading, ThemeProvider, SessionProvider
- `app/(tabs)/_layout.tsx` — bottom tab nav (Session, History, Settings) with SVG icons
- `app/(tabs)/index.tsx` — main voice screen: mascot zone (38%), mic area, transcript, text toggle
- `app/(tabs)/history.tsx` — placeholder session history
- `app/(tabs)/settings.tsx` — settings with theme/support/about rows
- `src/components/MicButton.tsx` — 72/80px button with recording rings, press spring, SVG mic icon
- `src/components/TranscriptCard.tsx` — student (mono, quoted) and AI (body font) cards with entrance animation
- `src/components/TranscriptList.tsx` — FlatList with auto-scroll, empty state
- `src/components/ClarityScoreBadge.tsx` — pill badge with mode color crossfade
- `src/components/SessionTimer.tsx` — MM:SS elapsed timer

### Phase 3: State Management & API
- `src/context/SessionContext.tsx` — full reducer with actions for session lifecycle, lumi state, clarity tracking, crisis handling (3-turn recovery), audio amplitude
- `src/types/index.ts` — updated with ClarityMode, LumiState types
- `src/services/api.ts` — unchanged (already functional)
- Voice pipeline wired in `app/(tabs)/index.tsx`: mic press → expo-av recording with metering → amplitude to Lumi → stop → API call → speaking state

### Phase 4–6: Visual Polish
- `src/components/FogBackground.tsx` — full-screen gradient with clarity mode crossfade, dark mode support
- `src/components/TextInputArea.tsx` — brand-styled input with focus glow, send button, keystroke tracking
- `src/components/CrisisBanner.tsx` — slide-in from top, not dismissable, brand crisis colors

## What Has NOT Been Done

1. **Build verification** — haven't run `expo start --web` to verify no compile errors. There will likely be minor import/type issues to fix.
2. **Old files cleanup** — `App.tsx`, `src/screens/ChatScreen.tsx`, `src/components/Transcript.tsx`, `src/components/VoiceRecorder.tsx`, `src/components/TextInputWithTracking.tsx`, `src/hooks/useSession.ts` are still present (old code). They should be deleted or ignored — the new `app/` routing structure supersedes them.
3. **Audio playback** — the `speaking` state transition and TTS audio playback after API response isn't wired to completion (the AudioPlayer component isn't integrated in the new screen).
4. **Phases 7–8** — Session detail screen (`app/session/[id].tsx`), onboarding flow (`app/onboarding/`)
5. **Phases 9–11** — Web optimizations, accessibility audit, performance profiling, PWA setup

## Estimated Remaining Effort

| Task | Estimated % of what was done |
|------|-----|
| Fix build errors + compile | ~10% |
| Wire audio playback + complete voice flow | ~5% |
| Delete old files | ~2% |
| Session history + detail screens | ~10% |
| Onboarding flow | ~8% |
| Web optimizations (responsive, keyboard shortcuts) | ~10% |
| Accessibility pass | ~10% |
| Production polish | ~5% |
| **Total remaining** | **~60%** of what was already done |

The core architecture + all major components are written. The remaining work is integration testing, fixing build errors, and building the secondary screens. The hardest parts (Lumi animation system, state management, design tokens, screen layout) are done.

## Key Files to Start With Next Session

1. Run `cd frontend && npx expo start --web` to see what errors come up
2. Fix any import/type issues
3. Delete old files: `App.tsx`, `src/screens/`, old components
4. Wire AudioPlayer into the main screen for TTS playback
5. Then move to Phase 7+ (history, onboarding)
