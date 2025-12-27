process.env.ELECTRON_RUN_AS_NODE = '1';

import path from 'path';
import fs from 'fs';
import net from 'net';
import os from 'os';
import { fileURLToPath } from 'url';
import whistle from 'whistle';

const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return LOCALHOST;
};
import {
  PROC_PATH,
  BASE_DIR,
  LOCALHOST,
  CUSTOM_PLUGINS_PATH,
  CLIENT_PLUGINS_PATH,
  requireW2,
} from './util';

const sendMsg = (data) => {
  process.parentPort.postMessage(data);
};

sendMsg({
  type: 'log',
  level: 'info',
  message: 'Whistle process initializing...',
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

sendMsg({
  type: 'log',
  level: 'info',
  message: 'Whistle module loaded successfully',
});

const { getBypass } = requireW2('set-global-proxy');
const PROJECT_PLUGINS_PATH = path.join(__dirname, '../node_modules');
const pluginsPath = [path.join(CLIENT_PLUGINS_PATH, 'node_modules')];
const WEB_PAGE = path.join(__dirname, '../renderer/pages/open/index.html');
const SPECIAL_AUTH = `${Math.random()}`;
const CIDR_RE = /^([(a-z\d:.]+)\/\d{1,2}$/i;

const isCIDR = (host) => {
  host = CIDR_RE.exec(host);
  if (!host) {
    return false;
  }
  return net.isIP(host[1]);
};

process.on('uncaughtException', (err) => {
  const msg = `Uncaught Exception: ${err.message}\n${err.stack}`;
  sendMsg({
    type: 'error',
    message: msg,
  });
  setTimeout(() => process.exit(1), 100);
});

process.on('unhandledRejection', (reason) => {
  const msg = `Unhandled Rejection: ${reason}`;
  sendMsg({
    type: 'error',
    message: msg,
  });
});

process.handleUncauthtWhistleErrorMessage = (stack, err) => {
  sendMsg({
    type: 'error',
    message: (err && err.message) || stack,
  });
};

const getBypassRules = (bypass) => {
  if (!bypass || typeof bypass !== 'string') {
    return '';
  }
  bypass = getBypass(bypass.trim().toLowerCase());
  if (!bypass) {
    return;
  }
  const result = [];
  bypass.forEach((host) => {
    if (isCIDR(host)) {
      return;
    }
    if (host === '<local>') {
      host = LOCALHOST;
    } else if (/^\*\./.test(host)) {
      host = `*${host}`;
    }
    if (!result.includes(host)) {
      result.push(host);
    }
  });
  return result.length ? `disable://capture ${result.join(' ')}` : '';
};

const getShadowRules = (settings) => {
  const { username, password, bypass } = settings || {};
  const auth = username || password ? `* whistle.proxyauth://${username}:${password}` : '';
  return `${auth}\n${getBypassRules(bypass)}`.trim();
};

const parseJSON = (str) => {
  if (str) {
    try {
      str = decodeURIComponent(str);
      return JSON.parse(str);
    } catch (e) {}
  }
  return {};
};

const parseOptions = () => {
  const options = parseJSON(process.argv[2]);
  const uiAuth = options.uiAuth || {};
  process.env.PFORK_MAX_HTTP_HEADER_SIZE = options.maxHttpHeaderSize * 1024;
  return {
    port: options.port,
    host: options.host,
    socksPort: options.socksPort,
    username: uiAuth.username,
    password: uiAuth.password,
    bypass: options.bypass,
    shadowRules: getShadowRules(options),
    useDefaultStorage: options.useDefaultStorage,
  };
};
const newOptions = parseOptions();
const baseDir = newOptions.useDefaultStorage ? '' : BASE_DIR;
if (!baseDir) {
  newOptions.customPluginsPath = CUSTOM_PLUGINS_PATH;
}
const baseOptions = {
  baseDir,
  pluginsPath,
  projectPluginsPath: PROJECT_PLUGINS_PATH,
  specialAuth: SPECIAL_AUTH,
  mode: 'client|disableUpdateTips|disableAuthUI',
  ...newOptions,
  disableInstaller: true,
};

const proxy = whistle(
  {
    ...baseOptions,
    installPlugins(plugins) {
      sendMsg({
        type: 'install',
        plugins,
      });
    },
    handleWebReq(_, res) {
      res.sendFile(WEB_PAGE);
    },
  },
  () => {
    sendMsg({
      type: 'log',
      level: 'info',
      message: `Whistle started successfully on port ${baseOptions.port}`,
    });
    sendMsg({
      type: 'options',
      options: {
        ...baseOptions,
        registryPath: proxy.pluginMgr.REGISTRY_LIST,
        rootCAFile: proxy.httpsUtil.getRootCAFile(),
      },
      rules: proxy.rulesUtil.rules.getConfig(),
    });
    const host = baseOptions.host || LOCALHOST;
    const { port } = baseOptions;
    try {
      fs.writeFileSync(PROC_PATH, `${process.pid},${host},${port},${SPECIAL_AUTH}`);
    } catch (e) {}
    let timer;
    let changeTimer;
    const updateRules = () => {
      if (changeTimer) {
        return;
      }
      clearTimeout(timer);
      sendMsg({
        type: 'rules',
        rules: proxy.rulesUtil.rules.getConfig(),
      });
      timer = setTimeout(updateRules, 3000);
    };
    timer = setTimeout(updateRules, 3000);
    const updateImediately = () => {
      changeTimer =
        changeTimer ||
        setTimeout(() => {
          changeTimer = null;
          updateRules();
        }, 30);
    };
    proxy.pluginMgr.on('updateRules', (type) => {
      if (type === 'disableAllPlugins') {
        updateImediately();
      }
    });
    proxy.pluginMgr.on('update', (plugins) => {
      sendMsg({
        type: 'plugins',
        plugins,
        disabledAllPlugins: !!proxy.pluginMgr.disabledAllPlugins,
      });
    });
    proxy.on('rulesDataChange', updateImediately);

    // 监听请求日志并发送给主进程
    proxy.on('request', (reqEmitter, data) => {
      if (!data || !data.req) return;

      const method = data.req.method || 'UNKNOWN';
      const fullUrl = data.url || 'UNKNOWN';

      // 排除本地开发服务和内部资源
      const rendererUrl = process.env['ELECTRON_RENDERER_URL'];
      const localIP = getLocalIP();
      const isLocalDev = rendererUrl && fullUrl.startsWith(rendererUrl);
      const isInternal =
        fullUrl.startsWith('devtools://') ||
        fullUrl.startsWith('chrome-extension://') ||
        fullUrl.includes('/@vite/client') ||
        fullUrl.includes('/__uno.css') ||
        fullUrl.includes('127.0.0.1') ||
        fullUrl.includes('localhost') ||
        (localIP !== LOCALHOST && fullUrl.includes(localIP));

      if (isLocalDev || isInternal) {
        return;
      }

      const id = data.id || `${Date.now()}-${Math.random()}`;
      const reqHeaders = data.req.headers || {};
      const initialReqSize = parseInt(reqHeaders['content-length'], 10) || 0;

      sendMsg({
        type: 'log',
        level: 'info',
        message: `[Network] ${method} ${fullUrl}`,
      });

      // 发送初步会话信息
      sendMsg({
        type: 'session',
        session: {
          id: id,
          url: fullUrl,
          method: method,
          protocol: data.req.httpVersion ? `HTTP/${data.req.httpVersion}` : 'HTTP/1.1',
          startTime: data.startTime || Date.now(),
          requestHeaders: reqHeaders,
          requestSize: initialReqSize,
          responseSize: 0,
          totalSize: initialReqSize,
          type: 'other',
          timing: {
            queueing: 0,
            dnsLookup: 0,
            initialConnection: 0,
            sslHandshake: 0,
            requestSent: 0,
            waiting: 0,
            contentDownload: 0,
            total: 0,
          },
        },
      });

      let resHeaders = {};
      let currentReqSize = initialReqSize;
      let currentResSize = 0;

      // 监听响应
      reqEmitter.on('response', (data) => {
        if (!data || !data.res) return;

        const statusCode = data.res.statusCode || 0;
        resHeaders = data.res.headers || {};
        currentResSize = parseInt(resHeaders['content-length'], 10) || 0;

        sendMsg({
          type: 'log',
          level: 'info',
          message: `[Network] ${method} ${fullUrl} (${statusCode})`,
        });

        // 识别资源类型
        const contentType = (resHeaders['content-type'] || '').toLowerCase();
        let type = 'other';
        if (contentType.includes('text/html')) type = 'document';
        else if (contentType.includes('text/css')) type = 'stylesheet';
        else if (contentType.includes('javascript')) type = 'script';
        else if (contentType.includes('image/')) type = 'image';
        else if (contentType.includes('font/')) type = 'font';
        else if (contentType.includes('json') || contentType.includes('xml')) type = 'fetch';

        // 发送更新后的会话信息
        const endTime = data.endTime || Date.now();
        const startTime = data.startTime || Date.now();
        const totalTime = endTime - startTime;

        sendMsg({
          type: 'session-update',
          id: id,
          update: {
            statusCode: statusCode,
            statusText: data.res.statusMessage || '',
            responseHeaders: resHeaders,
            responseSize: currentResSize,
            totalSize: currentReqSize + currentResSize,
            type: type,
            endTime: endTime,
            timing: {
              total: totalTime,
              waiting: totalTime > 0 ? totalTime * 0.8 : 0,
              contentDownload: totalTime > 0 ? totalTime * 0.2 : 0,
            },
          },
        });
      });

      // 监听请求体
      reqEmitter.on('reqBody', (body) => {
        if (!body) return;
        currentReqSize = body.length;
        const contentType = (reqHeaders['content-type'] || '').toLowerCase();
        const isBinary = /image|video|audio|zip|pdf|octet-stream/.test(contentType);

        sendMsg({
          type: 'session-update',
          id: id,
          update: {
            requestBody: isBinary ? body.toString('base64') : body.toString(),
            requestSize: currentReqSize,
            totalSize: currentReqSize + currentResSize,
          },
        });
      });

      // 监听响应体
      reqEmitter.on('resBody', (body) => {
        if (!body) return;
        currentResSize = body.length;
        const contentType = (resHeaders['content-type'] || '').toLowerCase();
        const isBinary = /image|video|audio|zip|pdf|octet-stream/.test(contentType);

        sendMsg({
          type: 'session-update',
          id: id,
          update: {
            responseBody: isBinary ? body.toString('base64') : body.toString(),
            responseSize: currentResSize,
            totalSize: currentReqSize + currentResSize,
          },
        });
      });

      // 监听错误
      reqEmitter.on('error', (err) => {
        sendMsg({
          type: 'log',
          level: 'error',
          message: `[Network Error] ${method} ${fullUrl}: ${err.message}`,
        });
      });
    });

    proxy.on('error', (err) => {
      sendMsg({
        type: 'log',
        level: 'error',
        message: `[Whistle Error] ${err.message}`,
      });
    });
  },
);

process.parentPort.on('message', (data) => {
  data = data && data.data;
  const { type } = data;
  if (type === 'selectRules') {
    if (data.name === 'Default') {
      proxy.rulesUtil.rules.enableDefault();
    } else {
      proxy.rulesUtil.rules.select(data.name);
    }
    return;
  }
  if (type === 'unselectRules') {
    if (data.name === 'Default') {
      proxy.rulesUtil.rules.disableDefault();
    } else {
      proxy.rulesUtil.rules.unselect(data.name);
    }
    return;
  }
  if (type === 'disableAllRules') {
    return proxy.rulesUtil.rules.disableAllRules(true);
  }
  if (type === 'enableAllRules') {
    return proxy.rulesUtil.rules.disableAllRules(false);
  }
  if (type === 'disableAllPlugins') {
    proxy.pluginMgr.disableAllPlugins(true);
    proxy.pluginMgr.refreshPlugins();
    return;
  }
  if (type === 'enableAllPlugins') {
    proxy.pluginMgr.disableAllPlugins(false);
    proxy.pluginMgr.refreshPlugins();
    return;
  }
  if (type === 'refreshPlugins') {
    proxy.pluginMgr.refreshPlugins();
    return sendMsg({
      type: 'plugins',
      plugins: proxy.pluginMgr.getPlugins(),
      disabledAllPlugins: !!proxy.pluginMgr.disabledAllPlugins,
    });
  }
  if (type === 'addRegistry') {
    return proxy.pluginMgr.addRegistry(data.registry);
  }
  if (type === 'enableCapture') {
    return proxy.rulesUtil.properties.setEnableCapture(true);
  }
  if (type === 'enableCapture') {
    return proxy.rulesUtil.properties.setEnableCapture(true);
  }
  if (type === 'setShadowRules') {
    return proxy.setShadowRules(getShadowRules(data.settings));
  }
  if (type === 'getRegistryList') {
    return sendMsg({
      type: 'getRegistryList',
      list: proxy.pluginMgr.getRegistryList(),
    });
  }
  if (type === 'getPlugins') {
    return sendMsg({
      type: 'plugins',
      plugins: proxy.pluginMgr.getPlugins(),
      disabledAllPlugins: !!proxy.pluginMgr.disabledAllPlugins,
    });
  }
  if (type === 'uninstallPlugin') {
    // whistle 的 pluginMgr 没有 uninstall 方法，卸载是通过物理删除文件后调用 refreshPlugins 实现的
    proxy.pluginMgr.refreshPlugins();
    setTimeout(() => {
      sendMsg({
        type: 'plugins',
        plugins: proxy.pluginMgr.getPlugins(),
        disabledAllPlugins: !!proxy.pluginMgr.disabledAllPlugins,
      });
    }, 1000);
    return;
  }
  if (type === 'enablePlugin') {
    const disabledPlugins = proxy.rulesUtil.properties.get('disabledPlugins') || {};
    delete disabledPlugins[data.name];
    proxy.rulesUtil.properties.set('disabledPlugins', disabledPlugins);
    proxy.pluginMgr.refreshPlugins();
    return;
  }
  if (type === 'disablePlugin') {
    const disabledPlugins = proxy.rulesUtil.properties.get('disabledPlugins') || {};
    disabledPlugins[data.name] = 1;
    proxy.rulesUtil.properties.set('disabledPlugins', disabledPlugins);
    proxy.pluginMgr.refreshPlugins();
    return;
  }
  if (type === 'exitWhistle') {
    return process.exit();
  }
});
