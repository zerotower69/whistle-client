import React from 'react';
import { Descriptions, Empty } from 'antd';
import type { NetworkRequest } from '../../types';
import { formatFileSize, formatDateTime, formatTime } from '../../utils/formatters';

interface OverviewTabProps {
  request: NetworkRequest | null;
}

/**
 * Overview tab showing general request information
 */
const OverviewTab: React.FC<OverviewTabProps> = ({ request }) => {
  if (!request) {
    return <Empty description="请选择一个请求" />;
  }

  return (
    <div style={{ padding: 16 }}>
      <Descriptions title="General" bordered column={1} size="small">
        <Descriptions.Item label="Request URL">{request.url}</Descriptions.Item>
        <Descriptions.Item label="Request Method">{request.method}</Descriptions.Item>
        <Descriptions.Item label="Status Code">
          {request.statusCode} {request.statusText}
        </Descriptions.Item>
        {request.remoteIP && (
          <Descriptions.Item label="Remote Address">{request.remoteIP}</Descriptions.Item>
        )}
        <Descriptions.Item label="Protocol">{request.protocol}</Descriptions.Item>
      </Descriptions>

      <Descriptions title="Timing" bordered column={1} size="small" style={{ marginTop: 16 }}>
        {request.timing && request.timing.queueing > 0 && (
          <Descriptions.Item label="Queueing">
            {formatTime(request.timing.queueing)}
          </Descriptions.Item>
        )}
        {request.timing && request.timing.dnsLookup > 0 && (
          <Descriptions.Item label="DNS Lookup">
            {formatTime(request.timing.dnsLookup)}
          </Descriptions.Item>
        )}
        {request.timing && request.timing.initialConnection > 0 && (
          <Descriptions.Item label="Initial Connection">
            {formatTime(request.timing.initialConnection)}
          </Descriptions.Item>
        )}
        {request.timing && request.timing.sslHandshake > 0 && (
          <Descriptions.Item label="SSL/TLS">
            {formatTime(request.timing.sslHandshake)}
          </Descriptions.Item>
        )}
        {request.timing && request.timing.requestSent > 0 && (
          <Descriptions.Item label="Request Sent">
            {formatTime(request.timing.requestSent)}
          </Descriptions.Item>
        )}
        {request.timing && request.timing.waiting > 0 && (
          <Descriptions.Item label="Waiting (TTFB)">
            {formatTime(request.timing.waiting)}
          </Descriptions.Item>
        )}
        {request.timing && request.timing.contentDownload > 0 && (
          <Descriptions.Item label="Content Download">
            {formatTime(request.timing.contentDownload)}
          </Descriptions.Item>
        )}
        {request.timing && (
          <Descriptions.Item label="Total">{formatTime(request.timing.total)}</Descriptions.Item>
        )}
      </Descriptions>

      <Descriptions title="Size" bordered column={1} size="small" style={{ marginTop: 16 }}>
        <Descriptions.Item label="Request Size">
          {formatFileSize(request.requestSize)}
        </Descriptions.Item>
        <Descriptions.Item label="Response Size">
          {formatFileSize(request.responseSize)}
        </Descriptions.Item>
        <Descriptions.Item label="Total Size">
          {formatFileSize(request.totalSize)}
        </Descriptions.Item>
      </Descriptions>

      <Descriptions title="Time" bordered column={1} size="small" style={{ marginTop: 16 }}>
        <Descriptions.Item label="Started">{formatDateTime(request.startTime)}</Descriptions.Item>
        <Descriptions.Item label="Finished">{formatDateTime(request.endTime)}</Descriptions.Item>
      </Descriptions>
    </div>
  );
};

export default OverviewTab;
