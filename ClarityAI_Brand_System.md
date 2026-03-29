# ClarityAI — Complete Design System Reference
## AI Agent Build Reference v1.0 — March 2026
> **Derived from the Lumi mascot image.** Every color, spacing, animation, and component decision traces back to the mascot illustration. If it's not in this document, it's not in the product.

---

## 1. MASCOT — Lumi

Lumi is a round, softly glowing teal orb with a calm face. It floats above mist. It IS the product's primary UI element — not decoration. The mascot is the loading indicator, the emotional state display, and the voice interface anchor.

**Character traits:** Calm, steady, non-judgmental, warm, present. Never excited. Never urgent.

**Design rule:** The mascot zone occupies the top 40% of every primary screen. No UI chrome enters this zone.

---

## 2. COLOR SYSTEM

All colors extracted directly from the mascot image. Nothing invented.

### 2.1 Primary Brand Palette

| Token | Hex | Name | Usage |
|-------|-----|------|-------|
| `--color-brand-primary` | `#6BBFAA` | Lumi Teal | Primary brand, buttons, active states |
| `--color-brand-deep` | `#3A7D6E` | Deep Sage | Body shadows, secondary icons |
| `--color-brand-glow` | `#A8DDD0` | Glow Ring | Halo effect, idle state ring |
| `--color-brand-mist` | `#D6EFEA` | Teal Mist | Card backgrounds, AI response bg |
| `--color-brand-fog` | `#E8F5F2` | Fog Light | Page background (light mode) |
| `--color-brand-dark` | `#2A5C52` | Forest Ink | Dark text, active icon color |
| `--color-brand-ink` | `#1A3C35` | Deep Ink | Heading text (light mode) |

### 2.2 Atmosphere & Neutral Palette

| Token | Hex | Name | Usage |
|-------|-----|------|-------|
| `--color-surface-primary` | `#F7FAF9` | Lumi White | Surface white, modal bg |
| `--color-surface-dark` | `#162D28` | Dark Canvas | Dark mode page background |
| `--color-sky` | `#C5DDD8` | Sky Teal | Midground fog elements |
| `--color-border-default` | `#B8CECC` | Muted Sage | Borders, dividers, disabled |
| `--color-text-secondary` | `#8BA49F` | Warm Gray | Secondary text, captions |

### 2.3 Accent Color (One Per Screen Maximum)

| Token | Hex | Name | Usage |
|-------|-----|------|-------|
| `--color-accent-amber` | `#D4956A` | Warm Amber | Processing state, primary CTA glow, one highlight per screen ONLY |
| `--color-accent-amber-soft` | `#F2D9C8` | Amber Mist | Amber badge backgrounds |

### 2.4 Clarity Mode State Colors (map to `clarity_mode` API field)

| Mode | Background | Border | Usage |
|------|-----------|--------|-------|
| `grounding` | `#E8F5F2` | `#A8DDD0` | `clarity_score < 0.35` |
| `structuring` | `#D6EFEA` | `#6BBFAA` | `clarity_score 0.35–0.65` |
| `guidance` | `#C0E8DC` | `#3A7D6E` | `clarity_score > 0.65` |

**Transition:** Always crossfade 600ms (`--duration-mode-shift`). Never snap.

### 2.5 Crisis State

| Element | Value |
|---------|-------|
| Banner background | `#F5D0D0` |
| Banner border | `2px solid #E57373` |
| Banner text | `#5C1A1A` |
| Heading text | `#7D1F1F` |

### 2.6 Dark Mode Overrides

| Element | Dark Mode Value |
|---------|----------------|
| Page background | `#162D28` |
| Surface | `#1D3830` |
| Card background | `#1F3A32` |
| Body text | `#D6EFEA` |
| Secondary text | `#8BA49F` |
| Border | `rgba(107,191,170,0.2)` |
| Brand primary | unchanged `#6BBFAA` |

### 2.7 Undertone Analysis

