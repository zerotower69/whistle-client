import React from 'react';
import { Empty, List, Tag } from 'antd';
import type { NetworkRequest } from '../../types';

interface RulesTabProps {
  request: NetworkRequest | null;
}

/**
 * Rules tab showing matched Whistle rules
 */
const RulesTab: React.FC<RulesTabProps> = ({ request }) => {
  if (!request) {
    return <Empty description="请选择一个请求" />;
  }

  if (!request.rules || request.rules.length === 0) {
    return <div style={{ padding: 16, color: '#999' }}>无匹配的 Whistle 规则</div>;
  }

  return (
    <div style={{ padding: 16 }}>
      <List
        dataSource={request.rules}
        renderItem={(rule, index) => (
          <List.Item>
            <List.Item.Meta avatar={<Tag color="blue">#{index + 1}</Tag>} description={rule} />
          </List.Item>
        )}
      />
    </div>
  );
};

export default RulesTab;
