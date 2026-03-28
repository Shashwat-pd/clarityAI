import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Message } from '../types';

interface TranscriptProps {
  messages: Message[];
}

export const Transcript: React.FC<TranscriptProps> = ({ messages }) => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={true}
    >
      {messages.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Start your conversation by speaking or typing a message
          </Text>
        </View>
      ) : (
        messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageContainer,
              message.role === 'user' ? styles.userMessage : styles.aiMessage,
            ]}
          >
            <Text style={styles.messageLabel}>
              {message.role === 'user' ? 'You' : 'ClarityAI'}
            </Text>
            <Text style={styles.messageText}>{message.content}</Text>
            <Text style={styles.messageTimestamp}>
              {new Date(message.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  messageContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#3B82F6',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    color: '#6B7280',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#111827',
  },
  messageTimestamp: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
