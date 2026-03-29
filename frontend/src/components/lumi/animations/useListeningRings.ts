import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';

const SPRING_CONFIG = {
  damping: 12,
  stiffness: 120,
  mass: 0.8,
};

export function useListeningRings(audioAmplitude: number, active: boolean) {
  const ring1Scale = useSharedValue(1);
  const ring2Scale = useSharedValue(1);
  const ring3Scale = useSharedValue(1);
  const ring1Opacity = useSharedValue(0);
  const ring2Opacity = useSharedValue(0);
  const ring3Opacity = useSharedValue(0);

  useEffect(() => {
    if (active) {
      ring1Scale.value = withSpring(1 + audioAmplitude * 0.4, SPRING_CONFIG);
      ring2Scale.value = withDelay(
        50,
        withSpring(1 + audioAmplitude * 0.6, SPRING_CONFIG),
      );
      ring3Scale.value = withDelay(
        120,
        withSpring(1 + audioAmplitude * 0.8, SPRING_CONFIG),
      );

      ring1Opacity.value = withSpring(0.7, SPRING_CONFIG);
      ring2Opacity.value = withDelay(50, withSpring(0.4, SPRING_CONFIG));
      ring3Opacity.value = withDelay(120, withSpring(0.2, SPRING_CONFIG));
    } else {
      cancelAnimation(ring1Scale);
      cancelAnimation(ring2Scale);
      cancelAnimation(ring3Scale);
      cancelAnimation(ring1Opacity);
      cancelAnimation(ring2Opacity);
      cancelAnimation(ring3Opacity);

      ring1Scale.value = withTiming(1, { duration: 300 });
      ring2Scale.value = withTiming(1, { duration: 300 });
      ring3Scale.value = withTiming(1, { duration: 300 });
      ring1Opacity.value = withTiming(0, { duration: 300 });
      ring2Opacity.value = withTiming(0, { duration: 300 });
      ring3Opacity.value = withTiming(0, { duration: 300 });
    }
  }, [active, audioAmplitude]);

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring1Scale.value }],
    opacity: ring1Opacity.value,
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2Scale.value }],
    opacity: ring2Opacity.value,
  }));

  const ring3Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring3Scale.value }],
    opacity: ring3Opacity.value,
  }));

  return { ring1Style, ring2Style, ring3Style };
}
