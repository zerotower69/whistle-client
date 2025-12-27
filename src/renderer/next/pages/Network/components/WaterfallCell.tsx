import React from 'react';
import { Tooltip } from 'antd';
import type { NetworkRequest } from '../types';
import { calculateWaterfallData, formatPhaseName } from '../utils/waterfallUtils';

interface WaterfallCellProps {
  request: NetworkRequest;
  baseTime: number; // First request start time
  maxTime: number; // Maximum time range (for calculating scale)
  width?: number; // Waterfall column width
}

/**
 * Waterfall cell component for visualizing request timing
 */
const WaterfallCell: React.FC<WaterfallCellProps> = ({
  request,
  baseTime,
  maxTime,
  width = 300,
}) => {
  const waterfall = calculateWaterfallData(request, baseTime);
  const { startOffset, phases } = waterfall;

  // Calculate pixel positions and widths
  const scale = width / maxTime;
  const offsetPx = startOffset * scale;

  // Generate tooltip content
  const tooltipContent = (
    <div>
      <div style={{ marginBottom: 8, fontWeight: 'bold' }}>{request.url}</div>
      {phases.map((phase, index) => (
        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span>
            <span
              style={{
                display: 'inline-block',
                width: 12,
                height: 12,
                backgroundColor: phase.color,
                marginRight: 4,
                borderRadius: 2,
              }}
            />
            {formatPhaseName(phase.name)}
          </span>
          <span>{phase.duration.toFixed(2)}ms</span>
        </div>
      ))}
      <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #fff3' }}>
        <strong>总计: {request.timing.total.toFixed(2)}ms</strong>
      </div>
    </div>
  );

  return (
    <Tooltip title={tooltipContent} placement="left">
      <div
        style={{
          position: 'relative',
          height: 20,
          width,
        }}
      >
        {/* Starting offset (empty space) */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            width: offsetPx,
            height: '100%',
          }}
        />

        {/* Phase blocks */}
        {phases.map((phase, index) => {
          const prevPhases = phases.slice(0, index);
          const prevDuration = prevPhases.reduce((sum, p) => sum + p.duration, 0);
          const left = offsetPx + prevDuration * scale;
          const phaseWidth = phase.duration * scale;

          return (
            <div
              key={index}
              style={{
                position: 'absolute',
                left,
                width: phaseWidth,
                height: '100%',
                backgroundColor: phase.color,
                borderRight: '1px solid #fff',
              }}
            />
          );
        })}
      </div>
    </Tooltip>
  );
};

export default WaterfallCell;
