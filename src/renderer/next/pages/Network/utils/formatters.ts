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
export const formatTime = (milliseconds: number | undefined | null): string => {
  if (milliseconds === undefined || milliseconds === null || isNaN(milliseconds)) return '0 ms';
  if (milliseconds < 1000) return `${milliseconds.toFixed(0)} ms`;
  if (milliseconds < 60000) return `${(milliseconds / 1000).toFixed(2)} s`;
  return `${(milliseconds / 60000).toFixed(2)} min`;
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
    const pathname = urlObj.pathname;
    const segments = pathname.split('/').filter(Boolean);

    if (segments.length === 0) {
      return urlObj.hostname;
    }

    const filename = segments[segments.length - 1];

    // 如果文件名是纯数字（通常是 ID），则包含上一级路径或域名以提供更多上下文
    if (/^\d+$/.test(filename)) {
      if (segments.length > 1) {
        return `${segments[segments.length - 2]}/${filename}`;
      }
      return `${urlObj.hostname}/${filename}`;
    }

    return filename;
  } catch {
    return url;
  }
};
