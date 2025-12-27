import path from 'path';
import os from 'os';
import { isIP } from 'net';
import { lookup } from 'dns';
import { BrowserWindow, ipcMain, app, globalShortcut } from 'electron';
import { showWin, getString, LOCALHOST, USERNAME, isMac } from './util';
import { ICON } from './icons';
import { getWin, getOptions, getChild, sendMsg, isRunning } from './context';
import { enableProxy, isEnabled } from './proxy';
import storage from './storage';
import { showWindow } from './window';

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

const username = USERNAME;
const password = `pass_${Math.random()}`;
export const authorization = Buffer.from(`${username}:${password}`).toString('base64');
const DEFAULT_PORT = '8888';
const HEADER_SIZE_OPTIONS = [512, 1024, 5120, 10240, 51200, 102400];
let child;
let storageChanged;

const isPort = (p) => p > 0 && p < 65536;

const getPort = (p, defaultPort) => (isPort(p) ? String(p) : defaultPort || '');

const hideSettings = () => {
  if (child) {
    child.hide();
  }
  globalShortcut.unregister('ESC', hideSettings);
};

const getValue = (data, key) => data && (data.getProperty ? data.getProperty(key) : data[key]);

const parseSettings = (data) => {
  const headerSize = +getValue(data, 'maxHttpHeaderSize');
  let bypass = getString(getValue(data, 'bypass'), 2000);

  // 自动排除 Vite 开发服务器
  const rendererUrl = process.env['ELECTRON_RENDERER_URL'];
  if (rendererUrl) {
    try {
      const url = new URL(rendererUrl);
      const port = url.port;
      const localIP = getLocalIP();
      const viteBypass = [`localhost:${port}`, `127.0.0.1:${port}`, `${localIP}:${port}`];

      const bypassList = bypass ? bypass.split(/[,\s]+/) : [];
      viteBypass.forEach((host) => {
        if (!bypassList.includes(host)) {
          bypassList.push(host);
        }
      });
      bypass = bypassList.join(', ');
    } catch (e) {
      console.error('[Settings] Failed to parse ELECTRON_RENDERER_URL:', e);
    }
  }

  return {
    port: getPort(getValue(data, 'port'), DEFAULT_PORT),
    socksPort: getPort(getValue(data, 'socksPort')),
    username: getString(getValue(data, 'username'), 16),
    password: getString(getValue(data, 'password'), 16),
    uiAuth: { username, password },
    host: getString(getValue(data, 'host'), 255),
    bypass,
    useDefaultStorage: !!getValue(data, 'useDefaultStorage'),
    maxHttpHeaderSize: HEADER_SIZE_OPTIONS.includes(headerSize) ? headerSize : 256,
  };
};

export const getSettings = () => parseSettings(storage);

const updateShadowRules = (settings) => {
  sendMsg({
    type: 'setShadowRules',
    settings,
  });
};
const hasChanged = (data) => {
  if (!getChild()) {
    return true;
  }
  const curSettings = getSettings();
  const keys = Object.keys(curSettings);
  for (let i = 0, len = keys.length; i < len; i++) {
    const key = keys[i];
    if (key !== 'uiAuth' && curSettings[key] !== data[key]) {
      return true;
    }
  }
  return false;
};

const showToast = (msg) => {
  msg = (msg && msg.message) || msg;
  return child.webContents.send('showToast', msg);
};

const dnsLookup = (host) => {
  if (!host || isIP(host)) {
    return host;
  }
  return new Promise((resolve, reject) => {
    lookup(host, (err, ip) => {
      if (err) {
        return reject(err);
      }
      resolve(ip || LOCALHOST);
    });
  });
};

ipcMain.on('hideSettings', () => {
  if (!getOptions() || !isRunning()) {
    return app.quit();
  }
  hideSettings();
});

ipcMain.on('applySettings', async (_, data) => {
  data = data && parseSettings(data);
  if (!data) {
    return;
  }
  try {
    await dnsLookup(data.host);
  } catch (e) {
    return showToast(e);
  }
  if (isRunning() && !hasChanged(data)) {
    return hideSettings();
  }
  const curSettings = getSettings();
  const portChanged = curSettings.port !== data.port;
  const hostChanged = curSettings.host !== data.host;
  const bypassChanged = curSettings.bypass !== data.bypass;
  if (isEnabled() && (portChanged || hostChanged || bypassChanged)) {
    try {
      await enableProxy(data);
    } catch (e) {}
  }
  updateShadowRules(data);
  delete data.uiAuth;
  storage.setProperties(data);
  hideSettings();
  storageChanged = curSettings.useDefaultStorage !== data.useDefaultStorage;
  const socksChanged = curSettings.socksPort !== data.socksPort;
  const headerSizeChanged = curSettings.maxHttpHeaderSize !== data.maxHttpHeaderSize;
  if (
    !isRunning() ||
    portChanged ||
    hostChanged ||
    socksChanged ||
    storageChanged ||
    headerSizeChanged
  ) {
    app.emit('whistleSettingsChanged', true);
  }
});

const _showSettings = () => {
  showWin(child);
  child.webContents.send('showSettings', getSettings());
  child.on('focus', () => {
    globalShortcut.unregister('ESC', hideSettings);
    globalShortcut.register('ESC', hideSettings);
  });
};

export const reloadPage = (force) => {
  if (force || storageChanged) {
    storageChanged = false;
    const win = getWin();
    if (win) {
      win.webContents.reload();
    }
  }
};

export const showSettings = () => {
  showWindow();
  if (child) {
    return _showSettings();
  }
  child = new BrowserWindow({
    parent: getWin(),
    title: 'Proxy Settings',
    autoHideMenuBar: true,
    show: false,
    frame: false,
    modal: true,
    icon: ICON,
    width: 470,
    height: isMac ? 460 : 435,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      spellcheck: false,
      sandbox: false,
    },
  });
  child._hasFindBar = true; // eslint-disable-line
  if (process.env['ELECTRON_RENDERER_URL']) {
    child.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/pages/settings/index.html`);
  } else {
    child.loadFile(path.join(__dirname, '../renderer/pages/settings/index.html'));
  }
  child.isSettingsWin = true;
  child.on('ready-to-show', () => {
    _showSettings();
  });
};
