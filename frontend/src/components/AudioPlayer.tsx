import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';

interface AudioPlayerProps {
  audioUri?: string;
  audioBase64?: string;
  autoPlay?: boolean;
  onPlaybackComplete?: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUri,
  audioBase64,
  autoPlay = true,
  onPlaybackComplete,
}) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (audioUri || audioBase64) {
      loadAndPlayAudio();
    }

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [audioUri, audioBase64]);

  const loadAndPlayAudio = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Unload previous sound if exists
      if (sound) {
        await sound.unloadAsync();
      }

      // Set audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      // Load audio from URI or base64
      const source = audioUri
        ? { uri: audioUri }
        : audioBase64
        ? { uri: `data:audio/mp3;base64,${audioBase64}` }
        : null;

      if (!source) {
        setError('No audio source provided');
        return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        source,
        { shouldPlay: autoPlay },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      setIsPlaying(autoPlay);
    } catch (err) {
      console.error('Failed to load audio:', err);
      setError('Failed to play audio');
    } finally {
      setIsLoading(false);
    }
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      setIsPlaying(false);
      return;
    }

    setIsPlaying(status.isPlaying);

    if (status.didJustFinish) {
      setIsPlaying(false);
      onPlaybackComplete?.();
    }
  };

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#3B82F6" />
        <Text style={styles.statusText}>Loading audio...</Text>
      </View>
    );
  }

  if (isPlaying) {
    return (
      <View style={styles.container}>
        <View style={styles.playingIndicator}>
          <Text style={styles.playingText}>🔊 AI is speaking...</Text>
        </View>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    alignItems: 'center',
  },
  statusText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
  },
  playingIndicator: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  playingText: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '500',
  },
});
