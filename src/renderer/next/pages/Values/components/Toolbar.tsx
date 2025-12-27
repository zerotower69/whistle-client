import React, { useMemo } from 'react';
import { Button, Space, Modal, Input, Form, message, Select, Radio, AutoComplete } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { ValueItem } from '../types';

interface ToolbarProps {
  values: ValueItem[];
  selectedKey: string | null;
  onCreate: (name: string, language: string) => void;
  onDelete: (key: string) => void;
  onRename: (key: string, name: string) => void;
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
 * Toolbar component with action buttons
 */
const Toolbar: React.FC<ToolbarProps> = ({ values, selectedKey, onCreate, onDelete, onRename }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = React.useState(false);
  const [isGroupMode, setIsGroupMode] = React.useState(false);
  const [form] = Form.useForm();
  const [renameForm] = Form.useForm();

  // Extract existing group names
  const existingGroups = useMemo(() => {
    const groups = new Set<string>();
    values.forEach((v) => {
      if (v.name.includes('/')) {
        groups.add(v.name.split('/')[0]);
      }
    });
    return Array.from(groups).map((g) => ({ value: g }));
  }, [values]);

  const validateName = (name: string, isGroup: boolean) => {
    const slashCount = (name.match(/\//g) || []).length;
    if (isGroup) {
      if (slashCount > 0) {
        message.warning('分组名不可以包含/');
        return false;
      }
      // Check if group already exists
      const groupExists = values.some((v) => v.name.startsWith(`${name}/`));
      if (groupExists) {
        message.warning('【该组名已存在】');
        return false;
      }
    } else {
      if (slashCount > 1) {
        message.warning('【不支持分组嵌套】');
        return false;
      }
      // Check if key already exists
      const keyExists = values.some((v) => v.name === name);
      if (keyExists) {
        message.warning('【该key值已经存在】');
        return false;
      }
    }
    return true;
  };

  const handleCreate = () => {
    form.validateFields().then((values) => {
      if (!validateName(values.name, isGroupMode)) return;

      const finalName = isGroupMode ? `${values.name}/` : values.name;
      onCreate(finalName, values.language || 'text');

      setIsCreateModalOpen(false);
      form.resetFields();
      setIsGroupMode(false);
      message.success('创建成功');
    });
  };

  const handleDelete = () => {
    if (!selectedKey) return;

    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个值吗？此操作不可恢复。',
      onOk: () => {
        onDelete(selectedKey);
        message.success('删除成功');
      },
    });
  };

  const handleRename = () => {
    if (!selectedKey) return;
    setIsRenameModalOpen(true);
  };

  const handleRenameSubmit = () => {
    renameForm.validateFields().then((valuesData) => {
      const newName = valuesData.newName;
      // For rename, we don't know if it was a group or value easily without checking the original name,
      // but we can just enforce the "no nested groups" rule (max 1 slash).
      const slashCount = (newName.match(/\//g) || []).length;
      if (slashCount > 1) {
        message.warning('【不支持分组嵌套】');
        return;
      }

      // Check for duplicates during rename
      const isDuplicate = values.some((v) => v.key !== selectedKey && v.name === newName);
      if (isDuplicate) {
        message.warning('【该名称已存在】');
        return;
      }

      onRename(selectedKey!, newName);
      setIsRenameModalOpen(false);
      renameForm.resetFields();
      message.success('重命名成功');
    });
  };

  return (
    <>
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
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            新建
          </Button>
          <Button
            size="small"
            icon={<DeleteOutlined />}
            onClick={handleDelete}
            disabled={!selectedKey}
            danger
          >
            删除
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={handleRename}
            disabled={!selectedKey}
          >
            重命名
          </Button>
        </Space>
      </div>

      <Modal
        title="新建"
        open={isCreateModalOpen}
        onOk={handleCreate}
        onCancel={() => {
          setIsCreateModalOpen(false);
          form.resetFields();
          setIsGroupMode(false);
        }}
        okText="创建"
        cancelText="取消"
        forceRender
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="类型">
            <Radio.Group
              value={isGroupMode}
              onChange={(e) => setIsGroupMode(e.target.value)}
              optionType="button"
              buttonStyle="solid"
            >
              <Radio value={false}>新建值</Radio>
              <Radio value={true}>新建分组</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <AutoComplete
              options={isGroupMode ? [] : existingGroups}
              filterOption={(inputValue, option) => {
                if (inputValue.includes('/')) return false;
                return option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1;
              }}
            >
              <Input
                placeholder={isGroupMode ? '分组名不可以包含/' : '输入/将自动分组，不支持嵌套分组'}
              />
            </AutoComplete>
          </Form.Item>
          {!isGroupMode && (
            <Form.Item name="language" label="语言类型" initialValue="text">
              <Select options={LANGUAGE_OPTIONS} />
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Modal
        title="重命名"
        open={isRenameModalOpen}
        onOk={handleRenameSubmit}
        onCancel={() => {
          setIsRenameModalOpen(false);
          renameForm.resetFields();
        }}
        okText="确定"
        cancelText="取消"
        forceRender
      >
        <Form form={renameForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="newName"
            label="新名称"
            rules={[{ required: true, message: '请输入新名称' }]}
          >
            <Input placeholder="请输入新名称" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default Toolbar;
