/**
 * TypeScript type definitions for Network page
 */

export interface NetworkRequest {
  id: string;
  url: string;
  method: string;
  statusCode: number;
  statusText: string;
  protocol: string;
  type: ResourceType;

  // Size
  requestSize: number;
  responseSize: number;
  totalSize: number;

  // Timing
  timing: RequestTiming;

  // Headers
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;

  // Body
  requestBody?: string;
  responseBody?: string;

  // Other
  remoteIP?: string;
  clientIP?: string;
  rules?: string[];
  error?: string;

  // Timestamp
  startTime: number;
  endTime: number;
}

export interface RequestTiming {
  queueing: number;
  dnsLookup: number;
  initialConnection: number;
  sslHandshake: number;
  requestSent: number;
  waiting: number;
  contentDownload: number;
  total: number;
}

export type ResourceType =
  | 'document'
  | 'stylesheet'
  | 'script'
  | 'image'
  | 'font'
  | 'xhr'
  | 'fetch'
  | 'websocket'
  | 'media'
  | 'other';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | 'CONNECT' | 'TRACE';

export interface WaterfallPhase {
  name: string;
  duration: number;
  color: string;
}

export interface WaterfallData {
  startOffset: number;
  phases: WaterfallPhase[];
}
