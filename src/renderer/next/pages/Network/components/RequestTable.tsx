import React from 'react';
import { Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { NetworkRequest } from '../types';

interface RequestTableProps {
  requests: NetworkRequest[];
  selectedId: string | null;
  onSelectRequest: (request: NetworkRequest) => void;
}

/**
 * Request list table component
 */
const RequestTable: React.FC<RequestTableProps> = ({ requests, selectedId, onSelectRequest }) => {
  const columns: ColumnsType<NetworkRequest> = [
    {
      title: 'Name',
      dataIndex: 'url',
      key: 'url',
      ellipsis: true,
      render: (url: string) => {
        try {
          const urlObj = new URL(url);
          return urlObj.pathname + urlObj.search;
        } catch {
          return url;
        }
      },
    },
    {
      title: 'Status',
      dataIndex: 'statusCode',
      key: 'statusCode',
      width: 80,
      render: (statusCode: number) => {
        let color = 'default';
        if (statusCode >= 200 && statusCode < 300) color = 'success';
        else if (statusCode >= 300 && statusCode < 400) color = 'processing';
        else if (statusCode >= 400 && statusCode < 500) color = 'warning';
        else if (statusCode >= 500) color = 'error';

        return <Tag color={color}>{statusCode}</Tag>;
      },
    },
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      width: 80,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => <span style={{ textTransform: 'lowercase' }}>{type}</span>,
    },
    {
      title: 'Size',
      dataIndex: 'totalSize',
      key: 'totalSize',
      width: 100,
      render: (size: number) => {
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
      },
    },
    {
      title: 'Time',
      dataIndex: 'timing',
      key: 'timing',
      width: 100,
      render: (timing: NetworkRequest['timing']) => `${timing.total.toFixed(0)}ms`,
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={requests}
      rowKey="id"
      size="small"
      pagination={false}
      scroll={{ y: 'calc(100vh - 280px)' }}
      onRow={(record) => ({
        onClick: () => onSelectRequest(record),
        style: {
          cursor: 'pointer',
          backgroundColor: record.id === selectedId ? '#e6f7ff' : undefined,
        },
      })}
    />
  );
};

export default RequestTable;
