import React from 'react';
import { Empty } from 'antd';
import type { NetworkRequest } from '../../types';
import { getPhaseColors, formatPhaseName } from '../../utils/waterfallUtils';

interface TimelineTabProps {
  request: NetworkRequest | null;
}

/**
 * Timeline tab showing request timing visualization
 */
const TimelineTab: React.FC<TimelineTabProps> = ({ request }) => {
  if (!request) {
    return <Empty description="请选择一个请求" />;
  }

  const { timing } = request;
  const colors = getPhaseColors();

  const phases = [
    { name: 'queueing', label: formatPhaseName('queueing'), duration: timing.queueing, color: colors.queueing },
    { name: 'dns', label: formatPhaseName('dns'), duration: timing.dnsLookup, color: colors.dns },
    { name: 'connection', label: formatPhaseName('connection'), duration: timing.initialConnection, color: colors.connection },
    { name: 'ssl', label: formatPhaseName('ssl'), duration: timing.sslHandshake, color: colors.ssl },
    { name: 'request', label: formatPhaseName('request'), duration: timing.requestSent, color: colors.request },
    { name: 'waiting', label: formatPhaseName('waiting'), duration: timing.waiting, color: colors.waiting },
    { name: 'download', label: formatPhaseName('download'), duration: timing.contentDownload, color: colors.download },
  ].filter(phase => phase.duration > 0);

  const maxDuration = timing.total;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h3>请求时序图</h3>
        <p style={{ color: '#999' }}>总耗时: {timing.total.toFixed(2)} ms</p>
      </div>

      <div style={{ marginBottom: 32 }}>
        {phases.map((phase, index) => {
          const percentage = (phase.duration / maxDuration) * 100;
          const prevPercentage = phases
            .slice(0, index)
            .reduce((sum, p) => sum + (p.duration / maxDuration) * 100, 0);

          return (
            <div key={phase.name} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>{phase.label}</span>
                <span>{phase.duration.toFixed(2)} ms ({percentage.toFixed(1)}%)</span>
              </div>
              <div style={{ 
                position: 'relative', 
                width: '100%', 
                height: 30, 
                backgroundColor: '#f5f5f5',
                borderRadius: 4,
              }}>
                <div
                  style={{
                    position: 'absolute',
                    left: `${prevPercentage}%`,
                    width: `${percentage}%`,
                    height: '100%',
                    backgroundColor: phase.color,
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 'bold',
                  }}
                >
                  {percentage > 10 && `${phase.duration.toFixed(0)}ms`}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 24 }}>
        <h4>时间线（按顺序）</h4>
        <div style={{ 
          position: 'relative', 
          width: '100%', 
          height: 40, 
          backgroundColor: '#f5f5f5',
          borderRadius: 4,
          overflow: 'hidden',
        }}>
          {phases.map((phase, index) => {
            const prevDuration = phases.slice(0, index).reduce((sum, p) => sum + p.duration, 0);
            const leftPercentage = (prevDuration / maxDuration) * 100;
            const widthPercentage = (phase.duration / maxDuration) * 100;

            return (
              <div
                key={phase.name}
                title={`${phase.label}: ${phase.duration.toFixed(2)}ms`}
                style={{
                  position: 'absolute',
                  left: `${leftPercentage}%`,
                  width: `${widthPercentage}%`,
                  height: '100%',
                  backgroundColor: phase.color,
                  borderRight: '1px solid #fff',
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TimelineTab;
