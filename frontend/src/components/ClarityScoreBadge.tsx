import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { useTheme } from '../theme';
import type { ClarityMode } from '../types';

interface ClarityScoreBadgeProps {
  clarityMode: ClarityMode;
  score: number;
}

const MODE_INDEX: Record<ClarityMode, number> = {
  grounding: 0,
  structuring: 1,
  guidance: 2,
};

export const ClarityScoreBadge: React.FC<ClarityScoreBadgeProps> = ({
  clarityMode,
  score,
}) => {
  const theme = useTheme();
  const modeValue = useSharedValue(MODE_INDEX[clarityMode]);

  const bgColors = [
    theme.clarityModeColors.grounding.bg,
    theme.clarityModeColors.structuring.bg,
    theme.clarityModeColors.guidance.bg,
  ];

  const borderColors = [
    theme.clarityModeColors.grounding.border,
    theme.clarityModeColors.structuring.border,
    theme.clarityModeColors.guidance.border,
  ];

  useEffect(() => {
    modeValue.value = withTiming(MODE_INDEX[clarityMode], { duration: 600 });
  }, [clarityMode, modeValue]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      modeValue.value,
      [0, 1, 2],
      bgColors,
    );
    const borderColor = interpolateColor(
      modeValue.value,
      [0, 1, 2],
      borderColors,
    );
    return { backgroundColor, borderColor };
  });

  const label = `${clarityMode.toUpperCase()} \u00B7 ${score.toFixed(2)}`;

  return (
    <Animated.View style={[styles.badge, animatedContainerStyle]}>
      <Animated.Text style={styles.label}>{label}</Animated.Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.88,
    textTransform: 'uppercase',
    color: '#1A3C35',
  },
});

export default ClarityScoreBadge;
