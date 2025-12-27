import React, { useMemo } from 'react';
import { Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { NetworkRequest } from '../types';
import WaterfallCell from './WaterfallCell';
import { formatFileSize, formatTime, getFileNameFromUrl } from '../utils/formatters';

interface RequestTableProps {
  requests: NetworkRequest[];
  selectedId: string | null;
  onSelectRequest: (request: NetworkRequest) => void;
}

/**
 * Request table component with waterfall visualization
 */
const RequestTable: React.FC<RequestTableProps> = ({
  requests,
  selectedId,
  onSelectRequest,
}) => {
  // Calculate base time and max time for waterfall
  const { baseTime, maxTime } = useMemo(() => {
    if (requests.length === 0) return { baseTime: 0, maxTime: 1000 };
    
    const times = requests.map(r => r.startTime);
    const base = Math.min(...times);
    const endTimes = requests.map(r => r.endTime);
    const max = Math.max(...endTimes) - base;
    
    return { baseTime: base, maxTime: Math.max(max, 1000) };
  }, [requests]);

  // Status code color
  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'success';
    if (status >= 300 && status < 400) return 'processing';
    if (status >= 400 && status < 500) return 'warning';
    if (status >= 500) return 'error';
    return 'default';
  };

  // Method color
  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'blue',
      POST: 'green',
      PUT: 'orange',
      DELETE: 'red',
      PATCH: 'purple',
    };
    return colors[method] || 'default';
  };

  const columns: ColumnsType<NetworkRequest> = [
    {
      title: 'Name',
      dataIndex: 'url',
      key: 'name',
      width: 300,
      ellipsis: true,
      render: (url: string) => getFileNameFromUrl(url),
    },
    {
      title: 'Status',
      dataIndex: 'statusCode',
      key: 'status',
      width: 80,
      render: (status: number) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      width: 80,
      render: (method: string) => (
        <Tag color={getMethodColor(method)}>{method}</Tag>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
    },
    {
      title: 'Size',
      dataIndex: 'totalSize',
      key: 'size',
      width: 100,
      render: (size: number) => formatFileSize(size),
    },
    {
      title: 'Time',
      dataIndex: 'timing',
      key: 'time',
      width: 100,
      render: (timing) => formatTime(timing.total),
    },
    {
      title: 'Waterfall',
      key: 'waterfall',
      width: 300,
      render: (_, request) => (
        <WaterfallCell
          request={request}
          baseTime={baseTime}
          maxTime={maxTime}
          width={280}
        />
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={requests}
      rowKey="id"
      size="small"
      pagination={false}
      scroll={{ y: 'calc(100vh - 300px)' }}
      onRow={(record) => ({
        onClick: () => onSelectRequest(record),
        style: {
          cursor: 'pointer',
          backgroundColor: record.id === selectedId ? '#e6f7ff' : undefined,
        },
      })}
      virtual
    />
  );
};

export default RequestTable;
