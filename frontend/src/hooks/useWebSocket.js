import { useState, useEffect, useRef, useCallback } from 'react';

export function useWebSocket(sessionId) {
  const [messages, setMessages] = useState([]);
  const [latestMessage, setLatestMessage] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);

  const connect = useCallback(() => {
    if (!sessionId) return;

    // Auto-detect ws protocol based on http/https
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use dev server proxy (/ws) or absolute url in dev
    const wsUrl = process.env.NODE_ENV === 'development' 
      ? `ws://localhost:8000/api/ws/session/${sessionId}`
      : `${protocol}//${window.location.host}/api/ws/session/${sessionId}`;

    console.log('Connecting to WebSocket:', wsUrl);
    
    try {
      // In Vite dev mode, we proxy /api/ws. But for direct connect let's use the absolute URL.
      const url = import.meta.env.DEV ? `ws://localhost:8000/api/ws/session/${sessionId}` : `${protocol}//${window.location.host}/api/ws/session/${sessionId}`;
      
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.error) {
            setError(data.error);
            return;
          }
          setLatestMessage(data);
          setMessages(prev => [...prev, data]);
        } catch (err) {
          console.error('Failed to parse WS message:', err);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('WebSocket connection error');
        setIsConnected(false);
      };
    } catch (err) {
      setError(err.message);
    }
  }, [sessionId]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // Connect automatically if sessionId is provided
  useEffect(() => {
    if (sessionId) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [sessionId, connect, disconnect]);

  return {
    messages,
    latestMessage,
    isConnected,
    error,
    connect,
    disconnect,
    clearMessages: () => setMessages([])
  };
}
