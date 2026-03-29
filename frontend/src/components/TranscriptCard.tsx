import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../theme';

interface TranscriptCardProps {
  message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  };
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  const m = String(minutes).padStart(2, '0');
  return `${h}:${m} ${ampm}`;
}

export const TranscriptCard: React.FC<TranscriptCardProps> = ({ message }) => {
  const theme = useTheme();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
    translateY.value = withTiming(0, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
  }, [opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const isUser = message.role === 'user';
  const label = isUser ? 'STUDENT' : 'LUMI';
  const timeStr = formatTime(message.timestamp);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: isUser ? '#F7FAF9' : '#D6EFEA',
          borderColor: isUser ? '#D6EFEA' : '#A8DDD0',
        },
        animatedStyle,
      ]}
    >
      <Text style={styles.label}>
        {label} {'\u00B7'} {timeStr}
      </Text>
      <Text
        style={[
          styles.content,
          {
            fontFamily: isUser ? theme.fonts.transcript : theme.fonts.body,
            color: isUser ? '#2A5C52' : '#1A3C35',
          },
        ]}
      >
        {isUser ? `\u201C${message.content}\u201D` : message.content}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    width: '100%',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.88,
    textTransform: 'uppercase',
    color: '#8BA49F',
    marginBottom: 6,
  },
  content: {
    fontSize: 14,
    lineHeight: 14 * 1.65,
  },
});

export default TranscriptCard;
