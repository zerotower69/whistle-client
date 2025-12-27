import React from 'react';
import { Card, Typography, Empty } from 'antd';
import { SettingOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

/**
 * 设置页面（占位）
 * 用于配置应用程序设置
 */
const Settings: React.FC = () => {
  return (
    <div>
      <Title level={2} className="page-title">
        <SettingOutlined /> 设置
      </Title>

      <Card>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div>
              <Paragraph>设置功能开发中...</Paragraph>
              <Paragraph type="secondary">
                此页面将用于配置应用程序的各项设置，包括代理端口、主题、语言等。
              </Paragraph>
            </div>
          }
        />
      </Card>
    </div>
  );
};

export default Settings;
