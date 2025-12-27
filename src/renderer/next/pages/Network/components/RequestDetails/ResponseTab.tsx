import React, { useState, useMemo } from 'react';
import { Button, Space, Radio, message, Empty } from 'antd';
import { CopyOutlined, DownloadOutlined, FullscreenOutlined } from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import mineType from 'mine-type';
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
    if (!request || !request.responseHeaders) return 'text';
    const ct = request.responseHeaders['content-type'] || '';
    const pureCt = ct.split(';')[0].trim().toLowerCase();

    if (!pureCt) return 'text';

    // Use mine-type to get file extensions and map to Monaco languages
    const extensions = mineType.getFileType(pureCt) || [];
    const langMap: Record<string, string> = {
      json: 'json',
      html: 'html',
      htm: 'html',
      js: 'javascript',
      javascript: 'javascript',
      css: 'css',
      xml: 'xml',
      md: 'markdown',
      yaml: 'yaml',
      yml: 'yaml',
      txt: 'text',
      conf: 'ini',
    };

    const ext = extensions.find((e) => langMap[e]);
    if (ext) return langMap[ext];

    if (pureCt.startsWith('image/')) return 'image';
    if (pureCt.startsWith('text/')) return 'text';

    return 'binary';
  }, [request]);

  // Format content
  const formattedContent = useMemo(() => {
    if (!request?.responseBody || contentType === 'image' || contentType === 'binary') return '';

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
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {contentType === 'image' ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              background: isDarkMode ? '#1e1e1e' : '#f5f5f5',
              padding: 20,
            }}
          >
            <img
              src={
                request.responseBody?.startsWith('data:')
                  ? request.responseBody
                  : `data:${request.responseHeaders?.['content-type'] || 'image/png'};base64,${request.responseBody}`
              }
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}
              alt="Response Preview"
            />
          </div>
        ) : contentType === 'binary' ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              color: '#999',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
            <div>二进制数据，无法直接显示</div>
            <div style={{ marginTop: 8, fontSize: 12 }}>
              类型: {request.responseHeaders?.['content-type'] || 'unknown'}
            </div>
            <Button type="primary" icon={<DownloadOutlined />} style={{ marginTop: 24 }} onClick={handleDownload}>
              下载文件
            </Button>
          </div>
        ) : viewMode === 'preview' && contentType === 'html' ? (
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
