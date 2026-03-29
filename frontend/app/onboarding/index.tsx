import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme';
import { FogBackground } from '../../src/components/FogBackground';
import { Audio } from 'expo-av';

const isWeb = Platform.OS === 'web';

export default function OnboardingScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [permissionError, setPermissionError] = useState(false);

  const handleStart = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status === 'granted') {
        router.replace('/(tabs)');
      } else {
        setPermissionError(true);
      }
    } catch (e) {
      console.error(e);
      setPermissionError(true);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FogBackground clarityMode="grounding" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.mascotPlaceholder}>
           {/* Placeholder for the mascot visually balancing the screen */}
        </View>
        <Text style={[styles.title, { color: theme.colors.heading, fontFamily: theme.fonts.heading }]}>
          Welcome to ClarityAI
        </Text>
        <Text style={[styles.body, { color: theme.colors.text, fontFamily: theme.fonts.body }]}>
          I'm Lumi. I'm here to listen, help you untangle your thoughts, and find your way back to balance.
        </Text>
        <Text style={[styles.body, { color: theme.colors.textSecondary, fontFamily: theme.fonts.body }]}>
          To best help you, I'll need access to your microphone to pick up your voice and speak with you.
        </Text>

        {permissionError && (
          <Text style={[styles.error, { color: '#E57373', fontFamily: theme.fonts.body }]}>
            Microphone access is required to use the voice features. Please enable it in your browser or device settings.
          </Text>
        )}

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.colors.brandPrimary }]}
          onPress={handleStart}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, { color: '#FFFFFF', fontFamily: theme.fonts.heading }]}>
             Allow Microphone & Start
          </Text>
        </TouchableOpacity>
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
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  mascotPlaceholder: {
    height: 180,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 24,
    lineHeight: 38,
  },
  body: {
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 20,
  },
  error: {
    fontSize: 14,
    marginTop: 10,
    marginBottom: 20,
  },
  button: {
    marginTop: 40,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 999,
    alignItems: 'center',
    shadowColor: '#6BBFAA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
