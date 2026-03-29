import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSession } from '../hooks/useSession';
import { ApiService } from '../services/api';
import { CrisisBanner } from '../components/CrisisBanner';
import { VoiceRecorder } from '../components/VoiceRecorder';
import { AudioPlayer } from '../components/AudioPlayer';
import { Transcript } from '../components/Transcript';
import { TextInputWithTracking } from '../components/TextInputWithTracking';
import { Message } from '../types';

export const ChatScreen: React.FC = () => {
  const { session, loading: sessionLoading, error: sessionError } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [crisisFlag, setCrisisFlag] = useState(false);
  const [currentAudioUri, setCurrentAudioUri] = useState<string | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle voice recording completion
  const handleVoiceRecording = async (audioUri: string) => {
    if (!session) return;

    try {
      setIsProcessing(true);

      // Add user's audio message placeholder
      const userMessageId = `user-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: userMessageId,
          role: 'user',
          content: '[Voice message]',
          timestamp: new Date().toISOString(),
        },
      ]);

      // Send to backend
      const response = await ApiService.sendVoiceTurn(session.session_id, audioUri);

      // Update user message with transcript
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessageId
            ? { ...msg, content: response.transcript }
            : msg
        )
      );

      // Add AI response
      setMessages((prev) => [
        ...prev,
        {
          id: response.turn_id,
          role: 'assistant',
          content: response.ai_text,
          timestamp: new Date().toISOString(),
        },
      ]);

      // Handle crisis flag
      if (response.crisis_flag) {
        setCrisisFlag(true);
      }

      // Play audio response
      if (response.audio_url) {
        setCurrentAudioUri(ApiService.resolveAudioUrl(response.audio_url));
      } else if (response.audio_bytes) {
        // Base64 audio
        setCurrentAudioUri(`data:audio/mp3;base64,${response.audio_bytes}`);
      }
    } catch (err) {
      console.error('Voice turn error:', err);
      alert('Failed to process voice message. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle text message submission
  const handleTextMessage = async (message: string, keystrokeSignals: any) => {
    if (!session) return;

    try {
      setIsProcessing(true);

      // Add user message
      const userMessageId = `user-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: userMessageId,
          role: 'user',
          content: message,
          timestamp: new Date().toISOString(),
        },
      ]);

      // Send to backend
      const response = await ApiService.sendChatMessage(
        session.session_id,
        message,
        keystrokeSignals
      );

      // Add AI response
      setMessages((prev) => [
        ...prev,
        {
          id: response.message_id,
          role: 'assistant',
          content: response.ai_response,
          timestamp: new Date().toISOString(),
        },
      ]);

      // Handle crisis flag
      if (response.crisis_flag) {
        setCrisisFlag(true);
      }
    } catch (err) {
      console.error('Chat message error:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (sessionLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Initializing session...</Text>
      </SafeAreaView>
    );
  }

  if (sessionError || !session) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Failed to initialize session. Please check your connection and try again.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ClarityAI</Text>
        <View style={styles.clarityBadge}>
          <Text style={styles.clarityText}>
            {session.current_clarity_mode || 'grounding'}
          </Text>
        </View>
      </View>

      <CrisisBanner visible={crisisFlag} />

      <Transcript messages={messages} />

      {currentAudioUri && (
        <AudioPlayer
          audioUri={currentAudioUri}
          onPlaybackComplete={() => setCurrentAudioUri(undefined)}
        />
      )}

      <VoiceRecorder
        onRecordingComplete={handleVoiceRecording}
        disabled={isProcessing}
      />

      <TextInputWithTracking
        onSubmit={handleTextMessage}
        disabled={isProcessing}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  clarityBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  clarityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
    textTransform: 'capitalize',
  },
});
