import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

const ORBIT_DURATION = 1400;

export function useProcessingOrbit(active: boolean) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (active) {
      rotation.value = 0;
      rotation.value = withRepeat(
        withTiming(360, {
          duration: ORBIT_DURATION,
          easing: Easing.linear,
        }),
        -1, // infinite
        false,
      );
    } else {
      cancelAnimation(rotation);
      rotation.value = withTiming(0, { duration: 300 });
    }
  }, [active]);

  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return { orbitStyle };
}
