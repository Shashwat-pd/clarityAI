import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { LumiState, ClarityMode } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import Lumi from './Lumi';
import ClarityScoreBadge from '../ClarityScoreBadge';
import SessionTimer from '../SessionTimer';

interface MascotZoneProps {
  state: LumiState;
  clarityMode: ClarityMode;
  clarityScore: number;
  audioAmplitude?: number;
  sessionStartTime?: string;
}

const MODE_INDEX: Record<ClarityMode, number> = {
  grounding: 0,
  structuring: 1,
  guidance: 2,
};

export default function MascotZone({
  state,
  clarityMode,
  clarityScore,
  audioAmplitude,
  sessionStartTime,
}: MascotZoneProps) {
  const theme = useTheme();

  const modeProgress = useSharedValue(MODE_INDEX[clarityMode]);

  useEffect(() => {
    modeProgress.value = withTiming(MODE_INDEX[clarityMode], {
      duration: theme.duration.modeShift,
    });
  }, [clarityMode]);

  const groundingBg = theme.clarityModeColors.grounding.bg;
  const structuringBg = theme.clarityModeColors.structuring.bg;
  const guidanceBg = theme.clarityModeColors.guidance.bg;

  const backgroundStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      modeProgress.value,
      [0, 1, 2],
      [groundingBg, structuringBg, guidanceBg],
    );
    return { backgroundColor };
  });

  return (
    <Animated.View style={[styles.container, backgroundStyle]}>
      {/* Session timer - top left */}
      <View style={styles.topLeft}>
        <SessionTimer startTime={sessionStartTime} />
      </View>

      {/* Clarity score badge - top right */}
      <View style={styles.topRight}>
        <ClarityScoreBadge score={clarityScore} clarityMode={clarityMode} />
      </View>

      {/* Lumi centered */}
      <View style={styles.lumiContainer}>
        <Lumi
          state={state}
          clarityMode={clarityMode}
          audioAmplitude={audioAmplitude}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  topLeft: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 1,
  },
  topRight: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  lumiContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
