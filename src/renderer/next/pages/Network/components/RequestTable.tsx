import React, { useMemo, useRef, useState, useEffect, memo } from 'react';
import { Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { NetworkRequest } from '../types';
import WaterfallCell from './WaterfallCell';
import {
  formatFileSize,
  formatTime,
  getFileNameFromUrl,
  getHostFromUrl,
} from '../utils/formatters';

interface RequestTableProps {
  requests: NetworkRequest[];
  selectedId: string | null;
  onSelectRequest: (request: NetworkRequest) => void;
}

/**
 * Request table component with waterfall visualization
 */
const RequestTableComponent: React.FC<RequestTableProps> = ({
  requests,
  selectedId,
  onSelectRequest,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState<number>(400);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Table header is usually around 40px
        const height = entry.contentRect.height - 40;
        if (height > 0) {
          setScrollY(height);
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Calculate base time and max time for waterfall
  const { baseTime, maxTime } = useMemo(() => {
    if (requests.length === 0) return { baseTime: 0, maxTime: 1000 };

    const validStartTimes = requests.map((r) => r.startTime).filter((t) => t && !isNaN(t));
    const validEndTimes = requests.map((r) => r.endTime).filter((t) => t && !isNaN(t));

    if (validStartTimes.length === 0) return { baseTime: Date.now(), maxTime: 1000 };

    const base = Math.min(...validStartTimes);
    const max = validEndTimes.length > 0 ? Math.max(...validEndTimes) - base : 1000;

    return { baseTime: base, maxTime: Math.max(max, 1000) };
  }, [requests]);

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

  const columns: ColumnsType<NetworkRequest> = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'url',
        key: 'name',
        width: 300,
        ellipsis: true,
        render: (url: string) => getFileNameFromUrl(url),
      },
      {
        title: 'Host',
        dataIndex: 'url',
        key: 'host',
        width: 150,
        ellipsis: true,
        render: (url: string) => getHostFromUrl(url),
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
        render: (method: string) => <Tag color={getMethodColor(method)}>{method}</Tag>,
      },
      {
        title: 'Type',
        dataIndex: 'type',
        key: 'type',
        width: 100,
      },
      {
        title: 'Size',
        key: 'size',
        width: 100,
        render: (_, record) => {
          const size = record.totalSize || (record.requestSize || 0) + (record.responseSize || 0);
          return formatFileSize(size);
        },
      },
      {
        title: 'Time',
        dataIndex: 'timing',
        key: 'time',
        width: 100,
        render: (timing) => formatTime(timing?.total),
      },
      {
        title: 'Waterfall',
        key: 'waterfall',
        width: 300,
        render: (_, request) => (
          <WaterfallCell request={request} baseTime={baseTime} maxTime={maxTime} width={280} />
        ),
      },
    ],
    [baseTime, maxTime],
  );

  return (
    <div ref={containerRef} style={{ height: '100%', overflow: 'hidden' }}>
      <Table
        columns={columns}
        dataSource={requests}
        rowKey="id"
        size="small"
        pagination={false}
        scroll={{ y: scrollY }}
        onRow={(record) => ({
          onClick: () => onSelectRequest(record),
          style: {
            cursor: 'pointer',
            backgroundColor: record.id === selectedId ? '#e6f7ff' : undefined,
          },
        })}
        virtual
      />
    </div>
  );
};

const RequestTable = memo(RequestTableComponent);
RequestTable.displayName = 'RequestTable';

export default RequestTable;
