export const colors = {
  // Primary Brand
  brandPrimary: '#6BBFAA',
  brandDeep: '#3A7D6E',
  brandGlow: '#A8DDD0',
  brandMist: '#D6EFEA',
  brandFog: '#E8F5F2',
  brandDark: '#2A5C52',
  brandInk: '#1A3C35',

  // Surfaces
  surfacePrimary: '#F7FAF9',
  surfaceDark: '#162D28',
  sky: '#C5DDD8',
  borderDefault: '#B8CECC',
  textSecondary: '#8BA49F',

  // Accent
  accentAmber: '#D4956A',
  accentAmberSoft: '#F2D9C8',

  // Clarity Modes
  clarityModes: {
    grounding: { bg: '#E8F5F2', border: '#A8DDD0' },
    structuring: { bg: '#D6EFEA', border: '#6BBFAA' },
    guidance: { bg: '#C0E8DC', border: '#3A7D6E' },
  },

  // Crisis
  crisisBg: '#F5D0D0',
  crisisBorder: '#E57373',
  crisisText: '#5C1A1A',
  crisisHeading: '#7D1F1F',

  // Dark Mode Overrides
  dark: {
    surface: '#1D3830',
    cardBg: '#1F3A32',
    bodyText: '#D6EFEA',
    secondaryText: '#8BA49F',
    border: 'rgba(107,191,170,0.2)',
  },
} as const;

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 24,
  6: 32,
  7: 48,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  full: 999,
} as const;

export const duration = {
  fast: 150,
  base: 250,
  slow: 500,
  breathe: 3000,
  modeShift: 600,
} as const;

export const easing = {
  out: [0, 0.55, 0.45, 1] as [number, number, number, number],
  spring: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
  breathe: 'easeInOut' as const,
} as const;

export type ClarityMode = 'grounding' | 'structuring' | 'guidance';
export type LumiState = 'idle' | 'listening' | 'processing' | 'speaking' | 'grounding' | 'crisis';
