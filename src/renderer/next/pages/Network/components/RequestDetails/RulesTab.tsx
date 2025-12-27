import React from 'react';
import { Empty, Tag, Flex, Typography } from 'antd';
import type { NetworkRequest } from '../../types';

const { Text } = Typography;

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
      <Flex vertical gap="small">
        {request.rules.map((rule, index) => (
          <Flex key={index} align="start" gap="small" style={{ marginBottom: 8 }}>
            <Tag color="blue" style={{ marginTop: 2 }}>#{index + 1}</Tag>
            <Text style={{ flex: 1, wordBreak: 'break-all' }}>{rule}</Text>
          </Flex>
        ))}
      </Flex>
    </div>
  );
};

export default RulesTab;
