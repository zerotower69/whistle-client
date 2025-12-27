import type { Har, Entry, Request, Response, Timings } from 'har-format';
import type { NetworkRequest } from '../types';

/**
 * Convert NetworkRequest array to HAR format
 */
export const convertToHAR = (requests: NetworkRequest[]): Har => {
  const entries: Entry[] = requests.map((request) => {
    // Build Request object
    const harRequest: Request = {
      method: request.method,
      url: request.url,
      httpVersion: request.protocol || 'HTTP/1.1',
      headers: Object.entries(request.requestHeaders || {}).map(([name, value]) => ({
        name,
        value: String(value),
      })),
      queryString: [],
      cookies: [],
      headersSize: -1,
      bodySize: request.requestSize || 0,
    };

    // If there's a request body, add postData
    if (request.requestBody) {
      harRequest.postData = {
        mimeType: request.requestHeaders?.['content-type'] || 'text/plain',
        text: request.requestBody,
      };
    }

    // Build Response object
    const harResponse: Response = {
      status: request.statusCode,
      statusText: request.statusText || '',
      httpVersion: request.protocol || 'HTTP/1.1',
      headers: Object.entries(request.responseHeaders || {}).map(([name, value]) => ({
        name,
        value: String(value),
      })),
      cookies: [],
      content: {
        size: request.responseSize || 0,
        mimeType: request.responseHeaders?.['content-type'] || 'text/plain',
        text: request.responseBody,
      },
      redirectURL: '',
      headersSize: -1,
      bodySize: request.responseSize || 0,
    };

    // Build Timings object
    const timings: Timings = {
      blocked: request.timing?.queueing || 0,
      dns: request.timing?.dnsLookup || 0,
      connect: request.timing?.initialConnection || 0,
      send: request.timing?.requestSent || 0,
      wait: request.timing?.waiting || request.timing?.total || 0,
      receive: request.timing?.contentDownload || 0,
      ssl: request.timing?.sslHandshake || -1,
    };

    // Build Entry object
    let startedDateTime = new Date().toISOString();
    try {
      if (request.startTime) {
        startedDateTime = new Date(request.startTime).toISOString();
      }
    } catch (e) {
      console.error('Invalid start time:', request.startTime);
    }

    const entry: Entry = {
      startedDateTime,
      time: request.timing?.total || 0,
      request: harRequest,
      response: harResponse,
      cache: {},
      timings,
    };

    return entry;
  });

  // Build complete HAR object
  const har: Har = {
    log: {
      version: '1.2',
      creator: {
        name: 'Whistle Client',
        version: '1.5.2',
      },
      pages: [],
      entries,
    },
  };

  return har;
};
