import React from 'react';
import { Card, Typography, Empty } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

/**
 * 网络监控页面（占位）
 * 用于监控和分析 HTTP/HTTPS 请求
 */
const Network: React.FC = () => {
  return (
    <div>
      <Title level={2} className="page-title">
        <GlobalOutlined /> 网络监控
      </Title>

      <Card>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div>
              <Paragraph>网络监控功能开发中...</Paragraph>
              <Paragraph type="secondary">
                此页面将用于实时监控和分析所有通过 Whistle 代理的网络请求。
              </Paragraph>
            </div>
          }
        />
      </Card>
    </div>
  );
};

export default Network;
