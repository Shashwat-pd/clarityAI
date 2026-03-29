# ClarityAI Frontend Implementation Roadmap

## Current State Assessment

**What exists today:** A bare-bones Expo 51 / React Native app with functional (but completely unstyled) components — `ChatScreen`, `VoiceRecorder`, `Transcript`, `CrisisBanner`, `TextInputWithTracking`, `AudioPlayer`. No design system applied. Generic blue/gray color scheme. No Lumi mascot. No animations. No navigation. Layout is a flat chat-style column with no mascot zone.

**Backend:** Fully built — REST endpoints for sessions, chat, voice turns, briefs + WebSocket for real-time voice streaming. All clarity mode/score/crisis data flows from the API already.

**Assets available:** Three Lumi mascot PNGs (processing, guidance, grounding states) in `resources/__pycache__/`. Missing: idle, listening, speaking, crisis state images.

**Team:** Experienced React/JS/TS developers, new to React Native and mobile development.

---

## Architecture Decision: Web-First with React Native (Expo)

We will use **Expo with React Native Web** as the foundation. This means:

- Single codebase for web and mobile
- Web UI ships first (via `expo start --web`)
- Mobile follows using the same components
- Use `react-native-reanimated` for animations (works on both web and native)
- Use `expo-router` for file-based routing (replaces current single-screen setup)

### Technology Stack

| Layer | Library | Why |
|-------|---------|-----|
| Framework | Expo SDK 51 + React Native Web | Already set up, web-first works |
| Routing | `expo-router` v3 | File-based routing, works on web + native |
| Animations | `react-native-reanimated` v3 | Performant, shared API for web/native, needed for Lumi |
| Styling | StyleSheet + design tokens | RN-native, no extra deps. Tokens file centralizes the brand system |
| State | React Context + `useReducer` | Simple enough for this app. No Redux needed |
| Fonts | `expo-font` + Google Fonts | Load Nunito, Plus Jakarta Sans, JetBrains Mono |
| Icons | SVG via `react-native-svg` | Custom Lumi-derived icons, mic icon, etc. |
| Audio | `expo-av` (already installed) | Recording + playback |
| Real-time | Native WebSocket API | For streaming voice turns |
| Dark mode | `useColorScheme` + theme context | System-aware with manual override |
| Accessibility | Built-in RN a11y props | `accessibilityRole`, `accessibilityLabel`, etc. |

---

## Phase 0: Project Scaffolding & Design Tokens

**Goal:** Set up the project structure, install dependencies, configure routing, and create the design token system that every subsequent phase depends on.

### 0.1 — Migrate to Expo Router

- Install `expo-router` and restructure to file-based routing
- Create `app/` directory with layout files:
  ```
  app/
    _layout.tsx          — Root layout (font loading, theme provider, splash)
    (tabs)/
      _layout.tsx        — Tab navigator layout
      index.tsx          — Main voice screen (home)
      history.tsx        — Session history
      settings.tsx       — Settings screen
    session/
      [id].tsx           — Active session screen
    onboarding/
      index.tsx          — First-run onboarding flow
  ```
- Remove old `App.tsx` entry point (Expo Router replaces it)

### 0.2 — Install Core Dependencies

```
npx expo install expo-router react-native-reanimated react-native-svg
npx expo install react-native-gesture-handler react-native-safe-area-context
npx expo install expo-font expo-splash-screen expo-linear-gradient
npx expo install @expo-google-fonts/nunito @expo-google-fonts/plus-jakarta-sans
npx expo install @expo-google-fonts/jetbrains-mono
```

### 0.3 — Design Token System

Create `src/theme/` directory:

- **`src/theme/tokens.ts`** — All color, spacing, radius, shadow, motion, and typography tokens from the brand system. Single source of truth. Every hex value, duration, and easing curve lives here.
- **`src/theme/ThemeContext.tsx`** — React Context providing light/dark theme + current clarity mode. Exposes `useTheme()` hook. Merges base tokens with dark mode overrides when `colorScheme === 'dark'`.
- **`src/theme/typography.ts`** — Font family mappings, type scale definitions (display, title, subtitle, body, caption, label, transcript) with size, weight, lineHeight.
- **`src/theme/shadows.ts`** — Platform-aware shadow definitions (iOS shadow props, Android elevation, web boxShadow).
- **`src/theme/index.ts`** — Barrel export.

### 0.4 — Font Loading

