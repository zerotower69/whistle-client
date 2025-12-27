import React, { useState, useMemo } from 'react';
import { Button, Space, Radio, message, Empty } from 'antd';
import { CopyOutlined, DownloadOutlined, FullscreenOutlined } from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import type { NetworkRequest } from '../../types';
import { useTheme } from '../../hooks/useTheme';

interface ResponseTabProps {
  request: NetworkRequest | null;
}

type ViewMode = 'formatted' | 'raw' | 'preview';

/**
 * Response tab showing response body with Monaco Editor
 */
const ResponseTab: React.FC<ResponseTabProps> = ({ request }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('formatted');
  const isDarkMode = useTheme();

  // Detect content type
  const contentType = useMemo(() => {
    if (!request) return 'text';
    const ct = request.responseHeaders['content-type'] || '';
    if (ct.includes('json')) return 'json';
    if (ct.includes('javascript')) return 'javascript';
    if (ct.includes('html')) return 'html';
    if (ct.includes('css')) return 'css';
    if (ct.includes('xml')) return 'xml';
    return 'text';
  }, [request]);

  // Format content
  const formattedContent = useMemo(() => {
    if (!request?.responseBody) return '';

    if (viewMode === 'formatted' && contentType === 'json') {
      try {
        return JSON.stringify(JSON.parse(request.responseBody), null, 2);
      } catch {
        return request.responseBody;
      }
    }

    return request.responseBody;
  }, [request?.responseBody, viewMode, contentType]);

  // Copy content
  const handleCopy = () => {
    navigator.clipboard.writeText(formattedContent);
    message.success('已复制到剪贴板');
  };

  // Download content
  const handleDownload = () => {
    if (!request) return;
    const blob = new Blob([formattedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `response-${request.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('下载成功');
  };

  if (!request) {
    return <Empty description="请选择一个请求" />;
  }

  if (!request.responseBody) {
    return <div style={{ padding: 16, color: '#999' }}>无响应体</div>;
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div
        style={{
          padding: '8px 16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Radio.Group value={viewMode} onChange={(e) => setViewMode(e.target.value)}>
          <Radio.Button value="formatted">格式化</Radio.Button>
          <Radio.Button value="raw">原始</Radio.Button>
          <Radio.Button value="preview">预览</Radio.Button>
        </Radio.Group>

        <Space>
          <Button icon={<CopyOutlined />} onClick={handleCopy}>
            复制
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleDownload}>
            下载
          </Button>
          <Button icon={<FullscreenOutlined />}>全屏</Button>
        </Space>
      </div>

      {/* Editor */}
      <div style={{ flex: 1 }}>
        {viewMode === 'preview' && contentType === 'html' ? (
          <iframe
            srcDoc={request.responseBody}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Preview"
          />
        ) : (
          <Editor
            height="100%"
            language={contentType}
            value={formattedContent}
            theme={isDarkMode ? 'vs-dark' : 'light'}
            options={{
              readOnly: true,
              minimap: { enabled: true },
              fontSize: 14,
              wordWrap: 'on',
              automaticLayout: true,
              scrollBeyondLastLine: false,
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ResponseTab;
