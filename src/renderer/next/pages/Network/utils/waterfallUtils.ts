import type { NetworkRequest, WaterfallData, WaterfallPhase } from '../types';

/**
 * Phase color configuration
 */
const PHASE_COLORS = {
  queueing: '#e0e0e0', // Light gray
  dns: '#ffc107', // Yellow
  connection: '#ff9800', // Orange
  ssl: '#f44336', // Red
  request: '#2196f3', // Blue
  waiting: '#03a9f4', // Light blue
  download: '#4caf50', // Green
};

/**
 * Calculate waterfall data for visualization
 */
export const calculateWaterfallData = (
  request: NetworkRequest,
  baseTime: number, // First request start time
): WaterfallData => {
  const { timing, startTime } = request;
  const startOffset = startTime - baseTime;

  const phases: WaterfallPhase[] = [];

  // Add phases in order
  if (timing.queueing > 0) {
    phases.push({
      name: 'queueing',
      duration: timing.queueing,
      color: PHASE_COLORS.queueing,
    });
  }

  if (timing.dnsLookup > 0) {
    phases.push({
      name: 'dns',
      duration: timing.dnsLookup,
      color: PHASE_COLORS.dns,
    });
  }

  if (timing.initialConnection > 0) {
    phases.push({
      name: 'connection',
      duration: timing.initialConnection,
      color: PHASE_COLORS.connection,
    });
  }

  if (timing.sslHandshake > 0) {
    phases.push({
      name: 'ssl',
      duration: timing.sslHandshake,
      color: PHASE_COLORS.ssl,
    });
  }

  if (timing.requestSent > 0) {
    phases.push({
      name: 'request',
      duration: timing.requestSent,
      color: PHASE_COLORS.request,
    });
  }

  if (timing.waiting > 0) {
    phases.push({
      name: 'waiting',
      duration: timing.waiting,
      color: PHASE_COLORS.waiting,
    });
  }

  if (timing.contentDownload > 0) {
    phases.push({
      name: 'download',
      duration: timing.contentDownload,
      color: PHASE_COLORS.download,
    });
  }

  return { startOffset, phases };
};

/**
 * Format phase name to Chinese
 */
export const formatPhaseName = (name: string): string => {
  const names: Record<string, string> = {
    queueing: '排队',
    dns: 'DNS 查询',
    connection: 'TCP 连接',
    ssl: 'SSL 握手',
    request: '发送请求',
    waiting: '等待响应',
    download: '下载内容',
  };
  return names[name] || name;
};

/**
 * Get phase colors
 */
export const getPhaseColors = () => PHASE_COLORS;