- Load all three font families in root `_layout.tsx` using `expo-font`
- Show splash screen until fonts are ready
- Define fallback behavior if fonts fail to load

### 0.5 — Asset Pipeline

- Move Lumi PNGs from `resources/__pycache__/` to `assets/lumi/`
- Create an `assets/lumi/` manifest:
  - `lumi-idle.png` (need to create or source — use guidance as base for now)
  - `lumi-listening.png` (need to create or source)
  - `lumi-processing.png` (exists)
  - `lumi-speaking.png` (need to create or source — use guidance as base for now)
  - `lumi-guidance.png` (exists)
  - `lumi-grounding.png` (exists)
  - `lumi-crisis.png` (need to create or source)
- Create `src/components/lumi/LumiAssets.ts` — image require map

### 0.6 — Fog Background Asset

- Generate or create the teal-sage fog background illustration (see brand system prompt 1)
- Two versions: `fog-light.png` (light mode), `fog-dark.png` (dark mode)
- These live behind Lumi in the mascot zone

---

## Phase 1: The Mascot Zone — Lumi as Primary UI

**Goal:** Build the beating heart of the app. Lumi is not decoration — Lumi IS the interface. This phase creates the animated mascot component that drives the entire feel of the product.

### 1.1 — `<Lumi />` Core Component

File: `src/components/lumi/Lumi.tsx`

- Accepts `state` prop: `'idle' | 'listening' | 'processing' | 'speaking' | 'grounding' | 'crisis'`
- Accepts `clarityMode` prop: `'grounding' | 'structuring' | 'guidance'`
- Accepts `audioAmplitude` prop: `number` (0–1, for listening ring animation)
- Renders the correct Lumi image based on state
- Wraps image in `Animated.View` for all animation states
- Size: 140–160px on mobile, scales up to 200px on web
- Centered in its container, no UI chrome overlapping

### 1.2 — Idle Breathing Animation

Using `react-native-reanimated`:
- Scale: `1.0 → 1.05 → 1.0` over 3000ms, `Easing.inOut(Easing.ease)`, infinite loop
- TranslateY: `0 → -3px → 0` same cycle (gentle float)
- Glow ring overlay: opacity `0.35 → 0.6 → 0.35` same cycle
- Glow ring implemented as an absolutely-positioned `View` with borderRadius, border color `#A8DDD0`, and animated opacity + scale

### 1.3 — Listening State Animation

- Lock scale at 1.0 (no breathing while listening)
- 3 concentric ring elements (absolutely positioned around Lumi)
  - Ring 1: radius +4px, opacity 0.7, scale reacts to `audioAmplitude * 0.4`
  - Ring 2: radius +6px, opacity 0.4, `audioAmplitude * 0.6`, 200ms delay
  - Ring 3: radius +8px, opacity 0.2, `audioAmplitude * 0.8`, 400ms delay
- Rings pulse inward/outward based on audio metering from `expo-av`
- Switch to listening Lumi image (eyes wider)

### 1.4 — Processing State Animation

- Body image: processing Lumi (half-closed eyes, neutral mouth)
- Body opacity: 0.55 (dimmed)
- Replace glow ring with a dashed orbit circle:
  - Use `react-native-svg` `<Circle>` with `strokeDasharray="6 4"`
  - Rotate 360deg over 1400ms, linear, infinite loop
- Amber dot orbiting on that circle:
  - Color `#D4956A`, 5px diameter
  - Position calculated from rotation angle + translateX(28px)
  - Fading trail behind it (0.3 → 0 opacity)

### 1.5 — Speaking State Animation

- Scale: locked at 1.03 (slightly larger — projecting)
- Glow ring at full intensity, breathing at 600ms loop
- Swap to speaking Lumi image (mouth animating — if using sprite approach, alternate between open/closed frames at 500ms)
- Background: brief +5% lightness on the fog

### 1.6 — Grounding Mode Visual Shift

- Size: 85% of normal
- Position: shift down 10% from center
- Glow ring: dim, close to body
- Breathing: 4000ms loop (slower)
- Body image: grounding Lumi
- Background crossfade to `#E8F5F2` over 600ms

### 1.7 — Crisis State

- ALL animation: pause immediately
- Body opacity: 0.3 → 0.4 (3000ms barely-breathing loop)
- Glow ring: off
- Red dashed ring: `#E57373`, 2px dashed around orb
- No interactivity — mascot enters dormant state

