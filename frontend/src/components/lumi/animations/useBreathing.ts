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

const BREATHE_DURATION = 3000;

export function useBreathing(active: boolean) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const glowOpacity = useSharedValue(0.35);

  useEffect(() => {
    if (active) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, {
            duration: BREATHE_DURATION / 2,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1.0, {
            duration: BREATHE_DURATION / 2,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1, // infinite
        false,
      );

      translateY.value = withRepeat(
        withSequence(
          withTiming(-3, {
            duration: BREATHE_DURATION / 2,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0, {
            duration: BREATHE_DURATION / 2,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1,
        false,
      );

      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, {
            duration: BREATHE_DURATION / 2,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0.35, {
            duration: BREATHE_DURATION / 2,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1,
        false,
      );
    } else {
      cancelAnimation(scale);
      cancelAnimation(translateY);
      cancelAnimation(glowOpacity);
      scale.value = withTiming(1, { duration: 300 });
      translateY.value = withTiming(0, { duration: 300 });
      glowOpacity.value = withTiming(0.35, { duration: 300 });
    }
  }, [active]);

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return { bodyStyle, glowStyle };
}