The palette sits at approximately **165° hue** (teal), saturation ~35% — dusty, sage-like, not cyan, not green. The glow ring is near-white teal creating luminosity contrast without pure white. The amber accent (`#D4956A`) is the natural complement, appearing in the fog's warmer lower tones.

**Rule:** If a color doesn't exist in the fog, the orb, or the glow ring of the original mascot image, it does not exist in this product.

---

## 3. TYPOGRAPHY

### 3.1 Font Stack

**Display / Headings:** Nunito (Google Fonts, free) — rounded terminals mirror Lumi's circular form. Warm, approachable. Fallback: `"DM Sans", system-ui`

**Body / UI:** Plus Jakarta Sans (Google Fonts, free) — excellent small-size legibility, slightly warm weight distribution. Fallback: `"Geist", "Inter", system-ui`

**Transcript (voice output only):** JetBrains Mono or Geist Mono — signals "this was spoken aloud." Always wrapped in quotation marks. Never used for AI responses (only student speech playback).

### 3.2 Type Scale

| Role | Size (sp/rem) | Weight | Line Height | Usage |
|------|--------------|--------|-------------|-------|
| Display H1 | 32sp / 2rem | 700 | 1.15 | Screen headings only |
| Title H2 | 24sp / 1.5rem | 600 | 1.2 | Section titles |
| Subtitle H3 | 18sp / 1.125rem | 500 | 1.3 | Card titles |
| Body | 16sp / 1rem | 400 | 1.65 | All AI responses and paragraph text |
| Caption | 13sp / 0.8125rem | 400 | 1.4 | Timestamps, score labels |
| Label | 11sp / 0.6875rem | 500 | — | UPPERCASE, tracking 0.08em. Badges, section markers |
| Transcript | 14sp / 0.875rem | 400 | 1.65 | Mono font. Student speech only. |

### 3.3 Typography Rules

