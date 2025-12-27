import React from 'react';
import { Card, Typography, Empty } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

/**
 * 规则管理页面（占位）
 * 用于管理 Whistle 代理规则
 */
const Rules: React.FC = () => {
  return (
    <div>
      <Card size="small">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div>
              <Paragraph>规则管理功能开发中...</Paragraph>
              <Paragraph type="secondary">
                此页面将用于配置和管理 Whistle 的代理规则，支持域名匹配、路径重写等功能。
              </Paragraph>
            </div>
          }
        />
      </Card>
    </div>
  );
};

export default Rules;
