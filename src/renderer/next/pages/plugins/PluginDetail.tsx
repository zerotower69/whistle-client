import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Descriptions,
  Tabs,
  Typography,
  Space,
  Tag,
  Alert,
  Spin,
  message,
  Divider,
} from 'antd';
import {
  ArrowLeftOutlined,
  SettingOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useWhistleSync } from '../../hooks/useWhistleSync';

const { Title, Text, Paragraph } = Typography;

interface PluginInfo {
  name: string;
  version: string;
  description?: string;
  author?: string;
  homepage?: string;
  keywords?: string[];
  enabled: boolean;
  installedVersion?: string;
  latestVersion?: string;
  dependencies?: string[];
}

/**
 * Plugin Detail Page Component
 * Displays detailed information about a specific plugin
 */
const PluginDetail: React.FC = () => {
  const { pluginName } = useParams<{ pluginName: string }>();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(true);
  const [plugin, setPlugin] = useState<PluginInfo | null>(null);
  const [activeTab, setActiveTab] = useState('about');

  // Handle plugin updates from Whistle
  const handlePluginsUpdate = React.useCallback(
    (pluginsMap: any) => {
      if (!pluginName) {
        return;
      }

      const pluginData = pluginsMap[pluginName];
      if (pluginData) {
        setPlugin({
          name: pluginName,
          ...pluginData,
          enabled: !pluginData.isDisable,
          installedVersion: pluginData.version,
          latestVersion: pluginData.version,
          description: pluginData.description || '暂无描述',
          homepage: pluginData.homepage,
          author: pluginData.author,
        });
        setLoading(false);
      } else {
        // Plugin not found in the list
        if (!loading) {
          messageApi.error(`插件 ${pluginName} 未找到`);
          setTimeout(() => navigate('/plugins'), 2000);
        }
      }
    },
    [pluginName, messageApi, navigate, loading],
  );

  // Use the Whistle sync hook to get plugin data
  useWhistleSync(handlePluginsUpdate);

  useEffect(() => {
    if (!pluginName) {
      messageApi.error('插件名称缺失');
      setTimeout(() => navigate('/plugins'), 1000);
      return;
    }

    // Request initial plugin data
    const { ipcRenderer } = window.require('electron');
    ipcRenderer.invoke('get-installed-plugins');

    // Set a timeout in case plugin data doesn't arrive
    const timeout = setTimeout(() => {
      if (loading) {
        messageApi.error('加载插件信息超时');
        navigate('/plugins');
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [pluginName, navigate, messageApi, loading]);

  const handleBack = () => {
    navigate('/plugins');
  };

  const handleTogglePlugin = async (enabled: boolean) => {
    try {
      const { ipcRenderer } = window.require('electron');
      const result = await ipcRenderer.invoke('toggle-plugin', {
        name: pluginName,
        enabled,
      });

      if (result.success) {
        setPlugin((prev) => (prev ? { ...prev, enabled } : null));
        messageApi.success(`插件已${enabled ? '启用' : '禁用'}`);
      } else {
        messageApi.error(`操作失败: ${result.error}`);
      }
    } catch (error: any) {
      messageApi.error(`操作失败: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="加载插件信息..." />
      </div>
    );
  }

  if (!plugin) {
    return (
      <div style={{ padding: '40px' }}>
        <Alert
          message="插件未找到"
          description="未找到该插件，请返回插件列表。"
          type="error"
          showIcon
          action={
            <Button size="small" onClick={handleBack}>
              返回
            </Button>
          }
        />
      </div>
    );
  }

  const tabItems = [
    {
      key: 'about',
      label: (
        <span>
          <InfoCircleOutlined /> 关于
        </span>
      ),
      children: (
        <div>
          <Descriptions bordered column={1}>
            <Descriptions.Item label="插件名称">
              <Text strong>{plugin.name}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="版本">
              <Space>
                <Tag color="blue">v{plugin.installedVersion}</Tag>
                {plugin.latestVersion && plugin.latestVersion !== plugin.installedVersion && (
                  <Tag color="warning">最新版本: v{plugin.latestVersion}</Tag>
                )}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              {plugin.enabled ? (
                <Tag color="success" icon={<CheckCircleOutlined />}>
                  已启用
                </Tag>
              ) : (
                <Tag color="default" icon={<ExclamationCircleOutlined />}>
                  已禁用
                </Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="描述">
              <Paragraph>{plugin.description || '暂无描述'}</Paragraph>
            </Descriptions.Item>
            {plugin.author && <Descriptions.Item label="作者">{plugin.author}</Descriptions.Item>}
            {plugin.homepage && (
              <Descriptions.Item label="主页">
                <a href={plugin.homepage} target="_blank" rel="noopener noreferrer">
                  {plugin.homepage}
                </a>
              </Descriptions.Item>
            )}
            {plugin.keywords && plugin.keywords.length > 0 && (
              <Descriptions.Item label="关键词">
                <Space wrap>
                  {plugin.keywords.map((keyword) => (
                    <Tag key={keyword} color="processing">
                      {keyword}
                    </Tag>
                  ))}
                </Space>
              </Descriptions.Item>
            )}
            {plugin.dependencies && plugin.dependencies.length > 0 && (
              <Descriptions.Item label="依赖">
                <Space direction="vertical">
                  {plugin.dependencies.map((dep) => (
                    <Text key={dep} code>
                      {dep}
                    </Text>
                  ))}
                </Space>
              </Descriptions.Item>
            )}
          </Descriptions>
        </div>
      ),
    },
    {
      key: 'config',
      label: (
        <span>
          <SettingOutlined /> 配置
        </span>
      ),
      children: (
        <Alert
          message="配置功能"
          description="插件配置功能正在开发中，敬请期待。"
          type="info"
          showIcon
        />
      ),
    },
    {
      key: 'logs',
      label: (
        <span>
          <FileTextOutlined /> 日志
        </span>
      ),
      children: (
        <Alert
          message="日志功能"
          description="插件日志查看功能正在开发中，敬请期待。"
          type="info"
          showIcon
        />
      ),
    },
  ];

  return (
    <div>
      {contextHolder}
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
                返回
              </Button>
              <Title level={3} style={{ margin: 0 }}>
                {plugin.name}
              </Title>
            </Space>
            <Space>
              <Button
                type={plugin.enabled ? 'default' : 'primary'}
                onClick={() => handleTogglePlugin(!plugin.enabled)}
              >
                {plugin.enabled ? '禁用插件' : '启用插件'}
              </Button>
            </Space>
          </div>

          <Divider style={{ margin: '12px 0' }} />

          {/* Tabs */}
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" />
        </Space>
      </Card>
    </div>
  );
};

export default PluginDetail;
