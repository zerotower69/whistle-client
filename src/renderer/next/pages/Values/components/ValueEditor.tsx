import React, { useRef, useEffect } from 'react';
import { Select, Button, Space, message, Empty } from 'antd';
import { FullscreenOutlined, SaveOutlined } from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import type { ValueItem } from '../types';

interface ValueEditorProps {
  value: ValueItem | null;
  onSave: (content: string) => void;
  onLanguageChange: (language: string) => void;
  onContentChange?: (content: string) => void;
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
const ValueEditor: React.FC<ValueEditorProps> = ({ 
  value, 
  onSave, 
  onLanguageChange,
  onContentChange 
}) => {
  const editorRef = useRef<any>(null);
  const [isDarkMode, setIsDarkMode] = React.useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches,
  );

  // Listen for theme changes
  useEffect(() => {
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setIsDarkMode(customEvent.detail === 'dark');
    };

    window.addEventListener('theme-change', handleThemeChange);
    return () => window.removeEventListener('theme-change', handleThemeChange);
  }, []);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Add save shortcut (Cmd+S or Ctrl+S)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      const currentContent = editor.getValue();
      onSave(currentContent);
    });
  };

  const handleSave = () => {
    if (editorRef.current && value) {
      const newContent = editorRef.current.getValue();
      onSave(newContent);
      message.success('保存成功');
    }
  };

  const handleContentChange = (val: string | undefined) => {
    const newContent = val || '';
    if (onContentChange) {
      onContentChange(newContent);
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
          padding: '8px 12px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Space size="small">
          <span>语言:</span>
          <Select
            size="small"
            value={value.language}
            onChange={onLanguageChange}
            options={LANGUAGE_OPTIONS}
            style={{ width: 120 }}
          />
        </Space>
        <Space size="small">
          <Button size="small" icon={<SaveOutlined />} onClick={handleSave} type="primary">
            保存
          </Button>
          <Button size="small" icon={<FullscreenOutlined />} onClick={handleFullscreen}>
            全屏
          </Button>
        </Space>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Editor
          height="100%"
          language={value.language === 'text' ? 'plaintext' : value.language}
          value={value.content}
          theme={isDarkMode ? 'vs-dark' : 'light'}
          onMount={handleEditorDidMount}
          onChange={handleContentChange}
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
