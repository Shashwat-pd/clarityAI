import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { colors, spacing, radius, duration, easing, ClarityMode } from './tokens';
import { fontFamilies, typeScale } from './typography';
import { shadows } from './shadows';

export interface Theme {
  dark: boolean;
  colors: {
    background: string;
    surface: string;
    card: string;
    text: string;
    textSecondary: string;
    heading: string;
    border: string;
    brandPrimary: string;
    brandDeep: string;
    brandGlow: string;
    brandMist: string;
    brandFog: string;
    brandDark: string;
    brandInk: string;
    accentAmber: string;
    accentAmberSoft: string;
    crisisBg: string;
    crisisBorder: string;
    crisisText: string;
    crisisHeading: string;
  };
  spacing: typeof spacing;
  radius: typeof radius;
  duration: typeof duration;
  easing: typeof easing;
  fonts: typeof fontFamilies;
  typeScale: typeof typeScale;
  shadows: typeof shadows;
  clarityModeColors: typeof colors.clarityModes;
}

const lightTheme: Theme = {
  dark: false,
  colors: {
    background: colors.brandFog,
    surface: colors.surfacePrimary,
    card: colors.surfacePrimary,
    text: colors.brandDark,
    textSecondary: colors.textSecondary,
    heading: colors.brandInk,
    border: colors.borderDefault,
    brandPrimary: colors.brandPrimary,
    brandDeep: colors.brandDeep,
    brandGlow: colors.brandGlow,
    brandMist: colors.brandMist,
    brandFog: colors.brandFog,
    brandDark: colors.brandDark,
    brandInk: colors.brandInk,
    accentAmber: colors.accentAmber,
    accentAmberSoft: colors.accentAmberSoft,
    crisisBg: colors.crisisBg,
    crisisBorder: colors.crisisBorder,
    crisisText: colors.crisisText,
    crisisHeading: colors.crisisHeading,
  },
  spacing,
  radius,
  duration,
  easing,
  fonts: fontFamilies,
  typeScale,
  shadows,
  clarityModeColors: colors.clarityModes,
};

const darkTheme: Theme = {
  ...lightTheme,
  dark: true,
  colors: {
    ...lightTheme.colors,
    background: colors.surfaceDark,
    surface: colors.dark.surface,
    card: colors.dark.cardBg,
    text: colors.dark.bodyText,
    textSecondary: colors.dark.secondaryText,
    heading: colors.brandMist,
    border: colors.dark.border,
  },
};

const ThemeContext = createContext<Theme>(lightTheme);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const theme = useMemo(
    () => (colorScheme === 'dark' ? darkTheme : lightTheme),
    [colorScheme],
  );

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
