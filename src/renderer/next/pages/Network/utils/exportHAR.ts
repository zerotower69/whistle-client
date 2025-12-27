import type { NetworkRequest } from '../types';

/**
 * HAR (HTTP Archive) format types
 */
interface HARLog {
  version: string;
  creator: {
    name: string;
    version: string;
  };
  entries: HAREntry[];
}

interface HAREntry {
  startedDateTime: string;
  time: number;
  request: {
    method: string;
    url: string;
    httpVersion: string;
    headers: Array<{ name: string; value: string }>;
    queryString: Array<{ name: string; value: string }>;
    bodySize: number;
  };
  response: {
    status: number;
    statusText: string;
    httpVersion: string;
    headers: Array<{ name: string; value: string }>;
    content: {
      size: number;
      mimeType: string;
      text?: string;
    };
    bodySize: number;
  };
  timings: {
    blocked: number;
    dns: number;
    connect: number;
    ssl: number;
    send: number;
    wait: number;
    receive: number;
  };
}

/**
 * Convert headers object to HAR format
 */
const headersToArray = (headers: Record<string, string>): Array<{ name: string; value: string }> => {
  return Object.entries(headers).map(([name, value]) => ({ name, value }));
};

/**
 * Export network requests to HAR format
 */
export const exportToHAR = (requests: NetworkRequest[]): string => {
  const entries: HAREntry[] = requests.map(request => ({
    startedDateTime: new Date(request.startTime).toISOString(),
    time: request.timing.total,
    request: {
      method: request.method,
      url: request.url,
      httpVersion: request.protocol || 'HTTP/1.1',
      headers: headersToArray(request.requestHeaders),
      queryString: [],
      bodySize: request.requestSize,
    },
    response: {
      status: request.statusCode,
      statusText: request.statusText,
      httpVersion: request.protocol || 'HTTP/1.1',
      headers: headersToArray(request.responseHeaders),
      content: {
        size: request.responseSize,
        mimeType: request.responseHeaders['content-type'] || 'text/plain',
        text: request.responseBody,
      },
      bodySize: request.responseSize,
    },
    timings: {
      blocked: request.timing.queueing,
      dns: request.timing.dnsLookup,
      connect: request.timing.initialConnection,
      ssl: request.timing.sslHandshake,
      send: request.timing.requestSent,
      wait: request.timing.waiting,
      receive: request.timing.contentDownload,
    },
  }));

  const har: HARLog = {
    version: '1.2',
    creator: {
      name: 'Whistle Client',
      version: '1.5.2',
    },
    entries,
  };

  return JSON.stringify({ log: har }, null, 2);
};

/**
 * Download HAR file
 */
export const downloadHAR = (requests: NetworkRequest[], filename = 'whistle-network.har'): void => {
  const harContent = exportToHAR(requests);
  const blob = new Blob([harContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
