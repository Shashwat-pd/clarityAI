import { Platform, ViewStyle } from 'react-native';

type ShadowDef = ViewStyle & { boxShadow?: string };

function createShadow(
  offsetY: number,
  blurRadius: number,
  opacity: number,
  color = '42,92,82',
  spreadRadius = 0,
): ShadowDef {
  return Platform.select({
    web: {
      boxShadow: `0 ${offsetY}px ${blurRadius}px ${spreadRadius}px rgba(${color},${opacity})`,
    } as ShadowDef,
    ios: {
      shadowColor: `rgba(${color},1)`,
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: blurRadius / 2,
    } as ShadowDef,
    default: {
      elevation: Math.round(blurRadius / 4),
    } as ShadowDef,
  }) as ShadowDef;
}

function createGlow(blurRadius: number, opacity: number): ShadowDef {
  return Platform.select({
    web: {
      boxShadow: `0 0 ${blurRadius}px rgba(107,191,170,${opacity})`,
    } as ShadowDef,
    ios: {
      shadowColor: '#6BBFAA',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: opacity,
      shadowRadius: blurRadius / 2,
    } as ShadowDef,
    default: {
      elevation: Math.round(blurRadius / 6),
    } as ShadowDef,
  }) as ShadowDef;
}

export const shadows = {
  sm: createShadow(1, 4, 0.08),
  md: createShadow(4, 16, 0.12),
  lg: createShadow(8, 32, 0.16),
  glow: createGlow(24, 0.35),
  glowSm: createGlow(12, 0.25),
};
