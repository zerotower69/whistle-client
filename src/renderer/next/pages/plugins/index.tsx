import React, { useState, useEffect, useCallback } from 'react';
import './index.css';
import { useWhistleSync } from '../../hooks/useWhistleSync';
import {
  Card,
  Button,
  Flex,
  Input,
  Space,
  Divider,
  Typography,
  Form,
  Select,
  message,
  Modal,
  Tag,
  Tooltip,
  Row,
  Col,
  Statistic,
  Empty,
  Switch,
  Popconfirm,
  Badge,
  Alert,
} from 'antd';
import {
  DownloadOutlined,
  SearchOutlined,
  ReloadOutlined,
  DeleteOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  AppstoreOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// 模拟插件数据类型
interface Plugin {
  name: string;
  version: string;
  description?: string;
  author?: string;
  homepage?: string;
  keywords?: string[];
  installed: boolean;
  enabled: boolean;
  installedVersion?: string;
  latestVersion?: string;
  lastUpdated?: string;
  dependencies?: string[];
}

// 预设的 npm 镜像源
const DEFAULT_REGISTRIES = [
  { label: 'npm 官方镜像', value: 'https://registry.npmjs.org/' },
  { label: '淘宝镜像', value: 'https://registry.npmmirror.com/' },
  { label: '华为云镜像', value: 'https://repo.huaweicloud.com/repository/npm/' },
  { label: '腾讯云镜像', value: 'https://mirrors.cloud.tencent.com/npm/' },
];

const Plugins: React.FC = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // 状态管理
  const [installedPlugins, setInstalledPlugins] = useState<Plugin[]>([]);
  const [searchResults, setSearchResults] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [installModal, setInstallModal] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegistry, setSelectedRegistry] = useState(DEFAULT_REGISTRIES[0].value);
  const [registryHistory, setRegistryHistory] = useState<string[]>([]);
  const [globalPluginsEnabled, setGlobalPluginsEnabled] = useState(true);
  const [checkingUpdate, setCheckingUpdate] = useState<Record<string, boolean>>({});

  // 处理插件列表更新
  const handlePluginsList = useCallback((pluginsMap: any, disabledAllPlugins?: boolean) => {
    if (disabledAllPlugins !== undefined) {
      setGlobalPluginsEnabled(!disabledAllPlugins);
    }
    const list = Object.keys(pluginsMap).map((key) => {
      const p = pluginsMap[key];
      return {
        ...p,
        name: key,
        enabled: !p.isDisable,
        installed: true,
        installedVersion: p.version,
        latestVersion: p.version,
        description: p.description || '暂无描述',
        homepage: p.homepage,
        author: p.author,
      };
    });
    setInstalledPlugins(list);
    setLoading(false);
  }, []);

  // 使用自定义 Hook 处理同步
  const { waitForPluginUpdate, cancelWaiting } = useWhistleSync(handlePluginsList);

  useEffect(() => {
    loadRegistryHistory();
    const { ipcRenderer } = window.require('electron');

    // 加载保存的镜像源
    const loadSavedRegistry = async () => {
      try {
        const savedRegistry = await ipcRenderer.invoke('get-setting', 'pluginRegistry');
        if (savedRegistry) {
          setSelectedRegistry(savedRegistry);
          form.setFieldsValue({ registry: savedRegistry });
        }
      } catch (error) {
        console.error('Failed to load saved registry:', error);
      }
    };
    loadSavedRegistry();

    loadInstalledPlugins();
  }, []);

  // 监听快捷键 Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalVisible(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadInstalledPlugins = () => {
    setLoading(true);
    const { ipcRenderer } = window.require('electron');
    ipcRenderer.invoke('get-installed-plugins');
  };

  const loadRegistryHistory = () => {
    // 从本地存储加载镜像源历史
    const history = JSON.parse(localStorage.getItem('registryHistory') || '[]');
    setRegistryHistory(history);
  };

  const saveRegistryHistory = (registry: string) => {
    const history = [...new Set([registry, ...registryHistory])].slice(0, 10);
    setRegistryHistory(history);
    localStorage.setItem('registryHistory', JSON.stringify(history));
  };

  // 安装插件
  const handleInstallPlugins = async (values: any) => {
    const { plugins, registry } = values;
    if (!plugins?.trim()) {
      messageApi.error('请输入要安装的插件名称');
      return;
    }

    setLoading(true);
    try {
      // 解析插件名称（支持多个插件，空格或换行分隔）
      const pluginNames = plugins
        .split(/[\s\n,]+/)
        .filter((name: string) => name.trim())
        .map((name: string) => name.trim());

      if (pluginNames.length === 0) {
        messageApi.error('请输入有效的插件名称');
        return;
      }

      // 保存镜像源到历史记录
      if (registry) {
        saveRegistryHistory(registry);
        handleRegistryChange(registry); // 使用通用的保存逻辑
      }

      // 向主进程发送安装请求
      const { ipcRenderer } = window.require('electron');
      const installData = {
        pkgs: pluginNames.map((name: string) => ({ name })),
        registry: registry || selectedRegistry,
      };

      messageApi.info(`正在安装插件: ${pluginNames.join(', ')}...`);

      // 先准备好等待状态同步的 Promise
      const updatePromise = waitForPluginUpdate();

      // 调用主进程的插件安装方法
      const result = await ipcRenderer.invoke('install-plugins', installData);

      if (result.success) {
        // 等待 Whistle 状态同步过来
        await updatePromise;
        messageApi.success(`插件安装成功: ${pluginNames.join(', ')}`);
        form.resetFields();
        setInstallModal(false);
      } else {
        // 如果失败了，清除等待状态
        cancelWaiting();
        messageApi.error(`插件安装失败: ${result.error}`);
      }
    } catch (error: any) {
      messageApi.error(`插件安装失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 卸载插件
  const handleUninstallPlugin = async (pluginName: string) => {
    setLoading(true);
    try {
      // 向主进程发送卸载请求
      const { ipcRenderer } = window.require('electron');
      const updatePromise = waitForPluginUpdate();
      const result = await ipcRenderer.invoke('uninstall-plugin', pluginName);

      if (result.success) {
        await updatePromise;
        messageApi.success(`插件 ${pluginName} 卸载成功`);
      } else {
        cancelWaiting();
        messageApi.error(`插件卸载失败: ${result.error}`);
      }
    } catch (error: any) {
      messageApi.error(`插件卸载失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 启用/禁用插件
  const handleTogglePlugin = async (pluginName: string, enabled: boolean) => {
    try {
      const { ipcRenderer } = window.require('electron');
      const result = await ipcRenderer.invoke('toggle-plugin', { name: pluginName, enabled });

      if (result.success) {
        setInstalledPlugins((prev) =>
          prev.map((p) => (p.name === pluginName ? { ...p, enabled } : p)),
        );
        messageApi.success(`插件 ${pluginName} 已${enabled ? '启用' : '禁用'}`);
      } else {
        messageApi.error(`操作失败: ${result.error}`);
      }
    } catch (error: any) {
      messageApi.error(`操作失败: ${error.message}`);
    }
  };

  // 刷新插件列表
  const handleRefreshPlugins = () => {
    setLoading(true);
    try {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('refresh-plugins');
      loadInstalledPlugins();
      messageApi.success('插件列表已刷新');
    } catch (error: any) {
      messageApi.error(`刷新失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 全局启用/禁用所有插件
  // 切换镜像源并保存
  const handleRegistryChange = async (value: string) => {
    setSelectedRegistry(value);
    form.setFieldsValue({ registry: value });
    try {
      const { ipcRenderer } = window.require('electron');
      await ipcRenderer.invoke('set-setting', { key: 'pluginRegistry', value });
    } catch (error) {
      console.error('Failed to save registry:', error);
    }
  };

  const handleToggleAllPlugins = (enabled: boolean) => {
    setGlobalPluginsEnabled(enabled);
    try {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send(enabled ? 'enableAllPlugins' : 'disableAllPlugins');
      messageApi.success(`已${enabled ? '启用' : '禁用'}所有插件`);
    } catch (error: any) {
      messageApi.error(`操作失败: ${error.message}`);
    }
  };

  // 搜索插件
  const handleSearchPlugins = async () => {
    if (!searchTerm.trim()) {
      messageApi.warning('请输入搜索关键词');
      return;
    }

    setSearchLoading(true);
    try {
      const { ipcRenderer } = window.require('electron');
      const result = await ipcRenderer.invoke('search-plugins', {
        query: searchTerm,
        registry: selectedRegistry,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      const data = result.data;
      const results = data.objects.map((obj: any) => ({
        name: obj.package.name,
        version: obj.package.version,
        description: obj.package.description,
        author: obj.package.author?.name,
        keywords: obj.package.keywords,
        homepage: obj.package.links?.homepage,
        installed: installedPlugins.some((p) => p.name === obj.package.name),
        enabled: false,
      }));

      setSearchResults(results);
    } catch (error: any) {
      messageApi.error(`搜索失败: ${error.message}`);
    } finally {
      setSearchLoading(false);
    }
  };

  // 检查更新
  const handleCheckUpdate = async (pluginName: string) => {
    setCheckingUpdate((prev) => ({ ...prev, [pluginName]: true }));
    try {
      const { ipcRenderer } = window.require('electron');
      const result = await ipcRenderer.invoke('check-plugin-update', {
        name: pluginName,
        registry: selectedRegistry,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      const latestVersion = result.latestVersion;

      setInstalledPlugins((prev) =>
        prev.map((p) => (p.name === pluginName ? { ...p, latestVersion } : p)),
      );

      if (latestVersion !== installedPlugins.find((p) => p.name === pluginName)?.installedVersion) {
        messageApi.info(`插件 ${pluginName} 有新版本: ${latestVersion}`);
      } else {
        messageApi.success(`插件 ${pluginName} 已是最新版本`);
      }
    } catch (error: any) {
      messageApi.error(`检查更新失败: ${error.message}`);
    } finally {
      setCheckingUpdate((prev) => ({ ...prev, [pluginName]: false }));
    }
  };

  // 更新插件
  const handleUpdatePlugin = async (pluginName: string) => {
    setLoading(true);
    try {
      const { ipcRenderer } = window.require('electron');
      const installData = {
        pkgs: [{ name: pluginName }],
        registry: selectedRegistry,
      };

      messageApi.info(`正在更新插件: ${pluginName}...`);
      const updatePromise = waitForPluginUpdate();
      const result = await ipcRenderer.invoke('install-plugins', installData);

      if (result.success) {
        await updatePromise;
        messageApi.success(`插件 ${pluginName} 更新成功`);
      } else {
        cancelWaiting();
        messageApi.error(`插件更新失败: ${result.error}`);
      }
    } catch (error: any) {
      messageApi.error(`插件更新失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const installedCount = installedPlugins.length;
  const enabledCount = installedPlugins.filter((p) => p.enabled).length;
  const availableUpdates = installedPlugins.filter(
    (p) => p.latestVersion && p.latestVersion !== p.installedVersion,
  ).length;

  return (
    <div>
      {contextHolder}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <Space size="small">
          <Tooltip title="全局启用/禁用所有插件">
            <Switch
              checkedChildren="已启用"
              unCheckedChildren="已禁用"
              checked={globalPluginsEnabled}
              onChange={handleToggleAllPlugins}
            />
          </Tooltip>

          <Button icon={<ReloadOutlined />} onClick={handleRefreshPlugins} loading={loading}>
            刷新
          </Button>

          <Button type="primary" icon={<PlusOutlined />} onClick={() => setInstallModal(true)}>
            安装插件
          </Button>

          <Tooltip
            title={`搜索插件 (${window.navigator.platform.includes('Mac') ? '⌘K' : 'Ctrl+K'})`}
          >
            <Button icon={<SearchOutlined />} onClick={() => setSearchModalVisible(true)}>
              搜索插件
            </Button>
          </Tooltip>
        </Space>
      </div>

      <div>
        {/* 统计信息卡片 */}
        <div className="stats-cards">
          <Row gutter={16} style={{ display: 'flex', alignItems: 'stretch' }}>
            <Col span={6}>
              <Card style={{ height: '100%' }}>
                <Statistic
                  title="已安装插件"
                  value={installedCount}
                  prefix={<AppstoreOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card style={{ height: '100%' }}>
                <Statistic
                  title="已启用插件"
                  value={enabledCount}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card style={{ height: '100%' }}>
                <Statistic
                  title="可更新插件"
                  value={availableUpdates}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card style={{ height: '100%' }}>
                <div style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: 14, marginBottom: 4 }}>
                  镜像源
                </div>
                <div style={{ display: 'flex', alignItems: 'center', height: 38 }}>
                  <GlobalOutlined style={{ color: '#722ed1', fontSize: 24, marginRight: 8 }} />
                  <Select
                    value={selectedRegistry}
                    onChange={handleRegistryChange}
                    variant="borderless"
                    showSearch
                    placeholder="选择镜像源"
                    style={{
                      flex: 1,
                      marginLeft: -11,
                      color: '#722ed1',
                      fontWeight: 'bold',
                      fontSize: 24,
                    }}
                    popupMatchSelectWidth={false}
                  >
                    {DEFAULT_REGISTRIES.map((reg) => (
                      <Option key={reg.value} value={reg.value}>
                        {reg.label}
                      </Option>
                    ))}
                    {registryHistory
                      .filter((url) => !DEFAULT_REGISTRIES.some((r) => r.value === url))
                      .map((url) => (
                        <Option key={url} value={url}>
                          {url}
                        </Option>
                      ))}
                  </Select>
                </div>
              </Card>
            </Col>
          </Row>
        </div>

        {/* 已安装插件列表 */}
        <Card
          title={`已安装插件 (${installedCount})`}
          extra={
            <Space>
              {availableUpdates > 0 && (
                <Badge count={availableUpdates} offset={[10, 0]}>
                  <Button size="small" type="link">
                    有更新可用
                  </Button>
                </Badge>
              )}
            </Space>
          }
        >
          {installedPlugins.length === 0 ? (
            <Empty
              className="empty-state"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无已安装的插件"
            >
              <Button type="primary" onClick={() => setInstallModal(true)}>
                安装第一个插件
              </Button>
            </Empty>
          ) : (
            <Flex vertical gap="middle">
              {installedPlugins.map((plugin) => (
                <Card
                  key={plugin.name}
                  className="plugin-card"
                  size="small"
                  actions={[
                    <Switch
                      key="toggle"
                      size="small"
                      checked={plugin.enabled}
                      onChange={(enabled) => handleTogglePlugin(plugin.name, enabled)}
                      disabled={!globalPluginsEnabled}
                    />,
                    <Tooltip key="settings" title="插件设置">
                      <Button size="small" icon={<SettingOutlined />} type="text" />
                    </Tooltip>,
                    <Button
                      key="check-update"
                      size="small"
                      type="link"
                      loading={checkingUpdate[plugin.name]}
                      onClick={() => handleCheckUpdate(plugin.name)}
                    >
                      检查更新
                    </Button>,
                    plugin.latestVersion && plugin.latestVersion !== plugin.installedVersion ? (
                      <Button
                        key="update"
                        size="small"
                        type="primary"
                        onClick={() => handleUpdatePlugin(plugin.name)}
                      >
                        更新到 v{plugin.latestVersion}
                      </Button>
                    ) : plugin.latestVersion === plugin.installedVersion ? (
                      <Text key="latest" type="secondary" style={{ fontSize: '12px' }}>
                        已是最新版本
                      </Text>
                    ) : null,
                    <Popconfirm
                      key="delete"
                      title="确定要卸载这个插件吗？"
                      onConfirm={() => handleUninstallPlugin(plugin.name)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button size="small" danger icon={<DeleteOutlined />} type="text" />
                    </Popconfirm>,
                  ]}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                        <Text strong style={{ fontSize: 16, marginRight: 8 }}>
                          {plugin.name}
                        </Text>
                        <Space size={4}>
                          {plugin.enabled ? (
                            <Tag color="success" icon={<CheckCircleOutlined />}>
                              已启用
                            </Tag>
                          ) : (
                            <Tag color="default">已禁用</Tag>
                          )}
                          {plugin.latestVersion &&
                            plugin.latestVersion !== plugin.installedVersion && (
                              <Tag color="warning" icon={<ExclamationCircleOutlined />}>
                                有更新
                              </Tag>
                            )}
                        </Space>
                      </div>
                      <div>
                        <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 8 }}>
                          {plugin.description || '暂无描述'}
                        </Paragraph>
                        <div className="plugin-meta">
                          <Space separator={<Divider type="vertical" />}>
                            <Text type="secondary">版本: {plugin.installedVersion}</Text>
                            {plugin.latestVersion &&
                              plugin.latestVersion !== plugin.installedVersion && (
                                <Text type="warning">最新: {plugin.latestVersion}</Text>
                              )}
                            {plugin.lastUpdated && (
                              <Text type="secondary">更新: {plugin.lastUpdated}</Text>
                            )}
                            {plugin.author && <Text type="secondary">作者: {plugin.author}</Text>}
                          </Space>
                        </div>
                        {plugin.keywords && (
                          <div style={{ marginTop: 8 }}>
                            <Space size={[0, 4]} wrap>
                              {plugin.keywords.map((keyword: string) => (
                                <Tag key={keyword} style={{ fontSize: '11px' }}>
                                  {keyword}
                                </Tag>
                              ))}
                            </Space>
                          </div>
                        )}
                      </div>
                    </div>
                    {plugin.homepage && (
                      <Tooltip title="查看主页">
                        <Button
                          type="text"
                          icon={<GlobalOutlined />}
                          onClick={() => window.open(plugin.homepage)}
                        />
                      </Tooltip>
                    )}
                  </div>
                </Card>
              ))}
            </Flex>
          )}
        </Card>

        {/* 安装插件弹窗 */}
        <Modal
          title="安装插件"
          open={installModal}
          onCancel={() => setInstallModal(false)}
          footer={null}
          width={600}
          forceRender
        >
          <Alert
            message="安装提示"
            description="支持同时安装多个插件，插件名称之间用空格或换行分隔。可以指定自定义镜像源以获得更快的下载速度。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form form={form} layout="vertical" onFinish={handleInstallPlugins}>
            <Form.Item
              name="plugins"
              label="插件名称"
              rules={[{ required: true, message: '请输入插件名称' }]}
            >
              <TextArea
                placeholder={`输入插件名称，例如：
whistle.script
whistle.inspect
whistle.vase`}
                rows={4}
                maxLength={1000}
              />
            </Form.Item>

            <Form.Item name="registry" label="镜像源" initialValue={selectedRegistry}>
              <Select
                placeholder="选择或输入镜像源"
                allowClear
                showSearch
                optionFilterProp="children"
              >
                <Option value="">使用默认镜像源</Option>
                {DEFAULT_REGISTRIES.map((reg) => (
                  <Option key={reg.value} value={reg.value}>
                    <Space>
                      <GlobalOutlined />
                      {reg.label}
                    </Space>
                  </Option>
                ))}
                {registryHistory
                  .filter((url) => !DEFAULT_REGISTRIES.some((r) => r.value === url))
                  .map((url) => (
                    <Option key={url} value={url}>
                      <Space>
                        <ClockCircleOutlined />
                        {url}
                      </Space>
                    </Option>
                  ))}
              </Select>
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => setInstallModal(false)}>取消</Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  安装
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Algolia 风格搜索弹窗 */}
        <Modal
          open={searchModalVisible}
          onCancel={() => setSearchModalVisible(false)}
          footer={null}
          closable={false}
          width={650}
          styles={{ body: { padding: 0 } }}
          centered
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
            <Input
              prefix={<SearchOutlined style={{ fontSize: 20, color: '#1890ff' }} />}
              placeholder="搜索 whistle 插件..."
              variant="borderless"
              size="large"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onPressEnter={handleSearchPlugins}
              suffix={
                <Space>
                  {searchLoading && <ReloadOutlined spin />}
                  <Tag color="default">ESC</Tag>
                </Space>
              }
              style={{ fontSize: 18 }}
            />
          </div>
          <div style={{ maxHeight: 450, overflowY: 'auto', padding: '8px 0' }}>
            {searchResults.length > 0 ? (
              <Flex vertical>
                {searchResults.map((plugin) => (
                  <div
                    className="search-result-item"
                    style={{
                      padding: '12px 20px',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onClick={() => {
                      form.setFieldsValue({ plugins: plugin.name });
                      setSearchModalVisible(false);
                      setInstallModal(true);
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>
                          {plugin.name}
                          <Tag color="blue" style={{ marginLeft: 8 }}>
                            v{plugin.version}
                          </Tag>
                        </div>
                        <div style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: 13 }}>
                          {plugin.description}
                        </div>
                      </div>
                      <Button icon={<DownloadOutlined />} size="small">
                        安装
                      </Button>
                    </div>
                  </div>
                ))}
              </Flex>
            ) : searchTerm && !searchLoading ? (
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <Empty description="未找到相关插件" />
              </div>
            ) : (
              <div style={{ padding: '20px', color: 'rgba(0, 0, 0, 0.45)', textAlign: 'center' }}>
                输入关键词并回车开始搜索
              </div>
            )}
          </div>
          <div
            style={{
              padding: '12px 20px',
              background: '#fafafa',
              borderTop: '1px solid #f0f0f0',
              fontSize: 12,
              color: 'rgba(0, 0, 0, 0.45)',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <Space size="large">
              <span>
                <Tag>↵</Tag> 搜索
              </span>
              <span>
                <Tag>↑↓</Tag> 选择
              </span>
              <span>
                <Tag>ESC</Tag> 关闭
              </span>
            </Space>
            <span>Powered by npm registry</span>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default Plugins;
