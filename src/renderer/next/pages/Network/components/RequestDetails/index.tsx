import React from 'react';
import { Tabs, Empty } from 'antd';
import type { NetworkRequest } from '../../types';
import OverviewTab from './OverviewTab';
import HeadersTab from './HeadersTab';
import RequestTab from './RequestTab';
import ResponseTab from './ResponseTab';
import RulesTab from './RulesTab';
import TimelineTab from './TimelineTab';

interface RequestDetailsProps {
  request: NetworkRequest | null;
}

/**
 * Request details panel with tabs
 */
const RequestDetails: React.FC<RequestDetailsProps> = ({ request }) => {
  if (!request) {
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
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
    <Tabs
      items={items}
      style={{ height: '100%' }}
      tabBarStyle={{ margin: 0, padding: '0 16px' }}
    />
  );
};

export default RequestDetails;
