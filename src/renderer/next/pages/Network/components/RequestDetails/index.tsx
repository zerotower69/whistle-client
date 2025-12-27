import React from 'react';
import { Tabs, Empty, Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import type { NetworkRequest } from '../../types';
import OverviewTab from './OverviewTab';
import HeadersTab from './HeadersTab';
import RequestTab from './RequestTab';
import ResponseTab from './ResponseTab';
import RulesTab from './RulesTab';
import TimelineTab from './TimelineTab';

interface RequestDetailsProps {
  request: NetworkRequest | null;
  onClose?: () => void;
}

/**
 * Request details panel with tabs
 */
const RequestDetails: React.FC<RequestDetailsProps> = ({ request, onClose }) => {
  if (!request) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Empty description="请选择一个请求查看详情" />
      </div>
    );
  }

  const items = [
    {
      key: 'overview',
      label: 'Overview',
      children: <OverviewTab request={request} />,
    },
    {
      key: 'headers',
      label: 'Headers',
      children: <HeadersTab request={request} />,
    },
    {
      key: 'request',
      label: 'Request',
      children: <RequestTab request={request} />,
    },
    {
      key: 'response',
      label: 'Response',
      children: <ResponseTab request={request} />,
    },
    {
      key: 'rules',
      label: 'Rules',
      children: <RulesTab request={request} />,
    },
    {
      key: 'timeline',
      label: 'Timeline',
      children: <TimelineTab request={request} />,
    },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: '4px 16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#fafafa',
        }}
      >
        <span
          style={{
            fontWeight: 'bold',
            fontSize: '12px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '80%',
          }}
        >
          {request.url}
        </span>
        <Button
          type="text"
          size="small"
          icon={<CloseOutlined />}
          onClick={onClose}
          style={{ marginLeft: 8 }}
        />
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Tabs
          items={items}
          style={{ height: '100%' }}
          tabBarStyle={{ margin: 0, padding: '0 16px' }}
        />
      </div>
    </div>
  );
};

export default RequestDetails;
