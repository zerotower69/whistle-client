import { useState, useCallback, useRef, useEffect } from 'react';
import type { NetworkRequest } from '../types';

/**
 * Mock data generator for demonstration
 */
const generateMockRequest = (id: number): NetworkRequest => {
  const methods = ['GET', 'POST', 'PUT', 'DELETE'] as const;
  const types = ['document', 'script', 'stylesheet', 'xhr', 'image'] as const;
  const statuses = [200, 201, 204, 301, 302, 400, 404, 500];

  const method = methods[Math.floor(Math.random() * methods.length)];
  const type = types[Math.floor(Math.random() * types.length)];
  const status = statuses[Math.floor(Math.random() * statuses.length)];

  const baseTime = Date.now();
  const queueing = Math.random() * 10;
  const dnsLookup = Math.random() * 50;
  const initialConnection = Math.random() * 100;
  const sslHandshake = Math.random() * 150;
  const requestSent = Math.random() * 5;
  const waiting = Math.random() * 200;
  const contentDownload = Math.random() * 100;
  const total =
    queueing +
    dnsLookup +
    initialConnection +
    sslHandshake +
    requestSent +
    waiting +
    contentDownload;

  return {
    id: `req-${id}`,
    url: `https://api.example.com/data/${id}?param=${Math.random().toString(36).substring(7)}`,
    method,
    statusCode: status,
    statusText: 'OK',
    protocol: 'h2',
    type,
    requestSize: Math.floor(Math.random() * 1024),
    responseSize: Math.floor(Math.random() * 102400),
    totalSize: Math.floor(Math.random() * 103424),
    timing: {
      queueing,
      dnsLookup,
      initialConnection,
      sslHandshake,
      requestSent,
      waiting,
      contentDownload,
      total,
    },
    requestHeaders: {
      accept: 'application/json',
      'user-agent': 'Mozilla/5.0',
      'content-type': 'application/json',
    },
    responseHeaders: {
      'content-type': 'application/json',
      'cache-control': 'max-age=3600',
      server: 'nginx',
    },
    requestBody: JSON.stringify({ query: 'test' }),
    responseBody: JSON.stringify({ data: 'response', id, timestamp: Date.now() }, null, 2),
    remoteIP: '104.21.45.78:443',
    startTime: baseTime - total,
    endTime: baseTime,
  };
};

/**
 * Hook for network capture functionality
 */
export const useNetworkCapture = () => {
  const [requests, setRequests] = useState<NetworkRequest[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const requestIdCounter = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start mock data generation
  useEffect(() => {
    // Mock data generation is disabled to avoid confusion with real data.
    // To re-enable for testing, uncomment the block below.
    /*
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        requestIdCounter.current++;
        const newRequest = generateMockRequest(requestIdCounter.current);
        setRequests((prev) => [...prev, newRequest]);
        console.log(`[Network] Mock Request: ${newRequest.method} ${newRequest.url}`);
      }, 2000);
    }
    */

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused]);

  // Listen for real network sessions from Electron
  useEffect(() => {
    const { ipcRenderer } = window.require('electron');

    const handleSession = (_event: any, data: any) => {
      if (isPaused) return;

      if (data.type === 'session') {
        setRequests((prev) => [...prev, data.session]);
      } else if (data.type === 'session-update') {
        setRequests((prev) =>
          prev.map((req) => {
            if (req.id === data.id) {
              // Handle nested updates (like timing.total)
              const updatedReq = { ...req, ...data.update };
              if (data.update['timing.total'] !== undefined) {
                updatedReq.timing = {
                  ...req.timing,
                  total: data.update['timing.total'],
                };
                delete (updatedReq as any)['timing.total'];
              }
              return updatedReq;
            }
            return req;
          }),
        );
      }
    };

    ipcRenderer.on('network-session', handleSession);
    return () => {
      ipcRenderer.removeListener('network-session', handleSession);
    };
  }, [isPaused]);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const clearRequests = useCallback(() => {
    setRequests([]);
    requestIdCounter.current = 0;
  }, []);

  return {
    requests,
    isPaused,
    togglePause,
    clearRequests,
  };
};
