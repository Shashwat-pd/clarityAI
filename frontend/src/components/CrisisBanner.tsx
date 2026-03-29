import React, { useEffect } from 'react';
import { Text, StyleSheet, Linking, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../theme';

interface CrisisBannerProps {
  visible: boolean;
}

export const CrisisBanner: React.FC<CrisisBannerProps> = ({ visible }) => {
  const theme = useTheme();
  const translateY = useSharedValue(visible ? 0 : -200);
  const opacity = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    const easingFn = Easing.out(Easing.cubic);
    if (visible) {
      translateY.value = withTiming(0, { duration: 400, easing: easingFn });
      opacity.value = withTiming(1, { duration: 400, easing: easingFn });
    } else {
      translateY.value = withTiming(-200, { duration: 400, easing: easingFn });
      opacity.value = withTiming(0, { duration: 300, easing: easingFn });
    }
  }, [visible, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const handleLinkPress = () => {
    Linking.openURL('https://findahelpline.com');
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={styles.heading}>You're not alone</Text>
      <Text style={styles.body}>
        It sounds like you're going through something really difficult right now.
        Please reach out to someone who can help — you deserve support.
      </Text>
      <Pressable onPress={handleLinkPress}>
        <Text style={styles.link}>findahelpline.com</Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: '#F5D0D0',
    borderWidth: 2,
    borderColor: '#E57373',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7D1F1F',
    marginBottom: 6,
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 14 * 1.65,
    color: '#5C1A1A',
    marginBottom: 8,
  },
  link: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7D1F1F',
    textDecorationLine: 'underline',
  },
});

export default CrisisBanner;