- Body text line height **never below 1.65** — anxious readers need generous leading
- Heading color: `--color-brand-ink` (#1A3C35) on light, `--color-brand-mist` (#D6EFEA) on dark
- Never use font weights 300 (except Grounding mode body text) or 800+
- Transcript text always quoted: `"Like this."`

---

## 4. SPACING & LAYOUT

### 4.1 Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Micro gaps, icon padding |
| `--space-2` | 8px | Compact internal padding |
| `--space-3` | 12px | Tight component spacing |
| `--space-4` | 16px | Base unit |
| `--space-5` | 24px | Card padding, section gap |
| `--space-6` | 32px | Major section gaps |
| `--space-7` | 48px | Screen margins, top-level |

### 4.2 Border Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 8px | Badges, small pills |
| `--radius-md` | 14px | Cards, inputs, panels |
| `--radius-lg` | 22px | Modals, bottom sheets |
| `--radius-full` | 999px | Buttons, avatars, mic button |

### 4.3 Screen Layout Rules

- Mobile screen margins: 20px horizontal minimum
- Web max content width: 680px centered
- Mascot zone: top 40% of primary screens — NO UI chrome enters this zone
- The mascot orb size on primary screen: 140–160px diameter on mobile
- Transcript area: bottom 50% of screen, scrollable
- Navigation: always bottom tab bar on mobile (never top nav on primary screen)

---

## 5. ELEVATION & SHADOWS

All shadow values use brand-tinted shadow, not pure black. This maintains the color world.

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 4px rgba(42,92,82,.08)` | Inputs, small badges |
| `--shadow-md` | `0 4px 16px rgba(42,92,82,.12)` | Cards |
| `--shadow-lg` | `0 8px 32px rgba(42,92,82,.16)` | Modals, bottom sheets |
| `--shadow-glow` | `0 0 24px rgba(107,191,170,.35)` | Mascot halo, mic button |
| `--shadow-glow-sm` | `0 0 12px rgba(107,191,170,.25)` | Focused inputs, active buttons |

---

## 6. MOTION TOKENS

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-fast` | 150ms | Micro interactions (press, focus) |
| `--duration-base` | 250ms | Button state changes |
| `--duration-slow` | 500ms | Panel/screen transitions |
| `--duration-breathe` | 3000ms | Idle mascot breathing cycle |
| `--duration-mode-shift` | 600ms | Clarity mode background crossfade |
| `--ease-out` | `cubic-bezier(0,.55,.45,1)` | Entrances |
| `--ease-spring` | `cubic-bezier(.34,1.56,.64,1)` | Playful bounce (mic button press) |
| `--ease-breathe` | `ease-in-out` | All organic/biological loops |

**Motion rules:**
- Minimum loop duration: 2500ms for anything that plays continuously
- No rapid flickers or strobing
- All mode transitions: 600ms crossfade minimum
- `prefers-reduced-motion`: respect it. Fall back to instant opacity change only.

---

## 7. MASCOT ANIMATION STATES

The mascot is the primary status indicator. No spinners. No loading bars. Lumi communicates all states.

### 7.1 IDLE / READY
**Trigger:** Session loaded, awaiting input
```
scale: 1.0 → 1.05 → 1.0 — 3000ms ease-in-out loop
translateY: 0 → -3px → 0 — same 3000ms cycle (float)
glow ring opacity: 0.35 → 0.6 → 0.35 — same cycle
glow ring radius: natural → +4px → natural
color: #6BBFAA (full saturation)
```

### 7.2 LISTENING
**Trigger:** `expo-av` recording begins; mic active
```
scale: locked 1.0 (no breathe while listening)
3 concentric expanding rings:
  ring1: radius +4px, opacity 0.7, amplitude × 0.4
  ring2: radius +6px, opacity 0.4, amplitude × 0.6, delay 200ms
  ring3: radius +8px, opacity 0.2, amplitude × 0.8, delay 400ms
Eyes: slightly wider (ry × 1.1)
Amplitude source: expo-av getMeteringEnabled dB, normalize to 0–1
```

### 7.3 PROCESSING
**Trigger:** Audio POST sent, awaiting API response
```
body opacity: 0.55 (dimmed, focused inward)
glow ring: replaced with dashed orbit circle (stroke-dasharray: 6 4)
orbit rotation: 360° / 1400ms, linear, infinite
amber dot: position = rotate(Xdeg) translateX(28px) from center
  color: #D4956A (ONLY amber element on screen during this state)
  size: 5px diameter
motion trail: amber fading 0.3 → 0 behind dot
mouth: neutral closed line
```

### 7.4 SPEAKING
**Trigger:** TTS audio playback begins
```
scale: 1.03 (slightly larger — projecting outward)
glow ring: full intensity, 600ms breathe loop
mouth animation: open-close, sync to speech amplitude if available
  fallback: 500ms ease-in-out open/close loop
eyes: fully open
background: +5% lightness briefly during speech
```

### 7.5 GROUNDING MODE
**Trigger:** `clarity_mode === "grounding"` from API
```
size: 85% of normal (settled, not diminished)
position: +10% lower from center
glow ring: dim, radius +4px only (close to body)
breathing: 4000ms loop (slower, more deliberate)
body color: #89C4B5 (slightly desaturated vs #6BBFAA)
background crossfade: → #E8F5F2 over 600ms
font-weight: 300 for body text (lighter, softer)
```

### 7.6 CRISIS FLAG
**Trigger:** `crisis_flag === true` in API response
```
ALL mascot animation: PAUSE immediately
body opacity: 0.3 → 0.4 (3000ms barely-breathing — alive but quiet)
glow ring: OFF
dashed red ring: visible around orb (#E57373, 2px dashed)
crisis banner: slides in from top, 400ms ease-out

BANNER SPEC:
  position: top of screen, z-index max, above ALL content
  background: #F5D0D0
  border: 2px solid #E57373
  NOT dismissable — no close button
  contains: support message + link to regional crisis resources

Mic button: DISABLED
User input: DISABLED
Recovery: crisis_flag must return false for 3+ consecutive turns before mascot re-animates
```

---

## 8. COMPONENT SPECIFICATIONS

### 8.1 Primary CTA Button
```
bg: #6BBFAA → hover: #5DAFA0
color: #FFFFFF
border-radius: --radius-full (999px)
padding: 12px 28px
font: 15sp, weight 600
box-shadow: --shadow-glow-sm on hover
press: scale(0.97), 80ms ease-spring
min-width: 160px mobile, 180px web
```

### 8.2 Secondary Button
```
bg: transparent → hover: #D6EFEA
border: 1.5px solid #6BBFAA
color: #3A7D6E
border-radius: --radius-full
padding: 11px 28px
font: 15sp, weight 500
```

### 8.3 Mic / Voice Button (PRIMARY UI ELEMENT)
```
Size: 72×72px mobile, 80×80px web (never smaller)

Idle state:
  bg: #6BBFAA
  box-shadow: --shadow-glow (0 0 24px rgba(107,191,170,.35))
  icon: microphone SVG, white

Recording state:
  bg: #D6EFEA
  border: 2.5px solid #6BBFAA
  box-shadow: 0 0 32px rgba(107,191,170,.5)
  icon: microphone SVG, #3A7D6E
  + 3 ring animations at r=44,56,70, staggered 200ms

Press: scale(0.93) ease-spring 120ms
```

### 8.4 Clarity Score Badge
```
Position: top-right corner, 12px from edges
font: --label (11sp, uppercase, weight 500, tracking .08em)
border-radius: --radius-full

grounding: bg #E8F5F2, border #A8DDD0
structuring: bg #D6EFEA, border #6BBFAA
guidance: bg #C0E8DC, border #3A7D6E
text color: #1A3C35 always

Display: "GROUNDING · 0.28" (mode name + rounded score)
Transition: crossfade label + bg color 600ms
```

### 8.5 Transcript Cards
```
Student card (mono — spoken):
  bg: #F7FAF9
  border: 1px solid #D6EFEA
  text font: monospace, 14sp
  text color: #2A5C52
  label: "Student · [time]", uppercase caption

AI card (body font — replied):
  bg: #D6EFEA
  border: 1px solid #A8DDD0
  text font: body, 14sp
  text color: #1A3C35
  label: "Lumi · [time]", uppercase caption

Both:
  border-radius: --radius-md (14px)
  padding: 14px
  entrance: fade + translateY(8px)→0, 300ms ease-out
```

### 8.6 Input Field (Text Fallback Mode)
```
bg: #F7FAF9
border: 1.5px solid #B8CECC → focus: 1.5px solid #6BBFAA
border-radius: --radius-md (14px)
padding: 12px 16px
font: body 16sp
box-shadow on focus: --shadow-glow-sm
placeholder color: #8BA49F
caret color: #6BBFAA
```

---

## 9. SCREEN LAYOUT PATTERNS

### 9.1 Primary Voice Screen (Main Screen)
```
Top 40%: Mascot zone — CLEAR of all chrome
  - Lumi orb, centered horizontally, vertically centered in zone
  - Fog/mist background illustration behind orb
  - Clarity score badge: top-right
  - Session timer: top-left (caption, #8BA49F)

Middle 10%: Mic button area
  - Voice button centered
  - "Tap to speak" label below (caption, fades once used)

Bottom 50%: Transcript scroll area
  - Most recent exchange visible
  - Scrollable upward for history
  - Transcript cards stack newest-at-bottom

Footer: thin bottom tab bar (sessions, settings, profile)
```

### 9.2 Web App Layout
```
Max width: 680px, centered
Hero section: full-viewport fog background
Mascot zone: 45vh, centered
Content area: below fold, max-width 560px, centered
Side panels: max 280px (settings, history)
```

---

## 10. DESIGN PHILOSOPHY

### Principle 1: The Fog Principle
Clarity is the product, so the UI should feel like it's clearing. Background is always slightly misty. Information reveals progressively. Transitions are slow dissolutions, never snaps.

### Principle 2: Breath Over Speed
Animations breathe — they never rush. The student is already anxious; the UI must not add cognitive load. No rapid movements. All loops run at ≥2500ms. Only micro-interactions are fast (150ms).

### Principle 3: Voice is Architecture
The UI is built around the listening/speaking loop — not a chat interface with a mic added. Lumi IS the primary UI element. Text transcripts are secondary and always visually subordinate. Never design a "send" button flow as primary.

### Principle 4: One Palette, Full Depth
Every color on screen is a tint, shade, or variation of the teal-sage family. Only one amber accent per screen. One exception: crisis red. No blue, purple, or neutral gray ever enters the product.

### Principle 5: Generous Emptiness
32px margins on mobile minimum. 48px on web. The mascot zone is always clear. Line height 1.65. Dense UI signals stress; this product signals calm.

### Principle 6: Clarity Mode Drives Everything
`clarity_mode` from the API is the master design variable. It tints the background, controls the mascot animation, adjusts font weight, and changes animation pace. No hardcoded UI — always reactive.

### Anti-Patterns (Never Do These)
- ❌ No purple gradients or "AI tech bro" aesthetics
- ❌ No spinners — Lumi IS the loading indicator
- ❌ No dark backgrounds with neon accents
- ❌ No modal-heavy flows
- ❌ No color outside the token system
- ❌ No animation during crisis flag state
- ❌ No generic fonts (Inter, Roboto, SF Pro as primary)
- ❌ No chat-bubble UI for voice output — transcripts only

---

## 11. IMAGE GENERATION PROMPTS

### Prompt 1: Web Hero Background
> A soft atmospheric mist background illustration for a web application. Dreamlike teal-sage fog landscape. Foreground: soft mist wisps in pale teal (#D6EFEA) at bottom third, volumetric. Midground: deeper teal-gray (#C5DDD8). Sky: smooth gradient #D8EDEA → #EBF5F2 at top. No hard edges. No objects, no people. Center clear for mascot overlay. Style: digital illustration, soft painterly, ethereal. Palette ONLY: #EBF5F2, #D6EFEA, #C5DDD8, #A8DDD0, #8BA49F. 16:9 landscape.

### Prompt 2: Mobile Dark Mode Background
> Portrait 9:16 atmospheric fog background. Deep teal fog at bottom 40%, volumetric (#6BBFAA at 30% opacity over #162D28). Upper 60%: #162D28 → #1D3830, dark enough for white text. Fog/sky boundary: 200px feathered blend. No objects. Soft digital painterly, cinematic. Palette: #162D28, #1D3830, #6BBFAA (fog only), #A8DDD0 (wisps).

### Prompt 3: Lumi — Guidance Mode
> Lumi mascot orb in bright guidance state. Round orb, vivid #6BBFAA with slightly lighter center. Eyes fully open, wide. Gentle wide smile. Glow ring at full intensity, bright #A8DDD0, 8px wide. Two small leaf-fin shapes in #3A7D6E. Three sparkle stars above in #A8DDD0. Transparent background. Flat vector illustration, soft cel-shading, no hard outlines, slightly 3D rounded form. 1:1 square, centered. Mood: "I know exactly what we're doing next."

### Prompt 4: Lumi — Grounding Mode
> Lumi orb in gentle grounding state. Slightly smaller, settled lower in frame. Body color #89C4B5 (desaturated). Eyes half-closed, deeply present. Glow ring dim, close (#C8E8E2). Two arm-fins curved inward like an inward hug. Very pale teal mist (#E8F5F2) rising from bottom only. Transparent bg with mist hint at bottom. Style consistent with original. Mood: "I'm here. Take your time."

### Prompt 5: Lumi — Listening State
> Lumi orb in active listening state. Body #6BBFAA. Eyes open, wider than normal, attentive. Mouth: small open-O shape. Around orb: 3 concentric ring halos in (#A8DDD0, #C5DDD8, #D6EFEA), decreasing opacity outward, feeling INWARD (drawing sound in, not broadcasting). Transparent bg. 1:1 square. Mood: "I am fully listening to every word."

### Prompt 6: Lumi — Processing State
> Lumi orb in thinking state. Body #6BBFAA at 70% brightness. Eyes gently half-closed, concentrating. Mouth: simple closed neutral horizontal line. Glow ring replaced with single fine dashed orbit circle (#A8DDD0, 1px dashed). Single amber dot (#D4956A) mid-orbit, faint motion trail behind it fading to transparent. No sparkles. Very clean. Transparent bg. 1:1. Mood: "Give me a moment — I'm working on this."

### Prompt 7: PDF Counsellor Brief Header Banner
> Minimal horizontal banner 680×80px for printed PDF header. Left 15%: Lumi orb at 48px, idle state, gently glowing. Right 85%: very soft teal mist wisps (#D6EFEA, 15% opacity max) dissolving into pure white. Background: white. No text. Professional, not playful. Style: same soft illustration approach but toned down for print context.

---

## 12. REACT NATIVE IMPLEMENTATION NOTES

```javascript
// Theme constants (JavaScript tokens)
export const theme = {
  colors: {
    brandPrimary: '#6BBFAA',
    brandDeep: '#3A7D6E',
    brandGlow: '#A8DDD0',
    brandMist: '#D6EFEA',
    brandFog: '#E8F5F2',
    surfacePrimary: '#F7FAF9',
    surfaceDark: '#162D28',
    textInk: '#1A3C35',
    textBody: '#2A5C52',
    textSecondary: '#8BA49F',
    borderDefault: '#B8CECC',
    accentAmber: '#D4956A',
    accentAmberSoft: '#F2D9C8',
    crisisBg: '#F5D0D0',
    crisisBorder: '#E57373',
    clarityModes: {
      grounding: { bg: '#E8F5F2', border: '#A8DDD0' },
      structuring: { bg: '#D6EFEA', border: '#6BBFAA' },
      guidance: { bg: '#C0E8DC', border: '#3A7D6E' },
    }
  },
  spacing: { 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32, 7: 48 },
  radius: { sm: 8, md: 14, lg: 22, full: 999 },
  duration: { fast: 150, base: 250, slow: 500, breathe: 3000, modeShift: 600 },
  fonts: {
    display: 'Nunito-Bold',
    heading: 'Nunito-SemiBold',
    body: 'PlusJakartaSans-Regular',
    bodyMedium: 'PlusJakartaSans-Medium',
    transcript: 'JetBrainsMono-Regular',
  }
}

// Clarity mode background crossfade (Reanimated 3)
// Use interpolateColor with 600ms timing on clarity_mode change

// Idle breathing animation
// Animated.loop(Animated.sequence([
//   Animated.timing(scale, { toValue: 1.05, duration: 1500, easing: Easing.inOut(Easing.ease) }),
//   Animated.timing(scale, { toValue: 1.0, duration: 1500, easing: Easing.inOut(Easing.ease) })
// ]))

// Processing amber orbit
// Animated.loop(Animated.timing(rotation, { toValue: 1, duration: 1400, easing: Easing.linear }))
// const orbitStyle = useAnimatedStyle(() => ({
//   transform: [{ rotate: interpolate(rotation.value, [0,1], ['0deg','360deg']) }, { translateX: 28 }]
// }))
```

---

*This document is the authoritative design reference for all frontend work on ClarityAI. Any design decision not covered here should be resolved by asking: "What does Lumi look like in this state?" and extrapolating from the mascot's visual language.*

*ClarityAI Design System v1.0 — March 2026*
