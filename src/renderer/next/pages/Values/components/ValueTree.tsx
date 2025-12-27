import React, { useMemo } from 'react';
import { Tree, Input, Empty } from 'antd';
import { FileTextOutlined, SearchOutlined } from '@ant-design/icons';
import type { ValueItem } from '../types';

interface ValueTreeProps {
  values: ValueItem[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
}

/**
 * Left sidebar component displaying the list of values
 */
const ValueTree: React.FC<ValueTreeProps> = ({ values, selectedKey, onSelect }) => {
  const [searchText, setSearchText] = React.useState('');

  // Build tree data
  const treeData = useMemo(() => {
    const filtered = values.filter((value) =>
      value.name.toLowerCase().includes(searchText.toLowerCase()),
    );

    return filtered.map((value) => ({
      key: value.key,
      title: value.name,
      icon: <FileTextOutlined />,
      isLeaf: true,
      data: value,
    }));
  }, [values, searchText]);

  const handleSelect = (keys: React.Key[]) => {
    if (keys.length > 0) {
      onSelect(keys[0] as string);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px' }}>
        <Input
          placeholder="搜索值..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {treeData.length > 0 ? (
          <Tree
            treeData={treeData}
            selectedKeys={selectedKey ? [selectedKey] : []}
            onSelect={handleSelect}
            showIcon
          />
        ) : (
          <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>
    </div>
  );
};

export default ValueTree;
