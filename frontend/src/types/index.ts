export type ClarityMode = 'grounding' | 'structuring' | 'guidance';
export type LumiState = 'idle' | 'listening' | 'processing' | 'speaking' | 'grounding' | 'crisis';

export interface Session {
  session_id: string;
  student_id: string;
  created_at: string;
  current_clarity_mode: ClarityMode;
  current_clarity_score: number;
  crisis_flag_active: boolean;
  conversation_turn_count: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface VoiceTurnResponse {
  turn_id: string;
  session_id: string;
  transcript: string;
  ai_text: string;
  audio_url?: string;
  audio_bytes?: string;
  clarity_score: number;
  clarity_mode: ClarityMode;
  crisis_flag: boolean;
}

export interface ChatMessageResponse {
  message_id: string;
  session_id: string;
  ai_response: string;
  clarity_score: number;
  clarity_mode: ClarityMode;
  crisis_flag: boolean;
}

export interface KeystrokeSignals {
  backspace_rate: number;
  typing_rhythm_std_dev_ms: number;
  pre_send_pause_ms: number;
  message_abandoned_count: number;
}
