import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Platform, Dimensions, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../theme';

interface MicButtonProps {
  isRecording: boolean;
  disabled?: boolean;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const { width: screenWidth } = Dimensions.get('window');
const BUTTON_SIZE = Platform.select({
  web: 80,
  default: 72,
}) as number;

const MicIcon: React.FC<{ color: string; size: number }> = ({ color, size }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z"
      fill={color}
    />
    <Path
      d="M19 10v2a7 7 0 0 1-14 0v-2"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 19v4M8 23h8"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ExpandingRing: React.FC<{ delay: number; isRecording: boolean }> = ({
  delay,
  isRecording,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isRecording) {
      scale.value = 1;
      opacity.value = 0;
      scale.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 0 }),
            withTiming(1.8, { duration: 1500, easing: Easing.out(Easing.cubic) }),
          ),
          -1,
          false,
        ),
      );
      opacity.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(0.5, { duration: 0 }),
            withTiming(0, { duration: 1500, easing: Easing.out(Easing.cubic) }),
          ),
          -1,
          false,
        ),
      );
    } else {
      scale.value = withTiming(1, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [isRecording, delay, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: BUTTON_SIZE,
          height: BUTTON_SIZE,
          borderRadius: BUTTON_SIZE / 2,
          borderWidth: 2,
          borderColor: '#6BBFAA',
        },
        animatedStyle,
      ]}
    />
  );
};

export const MicButton: React.FC<MicButtonProps> = ({
  isRecording,
  disabled = false,
  onPress,
}) => {
  const theme = useTheme();
  const pressed = useSharedValue(0);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withSpring(pressed.value ? 0.93 : 1, {
          damping: 15,
          stiffness: 300,
          mass: 0.8,
        }),
      },
    ],
  }));

  const buttonBg = isRecording ? '#D6EFEA' : '#6BBFAA';
  const micColor = isRecording ? '#3A7D6E' : '#FFFFFF';

  const glowStyle = disabled
    ? {}
    : isRecording
    ? theme.shadows.glow
    : theme.shadows.glowSm;

  return (
    <View style={styles.container}>
      {/* Expanding rings */}
      <ExpandingRing delay={0} isRecording={isRecording} />
      <ExpandingRing delay={500} isRecording={isRecording} />
      <ExpandingRing delay={1000} isRecording={isRecording} />

      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={isRecording ? 'Stop recording' : 'Start recording'}
        accessibilityState={{ disabled, expanded: isRecording }}
        onPress={onPress}
        disabled={disabled}
        onPressIn={() => {
          pressed.value = 1;
        }}
        onPressOut={() => {
          pressed.value = 0;
        }}
        style={[
          styles.button,
          {
            backgroundColor: buttonBg,
            borderWidth: isRecording ? 2.5 : 0,
            borderColor: isRecording ? '#6BBFAA' : 'transparent',
            opacity: disabled ? 0.5 : 1,
          },
          !disabled && glowStyle,
          animatedButtonStyle,
        ]}
      >
        <MicIcon color={micColor} size={28} />
      </AnimatedPressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MicButton;
