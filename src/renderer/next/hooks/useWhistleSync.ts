import { useEffect, useRef } from 'react';

/**
 * Whistle 状态同步 Hook
 * 用于在执行插件安装、卸载、开关等操作后，等待 Whistle 核心进程将最新的状态同步回渲染进程。
 * 
 * @param onPluginsUpdate 当收到最新的插件列表时的回调函数
 */
export const useWhistleSync = (
  onPluginsUpdate?: (pluginsMap: any, disabledAllPlugins?: boolean) => void
) => {
  const pendingUpdateResolver = useRef<(() => void) | null>(null);
  const callbackRef = useRef(onPluginsUpdate);

  // 保持回调函数的最新引用，避免 useEffect 频繁重置
  useEffect(() => {
    callbackRef.current = onPluginsUpdate;
  }, [onPluginsUpdate]);

  useEffect(() => {
    const { ipcRenderer } = window.require('electron');

    const handlePluginsList = (_: any, pluginsMap: any, disabledAllPlugins?: boolean) => {
      // 执行业务回调
      if (callbackRef.current) {
        callbackRef.current(pluginsMap, disabledAllPlugins);
      }
      
      // 如果有正在等待的 Promise，则将其 resolve
      if (pendingUpdateResolver.current) {
        pendingUpdateResolver.current();
        pendingUpdateResolver.current = null;
      }
    };

    ipcRenderer.on('plugins-list', handlePluginsList);
    
    return () => {
      ipcRenderer.removeListener('plugins-list', handlePluginsList);
    };
  }, []);

  /**
   * 返回一个 Promise，在下一次收到 plugins-list 消息时 resolve
   * @param timeout 超时时间（毫秒），默认 10 秒
   */
  const waitForPluginUpdate = (timeout = 10000) => {
    return new Promise<void>((resolve) => {
      pendingUpdateResolver.current = resolve;
      
      // 设置超时保护
      setTimeout(() => {
        if (pendingUpdateResolver.current === resolve) {
          pendingUpdateResolver.current = null;
          resolve();
        }
      }, timeout);
    });
  };

  /**
   * 取消当前的等待状态
   */
  const cancelWaiting = () => {
    pendingUpdateResolver.current = null;
  };

  return { waitForPluginUpdate, cancelWaiting };
};
