import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { useTheme } from '../../src/theme';

function SettingsRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      style={[
        styles.row,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text
        style={[styles.rowLabel, { color: theme.colors.text, fontFamily: theme.fonts.body }]}
      >
        {label}
      </Text>
      {value && (
        <Text
          style={[
            styles.rowValue,
            { color: theme.colors.textSecondary, fontFamily: theme.fonts.body },
          ]}
        >
          {value}
        </Text>
      )}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text
          style={[
            styles.title,
            { color: theme.colors.heading, fontFamily: theme.fonts.heading },
          ]}
        >
          Settings
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text
          style={[
            styles.sectionLabel,
            { color: theme.colors.textSecondary, fontFamily: theme.fonts.bodyMedium },
          ]}
        >
          APPEARANCE
        </Text>
        <SettingsRow label="Theme" value="System Default" />

        <Text
          style={[
            styles.sectionLabel,
            { color: theme.colors.textSecondary, fontFamily: theme.fonts.bodyMedium },
          ]}
        >
          SUPPORT
        </Text>
        <SettingsRow
          label="Crisis Resources"
          onPress={() => Linking.openURL('https://findahelpline.com')}
        />
        <SettingsRow label="About ClarityAI" value="v1.0.0" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.88,
    marginTop: 24,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  rowLabel: {
    fontSize: 16,
  },
  rowValue: {
    fontSize: 14,
  },
});
