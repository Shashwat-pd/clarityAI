import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import { ClarityMode, LumiState, Session, Message, KeystrokeSignals } from '../types';
import { ApiService } from '../services/api';

interface SessionState {
  session: Session | null;
  clarityMode: ClarityMode;
  clarityScore: number;
  crisisFlag: boolean;
  consecutiveNonCrisis: number;
  lumiState: LumiState;
  messages: Message[];
  isRecording: boolean;
  audioAmplitude: number;
  sessionStartTime: string | null;
  loading: boolean;
  error: string | null;
  activeAudioUrl: string | null;
  activeAudioBytes: string | null;
}

type Action =
  | { type: 'START_SESSION_PENDING' }
  | { type: 'START_SESSION_SUCCESS'; session: Session }
  | { type: 'START_SESSION_ERROR'; error: string }
  | { type: 'SET_LUMI_STATE'; state: LumiState }
  | { type: 'UPDATE_CLARITY'; mode: ClarityMode; score: number }
  | { type: 'ADD_MESSAGE'; message: Message }
  | { type: 'UPDATE_MESSAGE'; id: string; content: string }
  | { type: 'SET_CRISIS'; flag: boolean }
  | { type: 'SET_AUDIO_AMPLITUDE'; amplitude: number }
  | { type: 'SET_RECORDING'; recording: boolean }
  | { type: 'SET_AUDIO_SOURCE'; url: string | null; bytes: string | null }
  | { type: 'CLEAR_SESSION' };

const initialState: SessionState = {
  session: null,
  clarityMode: 'grounding',
  clarityScore: 0,
  crisisFlag: false,
  consecutiveNonCrisis: 0,
  lumiState: 'idle',
  messages: [],
  isRecording: false,
  audioAmplitude: 0,
  sessionStartTime: null,
  loading: false,
  error: null,
  activeAudioUrl: null,
  activeAudioBytes: null,
};

function sessionReducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case 'START_SESSION_PENDING':
      return { ...state, loading: true, error: null };
    case 'START_SESSION_SUCCESS':
      return {
        ...state,
        session: action.session,
        loading: false,
        sessionStartTime: new Date().toISOString(),
        clarityMode: action.session.current_clarity_mode || 'grounding',
        clarityScore: action.session.current_clarity_score || 0,
      };
    case 'START_SESSION_ERROR':
      return { ...state, loading: false, error: action.error };
    case 'SET_LUMI_STATE':
      return { ...state, lumiState: action.state };
    case 'UPDATE_CLARITY':
      return { ...state, clarityMode: action.mode, clarityScore: action.score };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] };
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.id ? { ...m, content: action.content } : m,
        ),
      };
    case 'SET_CRISIS': {
      if (action.flag) {
        return {
          ...state,
          crisisFlag: true,
          consecutiveNonCrisis: 0,
          lumiState: 'crisis',
        };
      }
      const next = state.consecutiveNonCrisis + 1;
      return {
        ...state,
        consecutiveNonCrisis: next,
        crisisFlag: next >= 3 ? false : state.crisisFlag,
        lumiState: next >= 3 && state.crisisFlag ? 'idle' : state.lumiState,
      };
    }
    case 'SET_AUDIO_AMPLITUDE':
      return { ...state, audioAmplitude: action.amplitude };
    case 'SET_RECORDING':
      return { ...state, isRecording: action.recording };
    case 'SET_AUDIO_SOURCE':
      return { ...state, activeAudioUrl: action.url, activeAudioBytes: action.bytes };
    case 'CLEAR_SESSION':
      return initialState;
    default:
      return state;
  }
}

interface SessionContextValue {
  state: SessionState;
  startSession: () => Promise<void>;
  sendVoiceTurn: (audioUri: string) => Promise<void>;
  sendTextMessage: (text: string, keystrokeSignals?: KeystrokeSignals) => Promise<void>;
  setLumiState: (state: LumiState) => void;
  setRecording: (recording: boolean) => void;
  setAudioAmplitude: (amplitude: number) => void;
  setAudioSource: (url: string | null, bytes: string | null) => void;
  clearSession: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(sessionReducer, initialState);
  const audioUriRef = useRef<string | null>(null);

