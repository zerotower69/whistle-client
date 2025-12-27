import React from 'react';
import { Layout } from 'antd';
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

  const handleSave = (content: string) => {
    if (selectedKey) {
      updateValue(selectedKey, { content });
    }
  };

  const handleLanguageChange = (language: string) => {
    if (selectedKey) {
      updateValue(selectedKey, { language });
    }
  };

  return (
    <Layout style={{ height: 'calc(100vh - 128px)', background: '#fff' }}>
      <Layout>
        <Toolbar
          selectedKey={selectedKey}
          onCreate={createValue}
          onDelete={deleteValue}
          onRename={renameValue}
        />
        <Layout style={{ height: 'calc(100% - 57px)' }}>
          <Sider width={250} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
            <ValueTree values={values} selectedKey={selectedKey} onSelect={setSelectedKey} />
          </Sider>
          <Content>
            <ValueEditor
              value={selectedValue || null}
              onSave={handleSave}
              onLanguageChange={handleLanguageChange}
            />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default Values;
