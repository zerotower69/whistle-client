import React, { useState, useEffect, useRef } from 'react';
import { Layout, Tabs, Spin } from 'antd';
import { AppstoreOutlined, GlobalOutlined, SettingOutlined } from '@ant-design/icons';
import PluginsApp from '../plugins/App';

const { Content, Sider } = Layout;

const App: React.FC = () => {
  const [activeKey, setActiveKey] = useState('network');
  const [whistleUrl, setWhistleUrl] = useState('');
  const webviewRef = useRef<any>(null);

  useEffect(() => {
    // Parse query parameters to get the original whistle URL
    const params = new URLSearchParams(window.location.search);
    const url = params.get('whistleUrl');
    if (url) {
      setWhistleUrl(decodeURIComponent(url));
    }

    // Expose function for main process to switch tabs
    (window as any).showWhistleWebUI = (name: string) => {
      if (name === 'Plugins') {
        setActiveKey('plugins');
      } else {
        setActiveKey('network');
        // Try to switch tab in webview
        if (webviewRef.current) {
          try {
            webviewRef.current.executeJavaScript(`window.showWhistleWebUI && window.showWhistleWebUI("${name}")`);
          } catch (e) {
            console.error('Failed to switch tab in webview', e);
          }
        }
      }
    };
  }, []);

  const items = [
    {
      key: 'network',
      label: 'Network',
      icon: <GlobalOutlined />,
      children: null, // Rendered separately to keep alive
    },
    {
      key: 'plugins',
      label: 'Plugins',
      icon: <AppstoreOutlined />,
      children: <PluginsApp />,
    },
  ];

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider collapsed collapsedWidth={60} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 16 }}>
          <Tabs
            activeKey={activeKey}
            onChange={setActiveKey}
            tabPosition="left"
            items={items.map(item => ({
              key: item.key,
              label: <span style={{ fontSize: 20 }}>{item.icon}</span>,
            }))}
            style={{ height: '100%' }}
            tabBarStyle={{ width: 60 }}
          />
        </div>
      </Sider>
      <Content style={{ height: '100%', overflow: 'hidden', position: 'relative' }}>
        {/* Whistle Webview - Always render but hide when not active to preserve state */}
        <div style={{ 
          height: '100%', 
          width: '100%', 
          display: activeKey === 'network' ? 'block' : 'none' 
        }}>
          {whistleUrl ? (
            <webview
              ref={webviewRef}
              src={whistleUrl}
              style={{ width: '100%', height: '100%' }}
              // @ts-ignore
              allowpopups="true"
            />
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Spin size="large" tip="Loading Whistle..." />
            </div>
          )}
        </div>

        {/* Plugins Page */}
        {activeKey === 'plugins' && (
          <div style={{ height: '100%', width: '100%', overflow: 'auto' }}>
            <PluginsApp />
          </div>
        )}
      </Content>
    </Layout>
  );
};

export default App;
