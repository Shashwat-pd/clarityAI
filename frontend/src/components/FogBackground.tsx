import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';
import type { ClarityMode } from '../types';

interface FogBackgroundProps {
  clarityMode: ClarityMode;
}

const MODE_INDEX: Record<ClarityMode, number> = {
  grounding: 0,
  structuring: 1,
  guidance: 2,
};

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

// Light mode gradient stops per mode
const LIGHT_TOP = ['#E8F5F2', '#D6EFEA', '#C0E8DC'];
const LIGHT_BOTTOM = ['#D6EFEA', '#E8F5F2', '#E8F5F2'];

// Dark mode (constant)
const DARK_TOP = '#162D28';
const DARK_BOTTOM = '#1D3830';

export const FogBackground: React.FC<FogBackgroundProps> = ({ clarityMode }) => {
  const theme = useTheme();
  const modeValue = useSharedValue(MODE_INDEX[clarityMode]);

  useEffect(() => {
    modeValue.value = withTiming(MODE_INDEX[clarityMode], { duration: 600 });
  }, [clarityMode, modeValue]);

  const animatedOverlayStyle = useAnimatedStyle(() => {
    // We use an overlay approach: render two gradient layers and crossfade
    // Since LinearGradient colors can't be animated directly,
    // we animate the overlay color on a View on top
    const overlayColor = interpolateColor(
      modeValue.value,
      [0, 1, 2],
      ['rgba(232,245,242,0)', 'rgba(214,239,234,0.3)', 'rgba(192,232,220,0.4)'],
    );
    return { backgroundColor: overlayColor };
  });

  if (theme.dark) {
    return (
      <LinearGradient
        colors={[DARK_TOP, DARK_BOTTOM]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
    );
  }

  // For light mode, use the base gradient for current mode and animate overlay
  const topColor = LIGHT_TOP[MODE_INDEX[clarityMode]];
  const bottomColor = LIGHT_BOTTOM[MODE_INDEX[clarityMode]];

  return (
    <>
      <LinearGradient
        colors={[topColor, bottomColor]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <Animated.View style={[StyleSheet.absoluteFill, animatedOverlayStyle]} />
    </>
  );
};

export default FogBackground;