  const startSession = useCallback(async () => {
    dispatch({ type: 'START_SESSION_PENDING' });
    try {
      const session = await ApiService.createSession(true);
      dispatch({ type: 'START_SESSION_SUCCESS', session });
    } catch (err: any) {
      dispatch({ type: 'START_SESSION_ERROR', error: err.message || 'Failed to start session' });
    }
  }, []);

  const sendVoiceTurn = useCallback(async (audioUri: string) => {
    if (!state.session) return;

    dispatch({ type: 'SET_LUMI_STATE', state: 'processing' });

    const userMsgId = `user-${Date.now()}`;
    dispatch({
      type: 'ADD_MESSAGE',
      message: { id: userMsgId, role: 'user', content: '...', timestamp: new Date().toISOString() },
    });

    try {
      const response = await ApiService.sendVoiceTurn(state.session.session_id, audioUri);

      dispatch({ type: 'UPDATE_MESSAGE', id: userMsgId, content: response.transcript });
      dispatch({
        type: 'ADD_MESSAGE',
        message: {
          id: response.turn_id,
          role: 'assistant',
          content: response.ai_text,
          timestamp: new Date().toISOString(),
        },
      });
      dispatch({ type: 'UPDATE_CLARITY', mode: response.clarity_mode, score: response.clarity_score });
      dispatch({ type: 'SET_CRISIS', flag: response.crisis_flag });

      if (!response.crisis_flag) {
        dispatch({ type: 'SET_LUMI_STATE', state: 'speaking' });
        const parsedUrl = response.audio_url ? ApiService.resolveAudioUrl(response.audio_url) : null;
        dispatch({ type: 'SET_AUDIO_SOURCE', url: parsedUrl, bytes: response.audio_bytes || null });
      }
    } catch (err: any) {
      console.error('Voice turn error:', err);
      dispatch({ type: 'SET_LUMI_STATE', state: 'idle' });
    }
  }, [state.session]);

  const sendTextMessage = useCallback(async (text: string, keystrokeSignals?: KeystrokeSignals) => {
    if (!state.session) return;

    dispatch({ type: 'SET_LUMI_STATE', state: 'processing' });

    const userMsgId = `user-${Date.now()}`;
    dispatch({
      type: 'ADD_MESSAGE',
      message: { id: userMsgId, role: 'user', content: text, timestamp: new Date().toISOString() },
    });

    try {
      const response = await ApiService.sendChatMessage(
        state.session.session_id,
        text,
        keystrokeSignals,
      );

      dispatch({
        type: 'ADD_MESSAGE',
        message: {
          id: response.message_id,
          role: 'assistant',
          content: response.ai_response,
          timestamp: new Date().toISOString(),
        },
      });
      dispatch({ type: 'UPDATE_CLARITY', mode: response.clarity_mode, score: response.clarity_score });
      dispatch({ type: 'SET_CRISIS', flag: response.crisis_flag });

      if (!response.crisis_flag) {
        dispatch({ type: 'SET_LUMI_STATE', state: 'idle' });
      }
    } catch (err: any) {
      console.error('Chat message error:', err);
      dispatch({ type: 'SET_LUMI_STATE', state: 'idle' });
    }
  }, [state.session]);

  const setLumiState = useCallback((s: LumiState) => {
    dispatch({ type: 'SET_LUMI_STATE', state: s });
  }, []);

  const setRecording = useCallback((recording: boolean) => {
    dispatch({ type: 'SET_RECORDING', recording });
  }, []);

  const setAudioAmplitude = useCallback((amplitude: number) => {
    dispatch({ type: 'SET_AUDIO_AMPLITUDE', amplitude });
  }, []);

  const setAudioSource = useCallback((url: string | null, bytes: string | null) => {
    dispatch({ type: 'SET_AUDIO_SOURCE', url, bytes });
  }, []);

  const clearSession = useCallback(() => {
    dispatch({ type: 'CLEAR_SESSION' });
  }, []);

  return (
    <SessionContext.Provider
      value={{
        state,
        startSession,
        sendVoiceTurn,
        sendTextMessage,
        setLumiState,
        setRecording,
        setAudioAmplitude,
        setAudioSource,
        clearSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
