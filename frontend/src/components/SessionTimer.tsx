import React, { useState, useEffect, useRef } from 'react';
import { Text, StyleSheet } from 'react-native';

interface SessionTimerProps {
  startTime?: string;
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const SessionTimer: React.FC<SessionTimerProps> = ({ startTime }) => {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!startTime) return;

    const start = new Date(startTime).getTime();

    const tick = () => {
      const now = Date.now();
      setElapsed(Math.floor((now - start) / 1000));
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startTime]);

  if (!startTime) return null;

  return <Text style={styles.timer}>{formatElapsed(elapsed)}</Text>;
};

const styles = StyleSheet.create({
  timer: {
    fontSize: 13,
    fontWeight: '400',
    color: '#8BA49F',
    lineHeight: 13 * 1.4,
  },
});

export default SessionTimer;
