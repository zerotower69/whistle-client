import { RouterProvider } from 'react-router-dom';
import router from './router';
import { ConfigProvider, theme, App as AntdApp } from 'antd';
import { useEffect } from 'react';
import { setNavigateRef } from './utils/navigation';
import ErrorBoundary from './components/ErrorBoundary';
import { useTheme } from '@/next/contexts/ThemeContext';

function App() {
  const { isDark } = useTheme();

  useEffect(() => {
    // Setup navigation reference for window.showWhistleWebUI()
    // This allows the Electron main process to control routing
    const navigate = (path: string) => {
      router.navigate(path);
    };
    setNavigateRef(navigate);
  }, []);

  return (
    <ErrorBoundary>
      <ConfigProvider
        theme={{
          algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        }}
      >
        <AntdApp>
          <RouterProvider router={router} />
        </AntdApp>
      </ConfigProvider>
    </ErrorBoundary>
  );
}

export default App;