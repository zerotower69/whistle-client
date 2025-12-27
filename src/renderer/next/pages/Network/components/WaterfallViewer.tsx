import React, { useEffect, useRef, memo } from 'react';
import { fromHar } from 'perf-cascade';
import type { Har } from 'har-format';
import 'perf-cascade/dist/perf-cascade.css';

interface WaterfallViewerProps {
  /** HAR format request data */
  harData: Har;
  /** Container height */
  height?: number | string;
  /** Selected request ID */
  selectedId?: string | null;
  /** Callback when request is selected */
  onRequestSelect?: (requestId: string) => void;
}

/**
 * Waterfall visualization component
 * Uses perf-cascade to render Chrome DevTools style waterfall
 */
const WaterfallViewerComponent: React.FC<WaterfallViewerProps> = ({
  harData,
  height = '100%',
  selectedId,
  onRequestSelect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !harData || !harData.log.entries.length) {
      return;
    }

    const renderWaterfall = () => {
      if (!containerRef.current) return;
      
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
          leftColumnWidth: 20,

          // Row height (pixels)
          rowHeight: 23,
        });

        // Add to container
        containerRef.current.appendChild(perfCascadeSvg);

        // Add click event listeners
        const rows = perfCascadeSvg.querySelectorAll('.row-item');
        rows.forEach((row, index) => {
          const entry = harData.log.entries[index];
          const requestId = entry?.startedDateTime || String(index);

          // Highlight selected row
          if (selectedId && requestId === selectedId) {
            (row as HTMLElement).style.backgroundColor = 'rgba(24, 144, 255, 0.2)';
          }

          if (onRequestSelect) {
            const handleClick = () => {
              onRequestSelect(requestId);
            };
            row.addEventListener('click', handleClick);
          }
        });
      } catch (error) {
        console.error('Failed to render waterfall:', error);
        if (containerRef.current) {
          containerRef.current.innerHTML =
            '<div style="padding: 20px; color: #999;">Failed to render waterfall</div>';
        }
      }
    };

    renderWaterfall();

    const observer = new ResizeObserver(() => {
      renderWaterfall();
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [harData, onRequestSelect, selectedId]);

  return (
    <div
      style={{
        width: '100%',
        height,
        overflow: 'hidden',
        backgroundColor: '#2d2d2d',
        borderBottom: '1px solid #404040',
        position: 'relative',
      }}
    >
      <style>{`
        .water-fall-chart {
          background-color: #2d2d2d !important;
          color: #eee !important;
        }
        .water-fall-chart text {
          fill: #eee !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        .water-fall-chart .label-full-bg {
          fill: #2d2d2d !important;
          opacity: 1 !important;
        }
        .water-fall-chart .label-full-url {
          fill: #eee !important;
        }
        .water-fall-chart .time-scale text {
          fill: #aaa !important;
        }
        .water-fall-chart .time-scale line {
          stroke: #444 !important;
        }
        .water-fall-chart .line-holder {
          stroke: #444 !important;
        }
        .water-fall-chart .row-item .odd {
          fill: #000 !important;
          opacity: 0.2 !important;
        }
        .water-fall-chart .row-item .even {
          fill: #fff !important;
          opacity: 0.05 !important;
        }
        .water-fall-chart .row-item:hover .odd,
        .water-fall-chart .row-item:hover .even {
          fill: #1890ff !important;
          opacity: 0.3 !important;
        }
        .water-fall-chart .left-fixed-holder {
          background-color: #2d2d2d !important;
        }
        /* Fix for perf-cascade SVG sizing */
        .water-fall-chart svg {
          display: block;
          width: 100%;
          background-color: #2d2d2d !important;
        }
      `}</style>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          overflow: 'auto',
        }}
      />
    </div>
  );
};

const WaterfallViewer = memo(WaterfallViewerComponent);
WaterfallViewer.displayName = 'WaterfallViewer';

export default WaterfallViewer;
