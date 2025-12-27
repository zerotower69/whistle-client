import { useState, useEffect, useCallback } from 'react';
import type { NetworkRequest } from '../types';

/**
 * Hook for network capture
 * Listens to 'network-session' events from Electron IPC
 */
export const useNetworkCapture = () => {
  const [requests, setRequests] = useState<NetworkRequest[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const { ipcRenderer } = window.require('electron');

    const handleNetworkSession = (_event: any, data: any) => {
      if (isPaused) return;

      if (data.type === 'session') {
        setRequests((prev) => {
          // Avoid duplicates
          if (prev.some((r) => r.id === data.id)) return prev;
          return [...prev, data.session];
        });
      } else if (data.type === 'session-update') {
        setRequests((prev) => {
          return prev.map((req) => {
            if (req.id === data.id) {
              const update = data.update;
              const newReq = { ...req, ...update };

              // Handle nested timing update if it exists
              if (update.timing) {
                newReq.timing = { ...req.timing, ...update.timing };
              }

              // Handle dot notation if any (e.g. 'timing.total')
              Object.keys(update).forEach((key) => {
                if (key.includes('.')) {
                  const [parent, child] = key.split('.');
                  if (parent === 'timing' && child) {
                    newReq.timing = {
                      ...newReq.timing,
                      [child]: update[key],
                    };
                  }
                }
              });

              return newReq;
            }
            return req;
          });
        });
      }
    };

    ipcRenderer.on('network-session', handleNetworkSession);

    return () => {
      ipcRenderer.removeListener('network-session', handleNetworkSession);
    };
  }, [isPaused]);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const clearRequests = useCallback(() => {
    setRequests([]);
  }, []);

  return {
    requests,
    isPaused,
    togglePause,
    clearRequests,
  };
};
