import { RouterProvider } from 'react-router-dom';
import router from './router';
import { ConfigProvider, theme } from 'antd';
import { useEffect, useState } from 'react';
import { setNavigateRef } from './index';

function App() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Setup navigation reference for window.showWhistleWebUI()
    // This allows the Electron main process to control routing
    const navigate = (path: string) => {
      router.navigate(path);
    };
    setNavigateRef(navigate);

    const { ipcRenderer } = window.require('electron');
    const initTheme = async () => {
      const savedTheme = await ipcRenderer.invoke('get-setting', 'theme-mode');
      const dark = savedTheme === 'dark';
      setIsDark(dark);
      if (dark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    initTheme();

    // 监听主题切换事件
    const handleThemeChange = (e: any) => {
      setIsDark(e.detail === 'dark');
    };
    window.addEventListener('theme-change', handleThemeChange);
    return () => window.removeEventListener('theme-change', handleThemeChange);
  }, []);

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  );
}

export default App;
