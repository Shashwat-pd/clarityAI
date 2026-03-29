import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../src/theme';
import { FogBackground } from '../../src/components/FogBackground';
import { TranscriptList } from '../../src/components/TranscriptList';
import { Message } from '../../src/types';

const isWeb = Platform.OS === 'web';

const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'user',
    content: "I've been feeling really overwhelmed with my classes lately. I don't know where to start.",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: '2',
    role: 'assistant',
    content: "It sounds like you have a lot on your plate right now. Let's take a deep breath together. When you look at your classes, what feels like the heaviest burden?",
    timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
  },
  {
    id: '3',
    role: 'user',
    content: "Probably my biology lab report. It's due tomorrow and I haven't even started the data analysis.",
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: '4',
    role: 'assistant',
    content: "Thank you for sharing that. The biology lab report is clearly weighing on you since it's due so soon. Would it be helpful to break down the data analysis into smaller, more manageable steps?",
    timestamp: new Date(Date.now() - 1000 * 60 * 11).toISOString(),
  }
];

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FogBackground clarityMode="structuring" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, { color: theme.colors.brandPrimary, fontFamily: theme.fonts.bodyMedium }]}>
            ← Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.heading, fontFamily: theme.fonts.heading }]}>
          Session Details
        </Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.transcriptArea}>
        <TranscriptList messages={MOCK_MESSAGES} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxWidth: isWeb ? 680 : undefined,
    alignSelf: isWeb ? 'center' : undefined,
    width: isWeb ? '100%' : undefined,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(184, 206, 204, 0.3)',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 16,
  },
  backText: {
    fontSize: 16,
  },
  placeholder: {
    width: 60,
  },
  transcriptArea: {
    flex: 1,
  },
});