### 1.8 — `<MascotZone />` Container

File: `src/components/lumi/MascotZone.tsx`

- Occupies top 40% of the primary screen (on mobile) / 45vh (on web)
- Contains: fog background image, Lumi component, clarity score badge (top-right), session timer (top-left)
- No other UI chrome enters this zone — enforced by layout
- Background crossfades based on `clarity_mode` with 600ms transition
- Respects `prefers-reduced-motion`: disables all animation, uses instant opacity changes

### 1.9 — `prefers-reduced-motion` Support

- Detect with `useReducedMotion()` from reanimated or `AccessibilityInfo`
- When active: all animation durations → 0, opacity transitions only
- No breathing, no orbit, no ring pulses

---

## Phase 2: Core Screen Layout & Navigation

**Goal:** Build the primary voice screen layout according to the brand system's screen architecture, plus tab navigation.

### 2.1 — Bottom Tab Navigator

File: `app/(tabs)/_layout.tsx`

- 3 tabs: Sessions (home), History, Settings
- Tab bar styling: brand colors, 48px height, no labels on mobile (icon only), labels on web
- Icons: custom SVG icons in teal (`#6BBFAA` active, `#8BA49F` inactive)
- Tab bar background: `#F7FAF9` light / `#1D3830` dark
- Border top: `1px solid #B8CECC` light / `rgba(107,191,170,0.2)` dark
- Active indicator: subtle pill behind active icon with `#D6EFEA` background

### 2.2 — Primary Voice Screen (Home)

File: `app/(tabs)/index.tsx`

Layout (top to bottom):
1. **Mascot Zone (top 40%):** `<MascotZone />` — Lumi + fog + badges
2. **Mic Button Area (middle ~10%):** `<MicButton />` centered, "Tap to speak" label below (fades after first use)
3. **Transcript Area (bottom 50%):** `<TranscriptList />` — scrollable, newest at bottom
4. Footer is the tab bar (handled by navigator)

- No header/top bar on this screen — the mascot zone IS the top
- Web: max-width 680px centered, content area max-width 560px
- Mobile: 20px horizontal margins minimum

### 2.3 — `<MicButton />` Component

File: `src/components/MicButton.tsx`

- Size: 72x72px mobile, 80x80px web
- Idle: `bg #6BBFAA`, glow shadow, white mic SVG icon
- Recording: `bg #D6EFEA`, 2.5px border `#6BBFAA`, stronger glow, green mic icon, 3 expanding ring animations
- Press animation: `scale(0.93)` with spring easing, 120ms
- Disabled state: reduced opacity, no glow
- Haptic feedback on press (native only, via `expo-haptics`)
- Replaces the current text-based `VoiceRecorder` button entirely

### 2.4 — `<TranscriptList />` Component Redesign

File: `src/components/TranscriptList.tsx`

Replaces current `Transcript.tsx` with brand-compliant transcript cards:

**Student Card (spoken text):**
- Background: `#F7FAF9`
- Border: `1px solid #D6EFEA`
- Font: monospace (JetBrains Mono), 14sp
- Text color: `#2A5C52`
- Label: `"STUDENT · 2:34 PM"` — uppercase caption style (11sp, weight 500, tracking 0.08em)
- Text wrapped in quotation marks: `"Like this."`

**AI Card (Lumi response):**
- Background: `#D6EFEA`
- Border: `1px solid #A8DDD0`
- Font: body (Plus Jakarta Sans), 14sp
- Text color: `#1A3C35`
- Label: `"LUMI · 2:34 PM"` — same caption style

**Both cards:**
- Border radius: 14px (`--radius-md`)
- Padding: 14px
- Entrance animation: fade + translateY(8px → 0), 300ms ease-out
- No chat-bubble alignment (left/right) — both cards are full-width, stacked
- Auto-scroll to newest message

### 2.5 — `<ClarityScoreBadge />` Component

File: `src/components/ClarityScoreBadge.tsx`

- Position: top-right of mascot zone, 12px from edges
- Displays: `"GROUNDING · 0.28"` (mode name + score, uppercase)
- Font: label style (11sp, weight 500, tracking 0.08em)
- Background/border colors determined by clarity mode (grounding/structuring/guidance)
- Text color: always `#1A3C35`
- Border radius: full (999px) — pill shape
- Crossfade transition on mode change: 600ms

