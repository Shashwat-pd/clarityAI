import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  Pressable,
  Text,
  StyleSheet,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../theme';
import { useKeystrokeTracking } from '../hooks/useKeystrokeTracking';

interface TextInputAreaProps {
  onSubmit: (text: string, keystrokeSignals: any) => void;
  disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const TextInputArea: React.FC<TextInputAreaProps> = ({
  onSubmit,
  disabled = false,
}) => {
  const theme = useTheme();
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const { handleKeyPress, getSignals, resetTracking } = useKeystrokeTracking();

  const sendScale = useSharedValue(1);

  const animatedSendStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
  }));

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    const signals = getSignals();
    onSubmit(trimmed, signals);
    setText('');
    resetTracking();
  }, [text, disabled, getSignals, onSubmit, resetTracking]);

  const onKeyPress = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      handleKeyPress(e.nativeEvent.key);
    },
    [handleKeyPress],
  );

  const borderColor = isFocused ? '#6BBFAA' : '#B8CECC';
  const focusGlow = isFocused ? theme.shadows.glowSm : {};

  return (
    <View style={styles.row}>
      <TextInput
        style={[
          styles.input,
          {
            borderColor,
            fontFamily: theme.fonts.body,
          },
          focusGlow,
        ]}
        value={text}
        onChangeText={setText}
        onKeyPress={onKeyPress}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="Type a message..."
        placeholderTextColor="#8BA49F"
        multiline
        numberOfLines={4}
        editable={!disabled}
        textAlignVertical="top"
      />
      {text.trim().length > 0 && (
        <AnimatedPressable
          onPress={handleSubmit}
          onPressIn={() => {
            sendScale.value = withTiming(0.9, { duration: 80 });
          }}
          onPressOut={() => {
            sendScale.value = withTiming(1, { duration: 80 });
          }}
          disabled={disabled}
          style={[styles.sendButton, animatedSendStyle]}
        >
          <Text style={styles.sendArrow}>{'\u2192'}</Text>
        </AnimatedPressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F7FAF9',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    lineHeight: 16 * 1.65,
    color: '#1A3C35',
    maxHeight: 4 * (16 * 1.65) + 24, // 4 lines + padding
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6BBFAA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  sendArrow: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default TextInputArea;
