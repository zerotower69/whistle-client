import type { Har } from 'har-format';

/**
 * Export HAR file
 */
export const exportHARFile = (har: Har, filename: string = 'network-requests.har'): boolean => {
  try {
    // Convert to JSON string (formatted)
    const harJson = JSON.stringify(har, null, 2);

    // Create Blob
    const blob = new Blob([harJson], { type: 'application/json' });

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;

    // Trigger download
    document.body.appendChild(a);
    a.click();

    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Failed to export HAR:', error);
    return false;
  }
};
