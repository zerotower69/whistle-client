import React, { useState, useEffect } from 'react';
import { Layout, Modal, message } from 'antd';
import ValueTree from './components/ValueTree';
import ValueEditor from './components/ValueEditor';
import Toolbar from './components/Toolbar';
import { useValues } from './hooks/useValues';

const { Sider, Content } = Layout;

/**
 * Values management page
 * For managing key-value pairs used in Whistle rules
 */
const Values: React.FC = () => {
  const {
    values,
    selectedKey,
    selectedValue,
    setSelectedKey,
    createValue,
    deleteValue,
    updateValue,
    renameValue,
  } = useValues();

  const [editingContent, setEditingContent] = useState<string>('');
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Sync editing content when selection changes
  useEffect(() => {
    if (selectedValue) {
      setEditingContent(selectedValue.content);
      setIsDirty(false);
    } else {
      setEditingContent('');
      setIsDirty(false);
    }
  }, [selectedKey, selectedValue]);

  const handleSave = (content: string) => {
    if (selectedKey && selectedValue) {
      // Double check name validity before saving content
      const slashCount = (selectedValue.name.match(/\//g) || []).length;
      if (slashCount > 1) {
        message.error('【不支持分组嵌套】，请先重命名该项');
        return;
      }

      updateValue(selectedKey, { content });
      setIsDirty(false);
      message.success('保存成功');
    }
  };

  const handleContentChange = (content: string) => {
    setEditingContent(content);
    if (selectedValue) {
      setIsDirty(content !== selectedValue.content);
    }
  };

  const handleSelect = (key: string) => {
    if (key === selectedKey) return;

    if (isDirty) {
      Modal.confirm({
        title: '未保存的更改',
        content: '当前内容已修改，切换将丢失未保存的更改。是否继续？',
        okText: '继续切换',
        cancelText: '取消',
        onOk: () => {
          setSelectedKey(key);
        },
      });
    } else {
      setSelectedKey(key);
    }
  };

  const handleLanguageChange = (language: string) => {
    if (selectedKey) {
      updateValue(selectedKey, { language });
    }
  };

  return (
    <Layout style={{ height: 'calc(100vh - 64px)', background: '#fff' }}>
      <Layout>
        <Toolbar
          values={values}
          selectedKey={selectedKey}
          onCreate={createValue}
          onDelete={deleteValue}
          onRename={renameValue}
        />
        <Layout style={{ height: 'calc(100% - 40px)' }}>
          <Sider width={250} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
            <ValueTree
              values={values}
              selectedKey={selectedKey}
              onSelect={handleSelect}
              dirtyKeys={isDirty && selectedKey ? [selectedKey] : []}
            />
          </Sider>
          <Content>
            <ValueEditor
              value={selectedValue ? { ...selectedValue, content: editingContent } : null}
              onSave={handleSave}
              onLanguageChange={handleLanguageChange}
              onContentChange={handleContentChange}
            />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default Values;
