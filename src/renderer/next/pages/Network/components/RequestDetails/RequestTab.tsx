import React, { useMemo } from 'react';
import { Empty } from 'antd';
import Editor from '@monaco-editor/react';
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
    if (!request) return 'text';
    const ct = request.requestHeaders['content-type'] || '';
    if (ct.includes('json')) return 'json';
    if (ct.includes('javascript')) return 'javascript';
    if (ct.includes('html')) return 'html';
    if (ct.includes('css')) return 'css';
    if (ct.includes('xml')) return 'xml';
    return 'text';
  }, [request]);

  if (!request) {
    return <Empty description="请选择一个请求" />;
  }

  if (!request.requestBody) {
    return <div style={{ padding: 16, color: '#999' }}>无请求体</div>;
  }

  return (
    <div style={{ height: '100%' }}>
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
    </div>
  );
};

export default RequestTab;
