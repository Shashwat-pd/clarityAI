import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform, Dimensions, Text } from 'react-native';
import { Audio } from 'expo-av';
import { useTheme } from '../../src/theme';
import { useSession } from '../../src/context/SessionContext';
import MascotZone from '../../src/components/lumi/MascotZone';
import { MicButton } from '../../src/components/MicButton';
import { TranscriptList } from '../../src/components/TranscriptList';
import { TextInputArea } from '../../src/components/TextInputArea';
import { CrisisBanner } from '../../src/components/CrisisBanner';
import { FogBackground } from '../../src/components/FogBackground';
import { AudioPlayer } from '../../src/components/AudioPlayer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

export default function VoiceScreen() {
  const theme = useTheme();
  const {
    state,
    startSession,
    sendVoiceTurn,
    sendTextMessage,
    setLumiState,
    setRecording,
    setAudioAmplitude,
    setAudioSource,
  } = useSession();

  const recordingRef = useRef<Audio.Recording | null>(null);
  const meteringInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);

  // Auto-start session on mount
  useEffect(() => {
    if (!state.session && !state.loading) {
      startSession();
    }
  }, []);

  const handleMicPress = useCallback(async () => {
    if (state.crisisFlag) return;

    // Interrupt playback if AI is currently speaking
    if (state.lumiState === 'speaking') {
      setAudioSource(null, null);
      setLumiState('idle');
    }

    if (state.isRecording) {
      // Stop recording
      setRecording(false);
      setLumiState('processing');
      setAudioAmplitude(0);

      if (meteringInterval.current) {
        clearInterval(meteringInterval.current);
        meteringInterval.current = null;
      }

      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
          await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
          const uri = recordingRef.current.getURI();
          recordingRef.current = null;
          if (uri) {
            await sendVoiceTurn(uri);
          }
        } catch (err) {
          console.error('Stop recording error:', err);
          setLumiState('idle');
        }
      }
    } else {
      // Start recording
      try {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') return;

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording } = await Audio.Recording.createAsync({
          isMeteringEnabled: true,
          android: {
            extension: '.webm',
            outputFormat: Audio.AndroidOutputFormat.WEBM,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: 48000,
            numberOfChannels: 1,
            bitRate: 128000,
          },
          ios: {
            extension: '.caf',
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: 48000,
            numberOfChannels: 1,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {
            mimeType: 'audio/webm',
            bitsPerSecond: 128000,
          },
        });

        recordingRef.current = recording;
        setRecording(true);
        setLumiState('listening');

        // Poll metering for amplitude
        meteringInterval.current = setInterval(async () => {
          if (recordingRef.current) {
            try {
              const status = await recordingRef.current.getStatusAsync();
              if (status.isRecording && status.metering !== undefined) {
                // Normalize dB (-160 to 0) to 0-1 range
                const normalized = Math.max(0, Math.min(1, (status.metering + 60) / 60));
                setAudioAmplitude(normalized);
              }
            } catch {
              // Recording may have been stopped
            }
          }
        }, 100);
      } catch (err) {
        console.error('Start recording error:', err);
      }
    }
  }, [state.isRecording, state.crisisFlag, state.lumiState, sendVoiceTurn, setAudioSource, setLumiState]);

  const handleTextSubmit = useCallback(
    (text: string, keystrokeSignals: any) => {
      sendTextMessage(text, keystrokeSignals);
    },
    [sendTextMessage],
  );

  const handleAudioComplete = useCallback(() => {
    setLumiState('idle');
    setAudioSource(null, null);
  }, [setLumiState, setAudioSource]);

  // Loading state
  if (state.loading && !state.session) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <FogBackground clarityMode="grounding" />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Starting session...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FogBackground clarityMode={state.clarityMode} />

      <CrisisBanner visible={state.crisisFlag} />

      {/* Mascot Zone — top 40% */}
      <View style={styles.mascotZone}>
        <MascotZone
          state={state.lumiState}
          clarityMode={state.clarityMode}
          clarityScore={state.clarityScore}
          audioAmplitude={state.audioAmplitude}
          sessionStartTime={state.sessionStartTime ?? undefined}
        />
      </View>

      {/* Mic Button Area — middle ~10% */}
      <View style={styles.micArea}>
        <MicButton
          isRecording={state.isRecording}
          disabled={state.crisisFlag || state.lumiState === 'processing'}
          onPress={handleMicPress}
        />
        {!showTextInput && state.messages.length === 0 && (
          <Text
            style={[
              styles.tapHint,
              { color: theme.colors.textSecondary, fontFamily: theme.fonts.body },
            ]}
          >
            Tap to speak
          </Text>
        )}
        
        {/* Audio Player is hidden visually when Lumi is the UI, but it manages playback */}
        <View style={styles.audioPlayerHidden}>
          {(state.activeAudioUrl || state.activeAudioBytes) && (
            <AudioPlayer
              audioUri={state.activeAudioUrl || undefined}
              audioBase64={state.activeAudioBytes || undefined}
              onPlaybackComplete={handleAudioComplete}
              autoPlay={true}
            />
          )}
        </View>
      </View>

      {/* Transcript Area — bottom ~50% */}
      <View style={styles.transcriptArea}>
        <TranscriptList messages={state.messages} />
      </View>

      {/* Text Input — bottom, above tab bar */}
      {showTextInput ? (
        <View style={styles.textInputArea}>
          <TextInputArea
            onSubmit={handleTextSubmit}
            disabled={state.crisisFlag || state.lumiState === 'processing'}
          />
        </View>
      ) : (
        <View style={styles.textToggle}>
          {state.lumiState === 'speaking' ? (
            <Text
              accessibilityRole="button"
              style={[styles.textToggleButton, { color: theme.colors.brandPrimary, fontWeight: '600' }]}
              onPress={() => {
                setAudioSource(null, null);
                setLumiState('idle');
              }}
            >
              Stop Speaking
            </Text>
          ) : (
            <Text
              accessibilityRole="button"
              style={[styles.textToggleButton, { color: theme.colors.textSecondary }]}
              onPress={() => setShowTextInput(true)}
            >
              Type instead
            </Text>
          )}
        </View>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  mascotZone: {
    height: '38%',
    minHeight: 240,
  },
  micArea: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  tapHint: {
    marginTop: 8,
    fontSize: 13,
  },
  transcriptArea: {
    flex: 1,
    minHeight: 100,
  },
  textInputArea: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  textToggle: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  textToggleButton: {
    fontSize: 13,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  audioPlayerHidden: {
    height: 0,
    overflow: 'hidden',
    opacity: 0,
  },
});
