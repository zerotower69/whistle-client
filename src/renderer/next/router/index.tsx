import { createHashRouter, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Network from '../pages/Network';
import Rules from '../pages/Rules';
import Values from '../pages/Values';
import Plugins from '../pages/plugins';
import ErrorBoundary from '../components/ErrorBoundary';

/**
 * 路由配置
 * 使用 HashRouter 以适配 Electron 环境
 */
const router = createHashRouter([
  {
    path: '/',
    element: (
      <ErrorBoundary>
        <MainLayout />
      </ErrorBoundary>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/network" replace />,
      },
      {
        path: 'network',
        element: <Network />,
      },
      {
        path: 'rules',
        element: <Rules />,
      },
      {
        path: 'values',
        element: <Values />,
      },
      {
        path: 'plugins',
        element: <Plugins />,
      },
    ],
  },
]);

export default router;
