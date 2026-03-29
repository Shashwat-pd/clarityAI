import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme';
import ClarityScoreBadge from '../../src/components/ClarityScoreBadge';
import { ClarityMode } from '../../src/types';

interface SessionSummary {
  id: string;
  date: string;
  clarityMode: ClarityMode;
  clarityScore: number;
  duration: string;
}

const MOCK_SESSIONS: SessionSummary[] = [
  {
    id: 'sess-001',
    date: 'Today, 2:30 PM',
    clarityMode: 'guidance',
    clarityScore: 0.85,
    duration: '12:45',
  },
  {
    id: 'sess-002',
    date: 'Yesterday, 9:15 AM',
    clarityMode: 'structuring',
    clarityScore: 0.52,
    duration: '08:20',
  },
  {
    id: 'sess-003',
    date: 'Mon, March 23',
    clarityMode: 'grounding',
    clarityScore: 0.28,
    duration: '24:10',
  },
];

const isWeb = Platform.OS === 'web';

export default function HistoryScreen() {
  const theme = useTheme();
  const router = useRouter();

  const handlePress = (id: string) => {
    router.push(`/session/${id}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text
          style={[
            styles.title,
            { color: theme.colors.heading, fontFamily: theme.fonts.heading },
          ]}
        >
          Session History
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {MOCK_SESSIONS.length > 0 ? (
          MOCK_SESSIONS.map((session) => (
            <TouchableOpacity
              key={session.id}
              style={[
                styles.card,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
              onPress={() => handlePress(session.id)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.dateText, { color: theme.colors.text, fontFamily: theme.fonts.heading }]}>
                  {session.date}
                </Text>
                <Text style={[styles.durationText, { color: theme.colors.textSecondary, fontFamily: theme.fonts.body }]}>
                  {session.duration}
                </Text>
              </View>
              <View style={styles.cardFooter}>
                <ClarityScoreBadge score={session.clarityScore} clarityMode={session.clarityMode} />
                <Text style={[styles.viewDetails, { color: theme.colors.brandPrimary, fontFamily: theme.fonts.bodyMedium }]}>
                  View Details →
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text
              style={[
                styles.emptyText,
                { color: theme.colors.textSecondary, fontFamily: theme.fonts.body },
              ]}
            >
              Your past conversations with Lumi will appear here.
            </Text>
          </View>
        )}
      </ScrollView>
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
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  card: {
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#2A5C52',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
  },
  durationText: {
    fontSize: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewDetails: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 26,
  },
});
