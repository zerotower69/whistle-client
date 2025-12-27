import React from 'react';
import { Card, Typography, Empty } from 'antd';
import { DatabaseOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

/**
 * 值管理页面（占位）
 * 用于管理 Whistle 规则中使用的变量和值
 */
const Values: React.FC = () => {
  return (
    <div>
      <Card size="small">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div>
              <Paragraph>值管理功能开发中...</Paragraph>
              <Paragraph type="secondary">
                此页面将用于管理 Whistle 规则中使用的键值对数据，支持模拟响应、注入数据等功能。
              </Paragraph>
            </div>
          }
        />
      </Card>
    </div>
  );
};

export default Values;
