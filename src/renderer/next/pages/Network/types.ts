/**
 * Network page type definitions
 */

/**
 * HTTP request method types
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD' | 'CONNECT' | 'TRACE';

/**
 * Resource type classification
 */
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

/**
 * Request timing information
 */
export interface RequestTiming {
  // Request phase durations in milliseconds
  queueing: number;        // Queueing time
  dnsLookup: number;       // DNS lookup
  initialConnection: number; // TCP connection
  sslHandshake: number;    // SSL/TLS handshake
  requestSent: number;     // Request sending
  waiting: number;         // Waiting for response (TTFB)
  contentDownload: number; // Content download
  
  // Computed property
  total: number;           // Total time
}

/**
 * Network request record
 */
export interface NetworkRequest {
  id: string;
  url: string;
  method: HttpMethod;
  statusCode: number;
  statusText: string;
  protocol: string;  // http/1.1, h2, h3
  type: ResourceType;
  
  // Size information
  requestSize: number;
  responseSize: number;
  totalSize: number;
  
  // Timing information
  timing: RequestTiming;
  
  // Headers
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  
  // Body
  requestBody?: string;
  responseBody?: string;
  
  // Additional information
  remoteIP?: string;
  clientIP?: string;
  rules?: string[];  // Matched Whistle rules
  error?: string;
  
  // Metadata
  startTime: number;  // Absolute timestamp
  endTime: number;
}

/**
 * Waterfall phase information
 */
export interface WaterfallPhase {
  name: 'queueing' | 'dns' | 'connection' | 'ssl' | 'request' | 'waiting' | 'download';
  duration: number;
  color: string;
}

/**
 * Waterfall data for visualization
 */
export interface WaterfallData {
  startOffset: number;  // Offset relative to first request (milliseconds)
  phases: WaterfallPhase[];
}

/**
 * Filter options
 */
export interface FilterOptions {
  searchText: string;
  methods: HttpMethod[];
  types: ResourceType[];
  statusCodes: number[];
}
