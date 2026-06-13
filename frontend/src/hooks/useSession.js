import { useState, useCallback } from 'react';
import axios from 'axios';

// API base URL configuration
const API_BASE = import.meta.env.DEV ? 'http://localhost:8000/api' : '/api';

export function useSession() {
  const [sessionId, setSessionId] = useState(null);
  const [sessionConfig, setSessionConfig] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState(null);

  const startSession = useCallback(async (config) => {
    setIsStarting(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE}/session/start`, config);
      const data = response.data;
      setSessionId(data.session_id);
      setSessionConfig(data);
      return data;
    } catch (err) {
      console.error('Failed to start session:', err);
      setError(err.response?.data?.detail || err.message);
      throw err;
    } finally {
      setIsStarting(false);
    }
  }, []);

  const clearSession = useCallback(() => {
    setSessionId(null);
    setSessionConfig(null);
    setError(null);
  }, []);

  return {
    sessionId,
    sessionConfig,
    isStarting,
    error,
    startSession,
    clearSession
  };
}

// Export API_BASE for other API calls
export { API_BASE };
