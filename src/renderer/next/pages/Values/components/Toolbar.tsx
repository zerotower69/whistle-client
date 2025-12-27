import React from 'react';
import { Button, Space, Modal, Input, Form, message, Select } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';

interface ToolbarProps {
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
const Toolbar: React.FC<ToolbarProps> = ({ selectedKey, onCreate, onDelete, onRename }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = React.useState(false);
  const [form] = Form.useForm();
  const [renameForm] = Form.useForm();

  const handleCreate = () => {
    form.validateFields().then((values) => {
      onCreate(values.name, values.language || 'text');
      setIsCreateModalOpen(false);
      form.resetFields();
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
    renameForm.validateFields().then((values) => {
      onRename(selectedKey!, values.newName);
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
        title="新建值"
        open={isCreateModalOpen}
        onOk={handleCreate}
        onCancel={() => {
          setIsCreateModalOpen(false);
          form.resetFields();
        }}
        okText="创建"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="请输入值的名称" />
          </Form.Item>
          <Form.Item name="language" label="语言类型" initialValue="text">
            <Select options={LANGUAGE_OPTIONS} />
          </Form.Item>
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
