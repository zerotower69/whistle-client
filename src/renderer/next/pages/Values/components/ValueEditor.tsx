import React, { useRef, useEffect } from 'react';
import { Select, Button, Space, message, Empty } from 'antd';
import { FullscreenOutlined, SaveOutlined } from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import type { ValueItem } from '../types';

interface ValueEditorProps {
  value: ValueItem | null;
  onSave: (content: string) => void;
  onLanguageChange: (language: string) => void;
}

const LANGUAGE_OPTIONS = [
  { label: 'Text', value: 'text' },
  { label: 'JSON', value: 'json' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'HTML', value: 'html' },
  { label: 'CSS', value: 'css' },
  { label: 'XML', value: 'xml' },
  { label: 'Markdown', value: 'markdown' },
  { label: 'TypeScript', value: 'typescript' },
];

/**
 * Right panel component with Monaco Editor
 */
const ValueEditor: React.FC<ValueEditorProps> = ({ value, onSave, onLanguageChange }) => {
  const editorRef = useRef<any>(null);
  const [content, setContent] = React.useState('');
  const [isDarkMode] = React.useState(window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    if (value) {
      setContent(value.content);
    }
  }, [value?.key]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const handleSave = () => {
    if (editorRef.current && value) {
      const newContent = editorRef.current.getValue();
      onSave(newContent);
      message.success('保存成功');
    }
  };

  const handleFullscreen = () => {
    if (editorRef.current) {
      const container = editorRef.current.getDomNode()?.parentElement?.parentElement;
      if (container) {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          container.requestFullscreen();
        }
      }
    }
  };

  if (!value) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Empty description="请选择一个值进行编辑" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: '12px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Space>
          <span>语言:</span>
          <Select
            value={value.language}
            onChange={onLanguageChange}
            options={LANGUAGE_OPTIONS}
            style={{ width: 150 }}
          />
        </Space>
        <Space>
          <Button icon={<SaveOutlined />} onClick={handleSave} type="primary">
            保存
          </Button>
          <Button icon={<FullscreenOutlined />} onClick={handleFullscreen}>
            全屏
          </Button>
        </Space>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Editor
          height="100%"
          language={value.language === 'text' ? 'plaintext' : value.language}
          value={content}
          theme={isDarkMode ? 'vs-dark' : 'light'}
          onMount={handleEditorDidMount}
          onChange={(val) => setContent(val || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
          }}
        />
      </div>
    </div>
  );
};

export default ValueEditor;