### 2.6 — `<SessionTimer />` Component

File: `src/components/SessionTimer.tsx`

- Position: top-left of mascot zone
- Caption style, color `#8BA49F`
- Shows elapsed session time: `"12:34"`
- Starts when session is created

### 2.7 — Empty State / First-Run

When no session is active:
- Lumi in idle state, breathing gently
- Text below mic: "Tap to begin a conversation" (body font, secondary color)
- On first tap, auto-create session via API
- Smooth transition from empty → active session

---

## Phase 3: State Management & API Integration Overhaul

**Goal:** Wire up the redesigned UI to the backend with proper state management for clarity mode, crisis flags, and session data.

### 3.1 — Session Context

File: `src/context/SessionContext.tsx`

```
State shape:
{
  session: Session | null
  clarityMode: 'grounding' | 'structuring' | 'guidance'
  clarityScore: number
  crisisFlag: boolean
  lumiState: 'idle' | 'listening' | 'processing' | 'speaking' | 'crisis'
  messages: Message[]
  isRecording: boolean
  audioAmplitude: number
  sessionElapsedMs: number
}
```

Actions:
- `START_SESSION` — create session via API
- `SET_LUMI_STATE` — drive Lumi animation
- `UPDATE_CLARITY` — update mode + score (from API response)
- `ADD_MESSAGE` — append to transcript
- `SET_CRISIS` — trigger crisis state
- `SET_AUDIO_AMPLITUDE` — real-time mic level
- `CLEAR_SESSION` — reset everything

### 3.2 — API Service Overhaul

File: `src/services/api.ts`

- Keep existing endpoints, add proper TypeScript typing for all responses
- Add: `clarity_mode` and `clarity_score` tracking from every API response
- Add: WebSocket connection manager for real-time voice streaming
- Add: retry logic with exponential backoff
- Add: session persistence (save session_id to AsyncStorage, resume on app reopen)

### 3.3 — Voice Pipeline Integration

- Connect `expo-av` recording to `MicButton` state
- Extract audio metering (dB levels) during recording → normalize to 0–1 → feed to Lumi's `audioAmplitude`
- On recording stop: set Lumi to `processing`, send audio to `/voice/turn`
- On response: set Lumi to `speaking`, play TTS audio, update clarity mode/score
- On audio playback complete: return Lumi to `idle`
- Full state machine: `idle → listening → processing → speaking → idle`

### 3.4 — Crisis Flag Handling

- When `crisis_flag: true` in any API response:
  - Set Lumi to `crisis` state
  - Show `<CrisisBanner />` (slides in from top, 400ms ease-out)
  - Disable mic button
  - Disable text input
  - Banner is NOT dismissable
  - Recovery: only when `crisis_flag` returns `false` for 3+ consecutive turns

### 3.5 — Clarity Mode Background Transitions

- `clarityMode` changes drive:
  - MascotZone background color crossfade (600ms)
  - ClarityScoreBadge color/label transition
  - Lumi animation parameter changes (e.g., grounding = slower breathing)
  - Body text font-weight adjustment (grounding = 300, others = 400)
- Use `interpolateColor` from reanimated for smooth crossfades

---

## Phase 4: The Fog — Background & Visual Polish

**Goal:** Apply the atmospheric visual layer that makes ClarityAI feel like a calm, fog-clearing experience rather than a generic app.

### 4.1 — Fog Background System

File: `src/components/FogBackground.tsx`

- Full-screen background behind all content
- Light mode: gradient from `#E8F5F2` (top) → `#D6EFEA` (bottom) with subtle fog illustration overlay
- Dark mode: `#162D28` → `#1D3830` with `#6BBFAA` at 30% opacity fog wisps
- Fog shifts subtly based on clarity mode:
  - Grounding: fog is thicker, lower
  - Structuring: fog begins to lift
  - Guidance: fog is thin, higher, more light breaks through
- Implementation: layered linear gradients + semi-transparent fog image
- All transitions: 600ms crossfade

### 4.2 — Dark Mode

- System-aware via `useColorScheme()`
- Manual override toggle in settings
- Token overrides from brand system section 2.6
- All components read from ThemeContext, never hardcode colors
- Fog background has dark variant
- Lumi images work on both backgrounds (transparent PNGs)

### 4.3 — Micro-Interactions & Feedback

