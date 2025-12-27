import React from 'react';
import { Descriptions, Empty, Typography } from 'antd';
import type { NetworkRequest } from '../../types';

const { Title } = Typography;

interface HeadersTabProps {
  request: NetworkRequest | null;
}

/**
 * Headers tab showing request and response headers
 */
const HeadersTab: React.FC<HeadersTabProps> = ({ request }) => {
  if (!request) {
    return <Empty description="请选择一个请求" />;
  }

  const requestHeaders = Object.entries(request.requestHeaders);
  const responseHeaders = Object.entries(request.responseHeaders);

  return (
    <div style={{ padding: 16, overflow: 'auto', height: '100%' }}>
      <Title level={5}>Request Headers</Title>
      <Descriptions bordered column={1} size="small" style={{ marginBottom: 24 }}>
        {requestHeaders.length > 0 ? (
          requestHeaders.map(([key, value]) => (
            <Descriptions.Item key={key} label={key}>
              {value}
            </Descriptions.Item>
          ))
        ) : (
          <Descriptions.Item label="无">No request headers</Descriptions.Item>
        )}
      </Descriptions>

      <Title level={5}>Response Headers</Title>
      <Descriptions bordered column={1} size="small">
        {responseHeaders.length > 0 ? (
          responseHeaders.map(([key, value]) => (
            <Descriptions.Item key={key} label={key}>
              {value}
            </Descriptions.Item>
          ))
        ) : (
          <Descriptions.Item label="无">No response headers</Descriptions.Item>
        )}
      </Descriptions>
    </div>
  );
};

export default HeadersTab;
