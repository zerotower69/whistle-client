import React, { useEffect } from 'react';
import { Card, Button, Space, Typography } from 'antd';
import { RocketOutlined, DownloadOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const IMPORT_URL_RE = /[?&#]data(?:_url|Url)=([^&#]+)(?:&|#|$)/;

function getDataUrl() {
  const result = IMPORT_URL_RE.exec(location.href);
  return result && result[1];
}

function isHttp(url: string) {
  try {
    url = decodeURIComponent(url).trim();
    return /https?:\/\/\S/.test(url);
  } catch (e) {
    return false;
  }
}

const App: React.FC = () => {
  const handleOpenClient = () => {
    const url = getDataUrl();
    let clientUrl = 'whistle://client';

    if (url && isHttp(url)) {
      clientUrl = `whistle://client?dataUrl=${url}`;
    }

    // Send IPC to main process to open main window
    try {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('open-main-window');
    } catch (e) {
      console.error('Failed to send IPC message', e);
      // Fallback for browser environment or if IPC fails
      window.location.assign(clientUrl);
    }
  };

  // Download RootCA
  const handleDownloadCA = () => {
    try {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('download-rootca');
    } catch (e) {
      window.location.assign('/cgi-bin/rootca');
    }
  };

  return (
    <div style={{ padding: '50px 20px' }}>
      <Card
        style={{
          maxWidth: '500px',
          margin: '0 auto',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
          <RocketOutlined style={{ fontSize: '64px', color: '#1890ff' }} />

          <Title level={2} style={{ marginBottom: 0 }}>
            Whistle Client
          </Title>

          <Paragraph type="secondary">
            Open Whistle Client to start debugging your web applications
          </Paragraph>

          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Button
              type="primary"
              size="large"
              icon={<RocketOutlined />}
              block
              onClick={handleOpenClient}
            >
              Open Whistle Client
            </Button>

            <Button size="large" icon={<DownloadOutlined />} block onClick={handleDownloadCA}>
              Download RootCA
            </Button>
          </Space>
        </Space>
      </Card>
    </div>
  );
};

export default App;