- Button press: `scale(0.97)`, 80ms, spring easing — on all tappable elements
- Input focus: glow shadow `--shadow-glow-sm` transition, border color change to `#6BBFAA`
- Transcript card entrance: fade + slide-up, staggered if multiple cards appear at once
- Tab switch: crossfade content, 250ms
- Badge transitions: background color crossfade on clarity mode change

### 4.4 — Typography Application

Apply across all components:
- Headings: Nunito Bold/SemiBold
- Body text: Plus Jakarta Sans Regular
- Captions/labels: Plus Jakarta Sans Medium, 11sp, uppercase, tracking 0.08em
- Transcript student text: JetBrains Mono Regular, 14sp, always in quotes
- Line height: NEVER below 1.65 for body text
- Heading color: `#1A3C35` light / `#D6EFEA` dark

### 4.5 — Shadow System

Apply brand-tinted shadows everywhere:
- Cards: `--shadow-md` (teal-tinted, not pure black)
- Inputs: `--shadow-sm`
- Modals/sheets: `--shadow-lg`
- Mascot halo: `--shadow-glow`
- Active buttons: `--shadow-glow-sm`
- Platform-aware: `elevation` on Android, `shadow*` on iOS, `boxShadow` on web

---

## Phase 5: Text Input & Secondary Interaction Mode

**Goal:** Build the text fallback input mode — secondary to voice but still beautifully crafted.

### 5.1 — `<TextInput />` Redesign

File: `src/components/TextInputArea.tsx`

- Background: `#F7FAF9`
- Border: `1.5px solid #B8CECC` → focus: `1.5px solid #6BBFAA`
- Border radius: 14px
- Padding: 12px 16px
- Font: Plus Jakarta Sans, 16sp
- Focus glow: `--shadow-glow-sm`
- Placeholder: `#8BA49F`, text: "Type a message..."
- Caret color: `#6BBFAA`
- Send button: small teal circle with arrow icon, appears only when text is non-empty
- Position: bottom of screen, above tab bar
- Expands vertically for multiline (max 4 lines before scrolling)

### 5.2 — Keystroke Signal Collection

Preserve existing `useKeystrokeTracking` hook functionality:
- Backspace rate
- Typing rhythm standard deviation
- Pre-send pause
- Message abandoned count
- Pass these to API with each message

### 5.3 — Input Mode Toggle

- Default: voice (mic button prominent)
- Keyboard icon button near mic to switch to text mode
- When text mode active: mic button shrinks, text input appears
- When voice mode active: text input hidden, mic button is the star
- Smooth animated transition between modes

---

## Phase 6: Crisis Banner Redesign

**Goal:** Redesign the crisis banner to match the brand system exactly.

### 6.1 — `<CrisisBanner />` Overhaul

- Position: top of screen, z-index max, above ALL content
- Slides in from top with 400ms ease-out animation
- Background: `#F5D0D0`
- Border: `2px solid #E57373`
- Text color: `#5C1A1A`
- Heading: "You're not alone" in `#7D1F1F`, Nunito SemiBold
- Body: support message, Plus Jakarta Sans
- Link to crisis resources (findahelpline.com)
- NOT dismissable — no close button, no swipe to dismiss
- Mic button disabled when visible
- Text input disabled when visible

---

## Phase 7: Session History & Settings Screens

**Goal:** Build the secondary screens that complete the app experience.

### 7.1 — Session History Screen

File: `app/(tabs)/history.tsx`

- List of past sessions
- Each row shows: date, duration, clarity mode reached, message count
- Tapping opens a read-only transcript view
- Empty state: Lumi with encouraging message
- Pull-to-refresh
- Styling follows card patterns from brand system

### 7.2 — Settings Screen

File: `app/(tabs)/settings.tsx`

- Dark mode toggle (with system default option)
- Voice settings: playback speed (0.75x, 1x, 1.25x)
- Text size adjustment (accessibility)
- Notification preferences
- About / version info
- Crisis resources link
- Clean, generous spacing per brand system

### 7.3 — Session Detail Screen

File: `app/session/[id].tsx`

- Full transcript view of a past session
- Read-only — no mic, no input
- Clarity score timeline visualization (optional stretch)
- Share/export option

---

## Phase 8: Onboarding Flow

**Goal:** First-run experience that introduces Lumi and sets the emotional tone.

### 8.1 — Onboarding Screens

File: `app/onboarding/index.tsx`

3-4 screens with swipe navigation:

