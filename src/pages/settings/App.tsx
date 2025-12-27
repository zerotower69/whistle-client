import React, { useEffect, useState, useRef } from 'react';
import {
  Form,
  Input,
  Button,
  Checkbox,
  Select,
  Space,
  message,
  Typography,
} from 'antd';

const { TextArea } = Input;
const { Text } = Typography;

interface SettingsFormValues {
  port: string;
  socksPort: string;
  host: string;
  username: string;
  password: string;
  bypass: string;
  useDefaultStorage: boolean;
  maxHttpHeaderSize: number;
}

const App: React.FC = () => {
  const [form] = Form.useForm<SettingsFormValues>();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const portInputRef = useRef<any>(null);

  useEffect(() => {
    const { ipcRenderer } = window.require('electron');

    // Listen for settings data from main process
    const handleShowSettings = (_: any, options: SettingsFormValues) => {
      if (options) {
        form.setFieldsValue({
          port: options.port || '',
          socksPort: options.socksPort || '',
          host: options.host || '',
          username: options.username || '',
          password: options.password || '',
          bypass: options.bypass || '',
          useDefaultStorage: options.useDefaultStorage || false,
          maxHttpHeaderSize: options.maxHttpHeaderSize || 256,
        });

        // Show advanced section if any advanced field has a value
        if (options.socksPort || options.host || options.username || options.password) {
          setShowAdvanced(true);
        }
      }

      // Focus on port input
      setTimeout(() => {
        if (portInputRef.current) {
          portInputRef.current.select();
          portInputRef.current.focus();
        }
      }, 100);
    };

    const handleShowToast = (_: any, msg: string) => {
      messageApi.error(msg);
    };

    ipcRenderer.on('showSettings', handleShowSettings);
    ipcRenderer.on('showToast', handleShowToast);

    // ESC key handler
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        ipcRenderer.send('hideSettings');
      }
    };
    document.addEventListener('keydown', handleEsc);

    return () => {
      ipcRenderer.removeListener('showSettings', handleShowSettings);
      ipcRenderer.removeListener('showToast', handleShowToast);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [form, messageApi]);

  const handleCancel = () => {
    const { ipcRenderer } = window.require('electron');
    ipcRenderer.send('hideSettings');
  };

  const handleSubmit = (values: SettingsFormValues) => {
    const { ipcRenderer } = window.require('electron');

    const port = values.port?.trim() || '';
    const socksPort = values.socksPort?.trim() || '';
    const host = values.host?.trim() || '';
    const username = values.username?.trim() || '';
    const password = values.password?.trim() || '';

    // Validate port
    if (port) {
      const portNum = parseInt(port, 10);
      if (!(portNum > 0 && portNum < 65536)) {
        messageApi.error('Please input the correct port');
        return;
      }
    }

    // Validate socks port
    if (socksPort) {
      const socksPortNum = parseInt(socksPort, 10);
      if (!(socksPortNum > 0 && socksPortNum < 65536)) {
        messageApi.error('Please input the correct socks port');
        return;
      }
    }

    // Validate host
    if (/\s/.test(host)) {
      messageApi.error('Bound host cannot have spaces');
      return;
    }

    // Validate username
    if (/\s/.test(username)) {
      messageApi.error('Username cannot have spaces');
      return;
    }

    // Validate password
    if (/\s/.test(password)) {
      messageApi.error('Password cannot have spaces');
      return;
    }

    ipcRenderer.send('applySettings', {
      port,
      socksPort,
      host,
      username,
      password,
      bypass: values.bypass?.trim() || '',
      useDefaultStorage: values.useDefaultStorage || false,
      maxHttpHeaderSize: values.maxHttpHeaderSize || 256,
    });
  };

  return (
    <div
      style={{
        width: '460px',
        margin: '0 auto',
        paddingTop: '20px',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {contextHolder}
      <Form
        form={form}
        layout="horizontal"
        onFinish={handleSubmit}
        initialValues={{
          port: '8888',
          maxHttpHeaderSize: 256,
          useDefaultStorage: false,
        }}
        style={{ flex: 1, overflow: 'auto', paddingRight: '20px' }}
      >
        <Form.Item
          label={<span style={{ fontWeight: 'bold' }}>Proxy Port</span>}
          name="port"
          rules={[{ required: true, message: 'Please input the proxy port!' }]}
          labelCol={{ span: 7 }}
          wrapperCol={{ span: 17 }}
        >
          <Input
            ref={portInputRef}
            id="port"
            type="number"
            placeholder="8888"
            maxLength={5}
          />
        </Form.Item>

        {showAdvanced && (
          <>
            <Form.Item
              label={<span style={{ fontWeight: 'bold' }}>Socks Port</span>}
              name="socksPort"
              labelCol={{ span: 7 }}
              wrapperCol={{ span: 17 }}
            >
              <Input
                id="socksPort"
                type="number"
                placeholder="Start a socksv5 proxy listening on given port"
                maxLength={5}
              />
            </Form.Item>

            <Form.Item
              label={<span style={{ fontWeight: 'bold' }}>Bound Host</span>}
              name="host"
              labelCol={{ span: 7 }}
              wrapperCol={{ span: 17 }}
            >
              <Input
                id="host"
                placeholder="Bound given IP address or Domain for the proxy"
                maxLength={255}
              />
            </Form.Item>

            <Form.Item
              label={<span style={{ fontWeight: 'bold' }}>Proxy Auth</span>}
              labelCol={{ span: 7 }}
              wrapperCol={{ span: 17 }}
            >
              <Space.Compact style={{ width: '100%' }}>
                <Form.Item name="username" noStyle>
                  <Input
                    id="username"
                    placeholder="Username"
                    maxLength={16}
                    style={{ width: '48%' }}
                  />
                </Form.Item>
                <span style={{ display: 'inline-block', width: '4%', textAlign: 'center' }}>:</span>
                <Form.Item name="password" noStyle>
                  <Input
                    id="password"
                    placeholder="Password"
                    maxLength={16}
                    style={{ width: '48%' }}
                  />
                </Form.Item>
              </Space.Compact>
            </Form.Item>
          </>
        )}

        {!showAdvanced && (
          <Form.Item wrapperCol={{ offset: 7, span: 17 }}>
            <Button
              type="link"
              onClick={() => setShowAdvanced(true)}
              style={{ paddingLeft: 0 }}
            >
              Show Advanced &gt;&gt;
            </Button>
          </Form.Item>
        )}

        <Form.Item
          label={<span style={{ fontWeight: 'bold' }}>Bypass List</span>}
          name="bypass"
          labelCol={{ span: 7 }}
          wrapperCol={{ span: 17 }}
        >
          <TextArea
            id="bypass"
            placeholder="Servers for which you do not want to use any proxy (separated by spaces)"
            maxLength={2000}
            rows={showAdvanced ? 4 : 8}
          />
        </Form.Item>

        <Form.Item
          name="useDefaultStorage"
          valuePropName="checked"
          wrapperCol={{ offset: 7, span: 17 }}
        >
          <Checkbox>
            <Text>Use whistle's default storage directory</Text>
          </Checkbox>
        </Form.Item>

        <Form.Item
          label="--max-http-header-size="
          name="maxHttpHeaderSize"
          labelCol={{ span: 7 }}
          wrapperCol={{ span: 17 }}
        >
          <Select
            id="maxHttpHeaderSize"
            options={[
              { value: 256, label: '256k' },
              { value: 512, label: '512k' },
              { value: 1024, label: '1m' },
              { value: 5120, label: '5m' },
              { value: 10240, label: '10m' },
              { value: 51200, label: '50m' },
              { value: 102400, label: '100m' },
            ]}
          />
        </Form.Item>
      </Form>

      <div
        style={{
          borderTop: '1px solid #d9d9d9',
          padding: '10px 20px',
          textAlign: 'right',
        }}
      >
        <Space>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button type="primary" onClick={() => form.submit()}>
            Apply
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default App;
