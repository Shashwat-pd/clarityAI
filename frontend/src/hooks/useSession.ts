import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '../types';
import { ApiService } from '../services/api';

const SESSION_STORAGE_KEY = '@clarityai:session_id';

export const useSession = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to load existing session ID from storage
      const storedSessionId = await AsyncStorage.getItem(SESSION_STORAGE_KEY);

      if (storedSessionId) {
        // Try to resume existing session
        try {
          const existingSession = await ApiService.getSession(storedSessionId);
          setSession(existingSession);
          return;
        } catch (err) {
          // Session not found or expired, create new one
          console.log('Stored session not found, creating new one');
        }
      }

      // Create new session
      const newSession = await ApiService.createSession(true);
      await AsyncStorage.setItem(SESSION_STORAGE_KEY, newSession.session_id);
      setSession(newSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize session');
      console.error('Session initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    if (!session) return;
    try {
      const updatedSession = await ApiService.getSession(session.session_id);
      setSession(updatedSession);
    } catch (err) {
      console.error('Failed to refresh session:', err);
    }
  };

  const clearSession = async () => {
    try {
      await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
      setSession(null);
      await initializeSession();
    } catch (err) {
      console.error('Failed to clear session:', err);
    }
  };

  return {
    session,
    loading,
    error,
    refreshSession,
    clearSession,
  };
};