1. **Meet Lumi** — Lumi in idle state, breathing. "Hi, I'm Lumi. I'm here to help you find clarity." Fog background, generous whitespace.
2. **How it works** — Brief explanation: "Talk to me about anything. I'll listen and help you think through it." Show mic button preview.
3. **Your privacy** — Consent explanation. "Everything stays between us." Consent toggle.
4. **Ready** — "Tap to begin." Lumi transitions to guidance state with sparkles. CTA button navigates to home.

- Navigation: dots at bottom, swipe or tap to advance
- Skip option (small, top-right)
- On completion: save consent + first-run flag to AsyncStorage

---

## Phase 9: Web-Specific Optimizations

**Goal:** Make the web experience feel like a dedicated web app, not a mobile app stretched to a browser.

### 9.1 — Responsive Layout

- Max content width: 680px centered
- Hero/mascot zone: 45vh
- Side panels (if needed): max 280px
- Breakpoints:
  - Mobile: < 640px (full-width, mobile layout)
  - Tablet: 640–1024px (centered with breathing room)
  - Desktop: > 1024px (centered column, fog background extends full-width)

### 9.2 — Web Audio Handling

- Use `MediaRecorder` API directly for web (instead of expo-av recording on web which can be unreliable)
- Audio playback via HTML5 Audio element
- WebSocket connection for real-time streaming (already supported by backend)

### 9.3 — Keyboard Shortcuts (Web)

- `Space` to toggle recording (when text input not focused)
- `Escape` to cancel recording
- `Enter` to send text message (when text input focused)
- `Tab` to switch between voice/text mode

### 9.4 — PWA Support (Stretch)

- Add `manifest.json` for installability
- Service worker for offline support (cached assets, offline indicator)
- App icon using Lumi guidance state

---

## Phase 10: Accessibility & Polish

**Goal:** Ensure the app is usable by everyone and passes accessibility audits.

### 10.1 — Screen Reader Support

- All interactive elements have `accessibilityLabel` and `accessibilityRole`
- Lumi state changes announced: "Lumi is listening", "Lumi is thinking", "Lumi is speaking"
- Transcript messages announced on arrival
- Crisis banner immediately announced as alert

### 10.2 — Reduced Motion

- `prefers-reduced-motion` → disable all Lumi animations, breathing, orbits
- Fall back to static images with instant opacity transitions
- No continuous loops

### 10.3 — Dynamic Type / Text Scaling

- All text uses `sp`/`rem` units
- Test at 200% text scale
- Layouts adapt without breaking

### 10.4 — Color Contrast

- Verify all text/background combinations meet WCAG AA (4.5:1 for body, 3:1 for large text)
- Crisis banner: `#5C1A1A` on `#F5D0D0` = 8.2:1 ratio (passes AAA)
- Body text: `#2A5C52` on `#F7FAF9` — verify and adjust if needed

### 10.5 — Focus Management (Web)

- Visible focus rings on all interactive elements (using `--shadow-glow-sm` instead of default blue outline)
- Logical tab order
- Skip-to-content link
- Focus trapped in crisis banner when visible

---

## Phase 11: Performance & Production Readiness

### 11.1 — Animation Performance

- All Lumi animations on UI thread via reanimated worklets
- Use `useAnimatedStyle` (not `Animated.View` from core RN)
- Profile on low-end devices — target 60fps for all animations
- Reduce ring count on low-performance devices

### 11.2 — Image Optimization

- Lumi PNGs: provide @1x, @2x, @3x variants
- Fog backgrounds: compress to WebP where supported
- Lazy load non-critical images

### 11.3 — Bundle Size

- Tree-shake unused imports
- Analyze bundle with `npx expo export --dump-sourcemap`
- Target: < 2MB initial JS bundle (web)

### 11.4 — Error Boundaries

- Wrap major sections in error boundaries
- Fallback UI: Lumi in neutral state with "Something went wrong" message
- Never show raw error text to users

---

## Missing Assets Checklist

Before implementation can begin fully, we need these assets:

