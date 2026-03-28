import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useKeystrokeTracking } from '../hooks/useKeystrokeTracking';

interface TextInputWithTrackingProps {
  onSubmit: (message: string, signals: any) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

export const TextInputWithTracking: React.FC<TextInputWithTrackingProps> = ({
  onSubmit,
  disabled,
  placeholder = 'Type your message...',
}) => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { handleKeyPress, getSignals, resetTracking, handleAbandon } = useKeystrokeTracking();

  const handleChangeText = (text: string) => {
    // Track if message is being cleared (abandoned)
    if (text.length === 0 && message.length > 0) {
      handleAbandon();
    }

    // Track backspace
    if (text.length < message.length) {
      handleKeyPress('Backspace');
    } else if (text.length > message.length) {
      handleKeyPress(text[text.length - 1]);
    }

    setMessage(text);
  };

  const handleSubmitPress = async () => {
    if (!message.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const signals = getSignals();
      await onSubmit(message.trim(), signals);
      setMessage('');
      resetTracking();
    } catch (err) {
      console.error('Failed to submit message:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          multiline
          maxLength={500}
          editable={!disabled && !isSubmitting}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!message.trim() || disabled || isSubmitting) && styles.sendButtonDisabled,
          ]}
          onPress={handleSubmitPress}
          disabled={!message.trim() || disabled || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
