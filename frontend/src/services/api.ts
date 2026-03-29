import axios from 'axios';
import Constants from 'expo-constants';
import { Session, VoiceTurnResponse, ChatMessageResponse, KeystrokeSignals } from '../types';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8000/api/v1';
const API_BASE = API_URL.replace(/\/api\/v1$/, '');

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

export const ApiService = {
  // Session Management
  async createSession(consentGiven: boolean = true): Promise<Session> {
    const response = await api.post<Session>('/sessions', {
      consent_given: consentGiven,
    });
    return response.data;
  },

  async getSession(sessionId: string): Promise<Session> {
    const response = await api.get<Session>(`/sessions/${sessionId}`);
    return response.data;
  },

  // Voice Endpoints
  async sendVoiceTurn(sessionId: string, audioUri: string): Promise<VoiceTurnResponse> {
    const formData = new FormData();
    formData.append('session_id', sessionId);

    // Handle web vs native differently
    if (audioUri.startsWith('blob:') || audioUri.startsWith('http')) {
      // Web: fetch the blob and append it
      const response = await fetch(audioUri);
      const blob = await response.blob();
      formData.append('audio', blob, 'recording.webm');
    } else {
      // React Native: use the URI format
      // @ts-ignore - React Native FormData typing
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/webm',
        name: 'recording.webm',
      });
    }

    const response = await api.post<VoiceTurnResponse>('/voice/turn', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // Voice processing can take longer
    });
    return response.data;
  },

  // Chat Endpoints
  async sendChatMessage(
    sessionId: string,
    message: string,
    keystrokeSignals?: KeystrokeSignals
  ): Promise<ChatMessageResponse> {
    const response = await api.post<ChatMessageResponse>('/chat/message', {
      session_id: sessionId,
      message,
      keystroke_signals: keystrokeSignals,
    });
    return response.data;
  },

  // Health Check
  async checkHealth(): Promise<{ status: string; db: string; version: string }> {
    const response = await api.get('/health');
    return response.data;
  },

  // Resolve a backend-relative path (e.g. /api/v1/voice/audio/xxx) to a full URL
  resolveAudioUrl(path: string): string {
    if (path.startsWith('http')) return path;
    return `${API_BASE}${path}`;
  },
};