| Asset | Status | Notes |
|-------|--------|-------|
| Lumi — Idle/Ready | **MISSING** | Use guidance image as placeholder initially |
| Lumi — Listening | **MISSING** | Eyes wider, open-O mouth |
| Lumi — Processing | Available | `Lumi-processingState.png` |
| Lumi — Speaking | **MISSING** | Mouth open, full glow |
| Lumi — Guidance | Available | `Lumi-guidance_state.png` |
| Lumi — Grounding | Available | `Lumi-grounding_state.png` |
| Lumi — Crisis | **MISSING** | Dim, dormant, red dashed ring (can overlay programmatically) |
| Fog background — Light | **MISSING** | Teal-sage mist illustration |
| Fog background — Dark | **MISSING** | Deep teal fog |
| Mic icon SVG | **MISSING** | Simple microphone, white fill |
| Tab bar icons | **MISSING** | Sessions, History, Settings (3 icons) |
| App icon | **MISSING** | Lumi guidance state on fog |

**Note:** Missing Lumi states can be approximated by using existing PNGs + programmatic overlays (glow rings, opacity changes, red dashed circles for crisis). We don't need to block on all assets — we can use the 3 existing images and add the others incrementally.

---

## Implementation Order & Dependencies

```
Phase 0 (Scaffolding)           ← START HERE, everything depends on this
  ↓
Phase 1 (Lumi Mascot)           ← The soul of the app
  ↓
Phase 2 (Screen Layout)         ← Depends on Lumi + tokens
  ↓
Phase 3 (State + API)           ← Wires Lumi states to real data
  ↓
Phase 4 (Fog + Polish)          ← Visual refinement pass
  ↓
Phase 5 (Text Input)            ← Secondary input mode
  ↓
Phase 6 (Crisis Banner)         ← Safety-critical, do before launch
  ↓
Phase 7 (History + Settings)    ← Secondary screens
  ↓
Phase 8 (Onboarding)            ← First-run flow
  ↓
Phase 9 (Web Optimizations)     ← Web-specific polish
  ↓
Phase 10 (Accessibility)        ← Final accessibility audit
  ↓
Phase 11 (Production)           ← Performance + launch readiness
```

**Phases 0–6 = MVP.** Ship web after Phase 6.
**Phases 7–8 = Complete app.** Ship web v1.0.
**Phases 9–11 = Polish & production.** Ship mobile after Phase 11.

---

## Estimated File Structure (Post-Implementation)

```
frontend/
  app/
    _layout.tsx
    (tabs)/
      _layout.tsx
      index.tsx                  — Main voice screen
      history.tsx                — Session history
      settings.tsx               — Settings
    session/
      [id].tsx                   — Session detail
    onboarding/
      index.tsx                  — Onboarding flow
  assets/
    lumi/
      lumi-idle.png
      lumi-listening.png
      lumi-processing.png
      lumi-speaking.png
      lumi-guidance.png
      lumi-grounding.png
      lumi-crisis.png
    backgrounds/
      fog-light.png
      fog-dark.png
    icons/
      mic.svg
      sessions.svg
      history.svg
      settings.svg
  src/
    theme/
      tokens.ts                  — All design tokens
      ThemeContext.tsx            — Theme provider + hook
      typography.ts              — Font/type scale config
      shadows.ts                 — Platform-aware shadows
      index.ts
    components/
      lumi/
        Lumi.tsx                 — Core mascot component
        MascotZone.tsx           — Top 40% container
        LumiAssets.ts            — Image manifest
        animations/
          useBreathing.ts        — Idle breathing hook
          useListeningRings.ts   — Listening ring pulse hook
          useProcessingOrbit.ts  — Amber orbit hook
          useSpeakingGlow.ts     — Speaking state hook
      MicButton.tsx              — Primary voice button
      TranscriptList.tsx         — Redesigned transcript
      TranscriptCard.tsx         — Individual message card
      ClarityScoreBadge.tsx      — Mode + score pill
      SessionTimer.tsx           — Elapsed time display
      TextInputArea.tsx          — Text input with styling
      CrisisBanner.tsx           — Redesigned crisis banner
      FogBackground.tsx          — Atmospheric background
    context/
      SessionContext.tsx          — Session state management
    hooks/
      useSession.ts              — Session lifecycle
      useKeystrokeTracking.ts    — Keystroke signals
      useAudioAmplitude.ts       — Mic level monitoring
      useWebSocket.ts            — Real-time voice streaming
    services/
      api.ts                     — REST API client
      websocket.ts               — WebSocket manager
    types/
      index.ts                   — All TypeScript types
```

---

*This roadmap is the authoritative plan for the ClarityAI frontend rebuild. Every component, animation, and color decision traces back to the Brand System document. When in doubt, ask: "What would Lumi look like here?"*
