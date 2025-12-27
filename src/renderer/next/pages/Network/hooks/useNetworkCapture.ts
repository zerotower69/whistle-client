import { useState, useEffect } from 'react';
import type { NetworkRequest } from '../types';

/**
 * Hook for network capture
 * TODO: Replace with actual Whistle integration
 * This is a mock implementation for demonstration purposes
 */
export const useNetworkCapture = () => {
  const [requests, setRequests] = useState<NetworkRequest[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    // Generate some mock requests for demo
    const mockRequests: NetworkRequest[] = [
      {
        id: '1',
        url: 'https://api.example.com/data',
        method: 'GET',
        statusCode: 200,
        statusText: 'OK',
        protocol: 'HTTP/1.1',
        type: 'xhr',
        requestSize: 512,
        responseSize: 128000,
        totalSize: 128512,
        timing: {
          queueing: 10,
          dnsLookup: 20,
          initialConnection: 30,
          sslHandshake: 15,
          requestSent: 5,
          waiting: 200,
          contentDownload: 50,
          total: 330,
        },
        requestHeaders: {
          'content-type': 'application/json',
          accept: 'application/json',
        },
        responseHeaders: {
          'content-type': 'application/json',
          'content-length': '128000',
        },
        startTime: Date.now() - 330,
        endTime: Date.now(),
      },
      {
        id: '2',
        url: 'https://cdn.example.com/style.css',
        method: 'GET',
        statusCode: 304,
        statusText: 'Not Modified',
        protocol: 'HTTP/1.1',
        type: 'stylesheet',
        requestSize: 256,
        responseSize: 0,
        totalSize: 256,
        timing: {
          queueing: 5,
          dnsLookup: 0,
          initialConnection: 0,
          sslHandshake: 0,
          requestSent: 3,
          waiting: 150,
          contentDownload: 22,
          total: 180,
        },
        requestHeaders: {
          'if-none-match': '"abc123"',
        },
        responseHeaders: {
          etag: '"abc123"',
        },
        startTime: Date.now() - 500,
        endTime: Date.now() - 320,
      },
      {
        id: '3',
        url: 'https://cdn.example.com/script.js',
        method: 'GET',
        statusCode: 200,
        statusText: 'OK',
        protocol: 'HTTP/2',
        type: 'script',
        requestSize: 512,
        responseSize: 467000,
        totalSize: 467512,
        timing: {
          queueing: 15,
          dnsLookup: 25,
          initialConnection: 40,
          sslHandshake: 20,
          requestSent: 5,
          waiting: 300,
          contentDownload: 485,
          total: 890,
        },
        requestHeaders: {
          accept: 'application/javascript',
        },
        responseHeaders: {
          'content-type': 'application/javascript',
          'content-length': '467000',
        },
        startTime: Date.now() - 1200,
        endTime: Date.now() - 310,
      },
    ];

    setRequests(mockRequests);
  }, []);

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const clearRequests = () => {
    setRequests([]);
  };

  return {
    requests,
    isPaused,
    togglePause,
    clearRequests,
  };
};
