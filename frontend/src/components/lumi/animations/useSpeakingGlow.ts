import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

const GLOW_DURATION = 600;

export function useSpeakingGlow(active: boolean) {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (active) {
      scale.value = withTiming(1.03, { duration: 200 });

      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(1, {
            duration: GLOW_DURATION / 2,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0.6, {
            duration: GLOW_DURATION / 2,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1,
        false,
      );
    } else {
      cancelAnimation(scale);
      cancelAnimation(glowOpacity);
      scale.value = withTiming(1, { duration: 300 });
      glowOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [active]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return { containerStyle, glowStyle };
}
