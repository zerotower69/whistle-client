import React from 'react';
import { Button, Space, Input, Select, Badge } from 'antd';
import { 
  PauseCircleOutlined, 
  PlayCircleOutlined, 
  DeleteOutlined, 
  DownloadOutlined,
  SearchOutlined 
} from '@ant-design/icons';
import type { HttpMethod, ResourceType } from '../types';

const { Search } = Input;

interface ToolbarProps {
  isPaused: boolean;
  togglePause: () => void;
  clearRequests: () => void;
  exportHAR: () => void;
  requestCount: number;
  searchText: string;
  onSearchChange: (text: string) => void;
  selectedMethods: HttpMethod[];
  onMethodsChange: (methods: HttpMethod[]) => void;
  selectedTypes: ResourceType[];
  onTypesChange: (types: ResourceType[]) => void;
}

/**
 * Network toolbar component
 */
const Toolbar: React.FC<ToolbarProps> = ({
  isPaused,
  togglePause,
  clearRequests,
  exportHAR,
  requestCount,
  searchText,
  onSearchChange,
  selectedMethods,
  onMethodsChange,
  selectedTypes,
  onTypesChange,
}) => {
  const methodOptions: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];
  const typeOptions: ResourceType[] = ['document', 'stylesheet', 'script', 'image', 'font', 'xhr', 'fetch', 'websocket', 'media', 'other'];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, height: '100%' }}>
      <Space>
        <Button
          icon={isPaused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
          onClick={togglePause}
        >
          {isPaused ? '恢复' : '暂停'}
        </Button>
        <Button icon={<DeleteOutlined />} onClick={clearRequests}>
          清空
        </Button>
        <Button icon={<DownloadOutlined />} onClick={exportHAR}>
          导出 HAR
        </Button>
      </Space>

      <Badge count={requestCount} showZero overflowCount={9999}>
        <span style={{ padding: '0 12px' }}>请求</span>
      </Badge>

      <Search
        placeholder="搜索 URL"
        value={searchText}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{ width: 300 }}
        prefix={<SearchOutlined />}
      />

      <Select
        mode="multiple"
        placeholder="方法过滤"
        value={selectedMethods}
        onChange={onMethodsChange}
        style={{ width: 200 }}
        options={methodOptions.map(m => ({ label: m, value: m }))}
      />

      <Select
        mode="multiple"
        placeholder="类型过滤"
        value={selectedTypes}
        onChange={onTypesChange}
        style={{ width: 200 }}
        options={typeOptions.map(t => ({ label: t, value: t }))}
      />
    </div>
  );
};

export default Toolbar;
