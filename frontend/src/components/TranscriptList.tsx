import React, { useRef, useEffect } from 'react';
import { FlatList, Text, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';
import { TranscriptCard } from './TranscriptCard';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface TranscriptListProps {
  messages: Message[];
}

export const TranscriptList: React.FC<TranscriptListProps> = ({ messages }) => {
  const theme = useTheme();
  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    if (messages.length > 0 && listRef.current) {
      // Small delay to allow layout to complete before scrolling
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text
          style={[
            styles.emptyText,
            {
              fontFamily: theme.fonts.body,
              color: theme.colors.textSecondary,
            },
          ]}
        >
          Start your conversation by speaking or tapping the mic
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      ref={listRef}
      data={messages}
      keyExtractor={(item, index) => item.id ? `${item.id}-${index}` : String(index)}
      renderItem={({ item }) => <TranscriptCard message={item} />}
      contentContainerStyle={{
        padding: theme.spacing[4],
        gap: theme.spacing[3],
      }}
      showsVerticalScrollIndicator={false}
      onContentSizeChange={() => {
        listRef.current?.scrollToEnd({ animated: true });
      }}
    />
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    lineHeight: 16 * 1.65,
    textAlign: 'center',
  },
});

export default TranscriptList;
