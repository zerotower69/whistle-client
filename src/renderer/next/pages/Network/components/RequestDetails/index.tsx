import React from 'react';
import { Card, Tabs, Empty, Descriptions, Typography } from 'antd';
import type { NetworkRequest } from '../../types';

const { Text, Paragraph } = Typography;

interface RequestDetailsProps {
  request: NetworkRequest | null;
}

/**
 * Request details component with tabbed interface
 */
const RequestDetails: React.FC<RequestDetailsProps> = ({ request }) => {
  if (!request) {
    return (
      <Card style={{ height: '100%' }}>
        <Empty description="请选择一个请求" />
      </Card>
    );
  }

  const items = [
    {
      key: 'overview',
      label: '概览',
      children: (
        <div style={{ padding: 16 }}>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="URL">{request.url}</Descriptions.Item>
            <Descriptions.Item label="Method">{request.method}</Descriptions.Item>
            <Descriptions.Item label="Status Code">
              {request.statusCode} {request.statusText}
            </Descriptions.Item>
            <Descriptions.Item label="Protocol">{request.protocol}</Descriptions.Item>
            <Descriptions.Item label="Type">{request.type}</Descriptions.Item>
            <Descriptions.Item label="Remote IP">{request.remoteIP || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Request Size">
              {request.requestSize > 0 ? `${request.requestSize} bytes` : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Response Size">
              {request.responseSize > 0 ? `${request.responseSize} bytes` : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Total Time">{request.timing.total}ms</Descriptions.Item>
          </Descriptions>
        </div>
      ),
    },
    {
      key: 'headers',
      label: 'Headers',
      children: (
        <div style={{ padding: 16 }}>
          <Text strong>Request Headers:</Text>
          <Descriptions column={1} size="small" bordered style={{ marginTop: 8 }}>
            {Object.entries(request.requestHeaders || {}).map(([key, value]) => (
              <Descriptions.Item key={key} label={key}>
                {value}
              </Descriptions.Item>
            ))}
          </Descriptions>
          <Text strong style={{ marginTop: 16, display: 'block' }}>
            Response Headers:
          </Text>
          <Descriptions column={1} size="small" bordered style={{ marginTop: 8 }}>
            {Object.entries(request.responseHeaders || {}).map(([key, value]) => (
              <Descriptions.Item key={key} label={key}>
                {value}
              </Descriptions.Item>
            ))}
          </Descriptions>
        </div>
      ),
    },
    {
      key: 'request',
      label: 'Request',
      children: (
        <div style={{ padding: 16 }}>
          {request.requestBody ? (
            <Paragraph>
              <pre style={{ maxHeight: 400, overflow: 'auto' }}>{request.requestBody}</pre>
            </Paragraph>
          ) : (
            <Empty description="无请求体" />
          )}
        </div>
      ),
    },
    {
      key: 'response',
      label: 'Response',
      children: (
        <div style={{ padding: 16 }}>
          {request.responseBody ? (
            <Paragraph>
              <pre style={{ maxHeight: 400, overflow: 'auto' }}>{request.responseBody}</pre>
            </Paragraph>
          ) : (
            <Empty description="无响应体" />
          )}
        </div>
      ),
    },
    {
      key: 'timing',
      label: 'Timeline',
      children: (
        <div style={{ padding: 16 }}>
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Queueing">{request.timing.queueing}ms</Descriptions.Item>
            <Descriptions.Item label="DNS Lookup">{request.timing.dnsLookup}ms</Descriptions.Item>
            <Descriptions.Item label="Initial Connection">
              {request.timing.initialConnection}ms
            </Descriptions.Item>
            <Descriptions.Item label="SSL Handshake">
              {request.timing.sslHandshake}ms
            </Descriptions.Item>
            <Descriptions.Item label="Request Sent">
              {request.timing.requestSent}ms
            </Descriptions.Item>
            <Descriptions.Item label="Waiting (TTFB)">
              {request.timing.waiting}ms
            </Descriptions.Item>
            <Descriptions.Item label="Content Download">
              {request.timing.contentDownload}ms
            </Descriptions.Item>
            <Descriptions.Item label="Total">{request.timing.total}ms</Descriptions.Item>
          </Descriptions>
        </div>
      ),
    },
    {
      key: 'rules',
      label: 'Rules',
      children: (
        <div style={{ padding: 16 }}>
          {request.rules && request.rules.length > 0 ? (
            <ul>
              {request.rules.map((rule, index) => (
                <li key={index}>{rule}</li>
              ))}
            </ul>
          ) : (
            <Empty description="无规则应用" />
          )}
        </div>
      ),
    },
  ];

  return (
    <Card style={{ height: '100%', overflow: 'auto' }} bodyStyle={{ padding: 0 }}>
      <Tabs items={items} defaultActiveKey="overview" />
    </Card>
  );
};

export default RequestDetails;
