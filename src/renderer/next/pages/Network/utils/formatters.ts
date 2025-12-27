/**
 * Formatting utilities
 */
import byteSize from 'byte-size';

/**
 * Format file size to human-readable format
 */
export const formatFileSize = (bytes: number | undefined | null): string => {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return '0 B';
  return byteSize(bytes).toString();
};

/**
 * Format time duration to human-readable format
 */
export const formatTime = (milliseconds: number | undefined | null, precision = 2): string => {
  if (milliseconds === undefined || milliseconds === null || isNaN(milliseconds)) return '0 ms';

  if (milliseconds < 1) {
    return `${(milliseconds * 1000).toFixed(0)} μs`;
  }

  if (milliseconds < 1000) {
    return `${milliseconds.toFixed(0)} ms`;
  }

  const seconds = milliseconds / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(precision)} s`;
  }

  const minutes = seconds / 60;
  if (minutes < 60) {
    return `${minutes.toFixed(precision)} min`;
  }

  const hours = minutes / 60;
  return `${hours.toFixed(precision)} h`;
};

/**
 * Format timestamp to readable date time
 */
export const formatDateTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

/**
 * Get file name from URL
 */
export const getFileNameFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    let pathname = urlObj.pathname;

    // Remove trailing slash
    if (pathname.endsWith('/') && pathname.length > 1) {
      pathname = pathname.slice(0, -1);
    }

    const segments = pathname.split('/').filter(Boolean);
    const filename = segments[segments.length - 1];

    if (!filename) {
      return urlObj.hostname;
    }

    // If filename is a number (likely an ID), try to include the previous segment for context
    if (/^\d+$/.test(filename) && segments.length > 1) {
      return `${segments[segments.length - 2]}/${filename}`;
    }

    return filename;
  } catch {
    return url;
  }
};

/**
 * Get host from URL
 */
export const getHostFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.host;
  } catch {
    return '';
  }
};
