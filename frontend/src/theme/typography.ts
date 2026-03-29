import { Platform, TextStyle } from 'react-native';

export const fontFamilies = {
  display: Platform.select({
    web: '"Nunito", "DM Sans", system-ui',
    default: 'Nunito_700Bold',
  }) as string,
  heading: Platform.select({
    web: '"Nunito", "DM Sans", system-ui',
    default: 'Nunito_600SemiBold',
  }) as string,
  body: Platform.select({
    web: '"Plus Jakarta Sans", "Geist", "Inter", system-ui',
    default: 'PlusJakartaSans_400Regular',
  }) as string,
  bodyMedium: Platform.select({
    web: '"Plus Jakarta Sans", "Geist", "Inter", system-ui',
    default: 'PlusJakartaSans_500Medium',
  }) as string,
  transcript: Platform.select({
    web: '"JetBrains Mono", "Geist Mono", monospace',
    default: 'JetBrainsMono_400Regular',
  }) as string,
};

export const typeScale: Record<string, TextStyle> = {
  displayH1: {
    fontFamily: fontFamilies.display,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 32 * 1.15,
  },
  titleH2: {
    fontFamily: fontFamilies.heading,
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 24 * 1.2,
  },
  subtitleH3: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 18 * 1.3,
  },
  body: {
    fontFamily: fontFamilies.body,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 16 * 1.65,
  },
  caption: {
    fontFamily: fontFamilies.body,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 13 * 1.4,
  },
  label: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.88, // 0.08em * 11
  },
  transcript: {
    fontFamily: fontFamilies.transcript,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 14 * 1.65,
  },
};
