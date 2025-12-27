import React from 'react';
import { Space, Button, Input, Select } from 'antd';
import {
  PauseCircleOutlined,
  PlayCircleOutlined,
  ClearOutlined,
  DownloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';

interface ToolbarProps {
  isPaused: boolean;
  togglePause: () => void;
  clearRequests: () => void;
  onExportHAR: () => void;
  requestCount: number;
  searchText: string;
  setSearchText: (text: string) => void;
  typeFilter: string;
  setTypeFilter: (type: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
}

/**
 * Network page toolbar component
 */
const Toolbar: React.FC<ToolbarProps> = ({
  isPaused,
  togglePause,
  clearRequests,
  onExportHAR,
  requestCount,
  searchText,
  setSearchText,
  typeFilter,
  setTypeFilter,
  statusFilter,
  setStatusFilter,
}) => {
  return (
    <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
      <Space>
        <Button
          icon={isPaused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
          onClick={togglePause}
          type={isPaused ? 'primary' : 'default'}
        >
          {isPaused ? '继续' : '暂停'}
        </Button>
        <Button icon={<ClearOutlined />} onClick={clearRequests}>
          清空
        </Button>
        <Button icon={<DownloadOutlined />} onClick={onExportHAR}>
          导出 HAR
        </Button>
        <span style={{ color: '#999', marginLeft: 8 }}>共 {requestCount} 个请求</span>
      </Space>

      <Space>
        <Input
          placeholder="搜索 URL"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 200 }}
          allowClear
        />
        <Select
          value={typeFilter}
          onChange={setTypeFilter}
          style={{ width: 120 }}
          options={[
            { value: 'all', label: '所有类型' },
            { value: 'document', label: 'Document' },
            { value: 'stylesheet', label: 'CSS' },
            { value: 'script', label: 'JS' },
            { value: 'xhr', label: 'XHR' },
            { value: 'fetch', label: 'Fetch' },
            { value: 'image', label: 'Image' },
            { value: 'font', label: 'Font' },
            { value: 'media', label: 'Media' },
            { value: 'websocket', label: 'WebSocket' },
            { value: 'other', label: 'Other' },
          ]}
        />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 120 }}
          options={[
            { value: 'all', label: '所有状态' },
            { value: '2xx', label: '2xx' },
            { value: '3xx', label: '3xx' },
            { value: '4xx', label: '4xx' },
            { value: '5xx', label: '5xx' },
          ]}
        />
      </Space>
    </Space>
  );
};

export default Toolbar;
