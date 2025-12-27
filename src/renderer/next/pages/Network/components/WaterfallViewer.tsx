import React, { useEffect, useRef } from 'react';
import { fromHar } from 'perf-cascade';
import type { Har } from 'har-format';

interface WaterfallViewerProps {
  /** HAR format request data */
  harData: Har;
  /** Container height */
  height?: number;
  /** Selected request ID */
  selectedId?: string | null;
  /** Callback when request is selected */
  onRequestSelect?: (requestId: string) => void;
}

/**
 * Waterfall visualization component
 * Uses perf-cascade to render Chrome DevTools style waterfall
 */
const WaterfallViewer: React.FC<WaterfallViewerProps> = ({
  harData,
  height = 400,
  selectedId,
  onRequestSelect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !harData || !harData.log.entries.length) {
      return;
    }

    // Clear container
    containerRef.current.innerHTML = '';

    try {
      // Use perf-cascade to generate waterfall SVG
      const perfCascadeSvg = fromHar(harData, {
        // Show time scale and grid lines
        showAlignmentHelpers: true,

        // Show resource type icons
        showIndicatorIcons: true,

        // Show MIME type icons
        showMimeTypeIcon: true,

        // Left column width (percentage)
        leftColumnWith: 20,

        // Row height (pixels)
        rowHeight: 23,

        // Color theme (dark)
        colorScheme: 'dark',
      });

      // Add to container
      containerRef.current.appendChild(perfCascadeSvg);

      // Add click event listeners
      if (onRequestSelect) {
        const rows = perfCascadeSvg.querySelectorAll('.row-item');
        rows.forEach((row, index) => {
          row.addEventListener('click', () => {
            const requestId = harData.log.entries[index]?.startedDateTime || String(index);
            onRequestSelect(requestId);
          });
        });
      }
    } catch (error) {
      console.error('Failed to render waterfall:', error);
      if (containerRef.current) {
        containerRef.current.innerHTML =
          '<div style="padding: 20px; color: #999;">瀑布流渲染失败</div>';
      }
    }
  }, [harData, onRequestSelect]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height,
        overflow: 'auto',
        backgroundColor: '#2d2d2d',
        borderBottom: '1px solid #404040',
      }}
    />
  );
};

export default WaterfallViewer;
