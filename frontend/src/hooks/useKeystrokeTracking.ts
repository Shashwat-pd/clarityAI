import { useState, useRef } from 'react';
import { KeystrokeSignals } from '../types';

interface KeystrokeEvent {
  type: 'key' | 'backspace';
  timestamp: number;
}

export const useKeystrokeTracking = () => {
  const [abandonedCount, setAbandonedCount] = useState(0);
  const keystrokes = useRef<KeystrokeEvent[]>([]);
  const lastKeystrokeTime = useRef<number | null>(null);

  const handleKeyPress = (key: string) => {
    const now = Date.now();

    if (key === 'Backspace') {
      keystrokes.current.push({ type: 'backspace', timestamp: now });
    } else {
      keystrokes.current.push({ type: 'key', timestamp: now });
    }

    lastKeystrokeTime.current = now;
  };

  const handleAbandon = () => {
    setAbandonedCount(prev => prev + 1);
    resetTracking();
  };

  const resetTracking = () => {
    keystrokes.current = [];
    lastKeystrokeTime.current = null;
  };

  const getSignals = (): KeystrokeSignals | undefined => {
    if (keystrokes.current.length === 0) {
      return undefined;
    }

    const backspaceCount = keystrokes.current.filter(k => k.type === 'backspace').length;
    const backspaceRate = backspaceCount / keystrokes.current.length;

    // Calculate typing rhythm (std dev of gaps between keystrokes)
    const gaps: number[] = [];
    for (let i = 1; i < keystrokes.current.length; i++) {
      gaps.push(keystrokes.current[i].timestamp - keystrokes.current[i - 1].timestamp);
    }

    const mean = gaps.length > 0 ? gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length : 0;
    const variance = gaps.length > 0
      ? gaps.reduce((sum, gap) => sum + Math.pow(gap - mean, 2), 0) / gaps.length
      : 0;
    const stdDev = Math.sqrt(variance);

    const preSendPause = lastKeystrokeTime.current
      ? Date.now() - lastKeystrokeTime.current
      : 0;

    return {
      backspace_rate: backspaceRate,
      typing_rhythm_std_dev_ms: stdDev,
      pre_send_pause_ms: preSendPause,
      message_abandoned_count: abandonedCount,
    };
  };

  return {
    handleKeyPress,
    handleAbandon,
    getSignals,
    resetTracking,
  };
};
