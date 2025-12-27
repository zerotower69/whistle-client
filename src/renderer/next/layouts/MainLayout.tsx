import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Switch, Button, Breadcrumb, Typography, theme } from 'antd';
import LogViewer from '../components/LogViewer';
import {
  GlobalOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  AppstoreOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BulbOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import type { MenuItem } from '../types';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

/**
 * 主布局组件
 * 包含顶部导航栏、左侧菜单和内容区域
 */
const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [proxyEnabled, setProxyEnabled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // 加载上次选中的 Tab 和主题
  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const { ipcRenderer } = window.require('electron');
        
        // 加载 Tab
        const lastTab = await ipcRenderer.invoke('get-setting', 'lastSelectedTab');
        if (lastTab && lastTab !== location.pathname) {
          const validPaths = ['/network', '/rules', '/values', '/plugins'];
          if (validPaths.includes(lastTab)) {
            navigate(lastTab);
          }
        }

        // 加载主题
        const savedTheme = await ipcRenderer.invoke('get-setting', 'theme-mode');
        setIsDarkMode(savedTheme === 'dark');
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  // 菜单配置
  const menuItems: MenuItem[] = [
    {
      key: '/network',
      label: '网络监控',
      icon: <GlobalOutlined />,
      path: '/network',
    },
    {
      key: '/rules',
      label: '规则管理',
      icon: <FileTextOutlined />,
      path: '/rules',
    },
    {
      key: '/values',
      label: '值管理',
      icon: <DatabaseOutlined />,
      path: '/values',
    },
    {
      key: '/plugins',
      label: '插件管理',
      icon: <AppstoreOutlined />,
      path: '/plugins',
    },
  ];

  // 根据当前路径获取面包屑
  const getBreadcrumbs = () => {
    const path = location.pathname;
    const menuItem = menuItems.find((item) => item.path === path);

    return [
      {
        title: '首页',
      },
      {
        title: menuItem?.label || '未知页面',
      },
    ];
  };

  // 处理菜单点击
  const handleMenuClick = (e: { key: string }) => {
    navigate(e.key);
    // 保存当前选中的 Tab
    try {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.invoke('set-setting', { key: 'lastSelectedTab', value: e.key });
    } catch (error) {
      console.error('Failed to save last tab:', error);
    }
  };

  // 切换主题
  const handleThemeToggle = async (checked: boolean) => {
    setIsDarkMode(checked);
    const { ipcRenderer } = window.require('electron');
    await ipcRenderer.invoke('set-setting', { key: 'theme-mode', value: checked ? 'dark' : 'light' });
    
    if (checked) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // 发送自定义事件通知 App.tsx 同步主题
    window.dispatchEvent(new CustomEvent('theme-change', { detail: checked ? 'dark' : 'light' }));
  };

  // 切换代理开关
  const handleProxyToggle = (checked: boolean) => {
    setProxyEnabled(checked);
    // TODO: 调用 Electron IPC 来实际切换代理
    try {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('toggle-proxy', checked);
    } catch (error) {
      console.error('Failed to toggle proxy:', error);
    }
  };

  // 打开设置窗口
  const handleOpenSettings = () => {
    try {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('open-settings');
    } catch (error) {
      console.error('Failed to open settings:', error);
    }
  };

  return (
    <>
      <Layout className="main-layout">
        {/* 左侧菜单 */}
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          trigger={null}
          className="main-sider"
          theme="light"
          width={200}
        >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 16px',
          }}
        >
          {!collapsed && (
            <div className="logo">
              <ApiOutlined className="logo-icon" />
              <span>Whistle</span>
            </div>
          )}
          {collapsed && <ApiOutlined className="logo-icon" style={{ fontSize: 24 }} />}
        </div>

        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
          }))}
          onClick={handleMenuClick}
        />
      </Sider>

      <Layout>
        {/* 顶部导航栏 */}
        <Header className="main-header" style={{ background: colorBgContainer }}>
          <div className="main-header-left">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
          </div>

          <div className="main-header-center">
            <Title level={4} style={{ margin: 0 }}>
              {menuItems.find((item) => item.path === location.pathname)?.label || 'Whistle Client'}
            </Title>
          </div>

          <div className="main-header-right">
            {/* 代理开关 */}
            <Switch
              checkedChildren="代理开启"
              unCheckedChildren="代理关闭"
              checked={proxyEnabled}
              onChange={handleProxyToggle}
            />

            {/* 设置按钮 */}
            <Button type="text" icon={<SettingOutlined />} onClick={handleOpenSettings} />

            {/* 主题切换 */}
            <Switch
              checkedChildren={<BulbOutlined />}
              unCheckedChildren={<BulbOutlined />}
              checked={isDarkMode}
              onChange={handleThemeToggle}
            />
          </div>
        </Header>

        {/* 内容区域 */}
        <Content className="main-layout-content">
          {/* 面包屑 */}
          <Breadcrumb className="main-breadcrumb" items={getBreadcrumbs()} />

          {/* 子路由渲染 */}
          <div className="main-content">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
    <LogViewer />
  </>
);
};

export default MainLayout;
