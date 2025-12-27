import { RouterProvider } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import router from './router';
import './styles/global.css';

/**
 * 主应用组件
 * 配置路由和全局样式
 */
function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  );
}

export default App;
