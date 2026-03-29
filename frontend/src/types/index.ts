export type ClarityMode = 'grounding' | 'structuring' | 'guidance';
export type LumiState = 'idle' | 'listening' | 'processing' | 'speaking' | 'grounding' | 'crisis';

export interface TenseFeatures {
  past_count: number;
  present_count: number;
  future_count: number;
  past_ratio: number;
  present_ratio: number;
  future_ratio: number;
  future_absent: boolean;
  explanation: string;
}

export interface RuminationFeatures {
  repeated_phrases: string[];
  repetition_ratio: number;
  repeated_turn_count: number;
  explanation: string;
}

export interface ValenceFeatures {
  negative_word_count: number;
  positive_word_count: number;
  negative_word_ratio: number;
  positive_word_ratio: number;
  valence_balance: number;
  explanation: string;
}

export interface ExplainableSignals {
  tense: TenseFeatures;
  rumination: RuminationFeatures;
  valence: ValenceFeatures;
}

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
  indicator_scores: Record<string, number>;
  explainable_signals: ExplainableSignals;
}

export interface ChatMessageResponse {
  turn_id: string;
  ai_message: string;
  clarity_score: number;
  clarity_mode: ClarityMode;
  crisis_flag: boolean;
  linguistic_signals: Record<string, unknown>;
  indicator_scores: Record<string, number>;
  explainable_signals: ExplainableSignals;
}

export interface BriefResponse {
  brief_id: string;
  student_id: string;
  generated_at: string;
  period_start?: string | null;
  period_end?: string | null;
  session_count: number;
  sections: Record<string, unknown>;
  status: string;
  crisis_flagged: boolean;
}

export interface KeystrokeSignals {
  backspace_rate: number;
  typing_rhythm_std_dev_ms: number;
  pre_send_pause_ms: number;
  message_abandoned_count: number;
}
