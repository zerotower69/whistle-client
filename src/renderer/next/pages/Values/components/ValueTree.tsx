import React, { useMemo } from 'react';
import { Tree, Input, Empty } from 'antd';
import { FileTextOutlined, SearchOutlined, FolderOutlined } from '@ant-design/icons';
import type { ValueItem } from '../types';

interface ValueTreeProps {
  values: ValueItem[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  dirtyKeys?: string[];
}

/**
 * Left sidebar component displaying the list of values with grouping support
 */
const ValueTree: React.FC<ValueTreeProps> = ({ values, selectedKey, onSelect, dirtyKeys = [] }) => {
  const [searchText, setSearchText] = React.useState('');

  // Build tree data with single-level grouping support
  const treeData = useMemo(() => {
    const filtered = values.filter((value) =>
      value.name.toLowerCase().includes(searchText.toLowerCase()),
    );

    const root: any[] = [];

    filtered.forEach((value) => {
      const slashIndex = value.name.indexOf('/');
      const isDirty = dirtyKeys.includes(value.key);

      if (slashIndex !== -1) {
        // Has group (only one level)
        const groupName = value.name.substring(0, slashIndex);
        const itemName = value.name.substring(slashIndex + 1);

        let group = root.find((node) => node.title === groupName && !node.isLeaf);

        if (!group) {
          group = {
            key: `group-${groupName}`,
            title: groupName,
            icon: <FolderOutlined />,
            children: [],
            isLeaf: false,
          };
          root.push(group);
        }

        group.children.push({
          key: value.key,
          title: (
            <span style={{ position: 'relative' }}>
              {isDirty && (
                <span
                  style={{
                    color: '#ff4d4f',
                    position: 'absolute',
                    left: -8,
                    top: -4,
                    fontSize: 16,
                    fontWeight: 'bold',
                  }}
                >
                  *
                </span>
              )}
              {itemName}
            </span>
          ),
          icon: <FileTextOutlined />,
          isLeaf: true,
          data: value,
        });
      } else {
        // No group
        root.push({
          key: value.key,
          title: (
            <span style={{ position: 'relative' }}>
              {isDirty && (
                <span
                  style={{
                    color: '#ff4d4f',
                    position: 'absolute',
                    left: -8,
                    top: -4,
                    fontSize: 16,
                    fontWeight: 'bold',
                  }}
                >
                  *
                </span>
              )}
              {value.name}
            </span>
          ),
          icon: <FileTextOutlined />,
          isLeaf: true,
          data: value,
        });
      }
    });

    return root;
  }, [values, searchText, dirtyKeys]);

  const handleSelect = (keys: React.Key[], info: any) => {
    if (keys.length > 0 && info.node.isLeaf) {
      onSelect(keys[0] as string);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px 12px' }}>
        <Input
          size="small"
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
            defaultExpandAll
            blockNode
          />
        ) : (
          <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>
    </div>
  );
};

export default ValueTree;
