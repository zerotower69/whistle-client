import { ipcMain, shell } from 'electron';
import { install, uninstall } from './plugins';
import { openMainWindow } from './window';
import { formatPluginName } from './util';
import { showSettings } from './settings';
import ctx from './context';

/**
 * IPC 处理器配置
 * 按照模块/页面进行分类维护
 */
const ipcHandlers = {
  // 插件管理相关
  plugins: {
    // 处理异步调用 (ipcMain.handle)
    handle: {
      'check-plugin-update': async (event, { name, registry }) => {
        name = formatPluginName(name);
        console.log(`[IPC:Plugins] Checking update for: ${name}`);
        try {
          const reg = registry || 'https://registry.npmjs.org/';
          const url = `${reg.endsWith('/') ? reg : reg + '/'}${name}/latest`;
          console.log(`[IPC:Plugins] Fetching from URL: ${url}`);
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Registry returned ${response.status}`);
          }
          const data = await response.json();
          return { success: true, latestVersion: data['dist-tags']?.latest || data.version };
        } catch (error) {
          console.error(`[IPC:Plugins] Check update failed for ${name}:`, error);
          return { success: false, error: error.message };
        }
      },
      'search-plugins': async (event, { query, registry }) => {
        console.log(`[IPC:Plugins] Searching for: ${query} (Registry: ${registry || 'default'})`);
        try {
          const reg = registry || 'https://registry.npmjs.org/';
          const baseUrl = reg.endsWith('/') ? reg : reg + '/';
          const url = `${baseUrl}-/v1/search?text=keywords:whistle+${encodeURIComponent(query)}&size=20`;
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          return { success: true, data };
        } catch (error) {
          console.error(`[IPC:Plugins] Search failed for ${query}:`, error);
          return { success: false, error: error.message };
        }
      },
      'install-plugins': async (event, data) => {
        if (data && data.pkgs) {
          data.pkgs = data.pkgs.map((pkg) => {
            if (typeof pkg === 'string') {
              return formatPluginName(pkg);
            }
            if (pkg && pkg.name) {
              pkg.name = formatPluginName(pkg.name);
            }
            return pkg;
          });
        }
        try {
          await install(data);
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },
      'uninstall-plugin': async (event, pluginName) => {
        pluginName = formatPluginName(pluginName);
        try {
          await uninstall(pluginName);
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },
      'toggle-plugin': async (event, { name, enabled }) => {
        name = formatPluginName(name);
        try {
          ctx.sendMsg({ type: enabled ? 'enablePlugin' : 'disablePlugin', name });
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },
      'get-installed-plugins': async (event) => {
        try {
          ctx.sendMsg({ type: 'getPlugins' });
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      },
    },
    // 处理单向通知 (ipcMain.on)
    on: {
      'refresh-plugins': (event) => {
        ctx.sendMsg({ type: 'refreshPlugins' });
      },
      enableAllPlugins: (event) => {
        ctx.sendMsg({ type: 'enableAllPlugins' });
      },
      disableAllPlugins: (event) => {
        ctx.sendMsg({ type: 'disableAllPlugins' });
      },
    },
  },

  // 窗口管理相关
  window: {
    on: {
      'open-main-window': (event) => {
        openMainWindow(event.sender);
      },
    },
  },

  // 通用/代理相关
  common: {
    handle: {
      'get-setting': async (event, key) => {
        try {
          const storage = (await import('./storage')).default;
          return storage.getProperty(key);
        } catch (error) {
          console.error(`[IPC:Common] Get setting failed for ${key}:`, error);
          return null;
        }
      },
      'set-setting': async (event, { key, value }) => {
        try {
          const storage = (await import('./storage')).default;
          storage.setProperty(key, value);
          return { success: true };
        } catch (error) {
          console.error(`[IPC:Common] Set setting failed for ${key}:`, error);
          return { success: false, error: error.message };
        }
      },
    },
    on: {
      'download-rootca': () => {
        const options = ctx.getOptions();
        const host = (options && options.host) || '127.0.0.1';
        const port = (options && options.port) || '8888';
        shell.openExternal(`http://${host}:${port}/cgi-bin/rootca`);
      },
      'open-settings': () => {
        showSettings();
      },
    },
  },
};

/**
 * 注册所有 IPC 处理器
 */
export const registerIpcHandlers = () => {
  console.log('Initializing IPC handlers...');

  Object.entries(ipcHandlers).forEach(([moduleName, moduleConfig]) => {
    // 注册 handle (双向)
    if (moduleConfig.handle) {
      Object.entries(moduleConfig.handle).forEach(([channel, handler]) => {
        ipcMain.handle(channel, handler);
      });
    }

    // 注册 on (单向)
    if (moduleConfig.on) {
      Object.entries(moduleConfig.on).forEach(([channel, handler]) => {
        ipcMain.on(channel, handler);
      });
    }
  });

  console.log('IPC handlers registered successfully.');
};
