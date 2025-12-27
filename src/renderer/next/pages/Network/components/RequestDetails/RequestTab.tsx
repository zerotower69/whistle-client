import React, { useMemo } from 'react';
import { Empty } from 'antd';
import Editor from '@monaco-editor/react';
import mineType from 'mine-type';
import type { NetworkRequest } from '../../types';
import { useTheme } from '../../hooks/useTheme';

interface RequestTabProps {
  request: NetworkRequest | null;
}

/**
 * Request tab showing request body
 */
const RequestTab: React.FC<RequestTabProps> = ({ request }) => {
  const isDarkMode = useTheme();

  // Detect content type
  const contentType = useMemo(() => {
    if (!request || !request.requestHeaders) return 'text';
    const ct = request.requestHeaders['content-type'] || '';
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

  if (!request) {
    return <Empty description="请选择一个请求" />;
  }

  if (!request.requestBody) {
    return <div style={{ padding: 16, color: '#999' }}>无请求体</div>;
  }

  return (
    <div style={{ height: '100%' }}>
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
              request.requestBody?.startsWith('data:')
                ? request.requestBody
                : `data:${request.requestHeaders?.['content-type'] || 'image/png'};base64,${request.requestBody}`
            }
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              boxShadow: '0 0 10px rgba(0,0,0,0.1)',
            }}
            alt="Request Preview"
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
            类型: {request.requestHeaders?.['content-type'] || 'unknown'}
          </div>
        </div>
      ) : (
        <Editor
          height="100%"
          language={contentType}
          value={request.requestBody}
          theme={isDarkMode ? 'vs-dark' : 'light'}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
          }}
        />
      )}
    </div>
  );
};

export default RequestTab;
