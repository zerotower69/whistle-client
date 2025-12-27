import { app, BrowserWindow } from 'electron';
import { closeWhistle, showWin } from './util';
import { ICON } from './icons';
import ctx from './context';
import { disableProxy, isEnabled, getTitle } from './proxy';
import path from 'path';

let _willQuit;
let beforeQuit;

const cleanup = async () => {
  if (isEnabled()) {
    try {
      await disableProxy();
    } catch (err) {}
  }
  closeWhistle();
  app.removeListener('will-quit', handleWillQuit); // eslint-disable-line
};

const handleWillQuit = async (e) => {
  if (_willQuit) {
    return app.exit();
  }
  e.preventDefault();
  _willQuit = true;
  await cleanup();
  app.exit();
};

const TABS = ['Network', 'Rules', 'Values', 'Plugins'];

export const showWindow = (name) => {
  if (!_willQuit) {
    showWin(ctx.getWin());
  }
  if (name && TABS.includes(name)) {
    // 如果是插件页面，显示我们自定义的插件管理界面
    if (name === 'Plugins') {
      showPluginsWindow();
    } else {
      ctx.execJsSafe(`window.showWhistleWebUI("${name}")`);
    }
  }
};

export const showPluginsWindow = () => {
  const pluginsWin = new BrowserWindow({
    title: 'Plugins Management',
    width: 1200,
    height: 800,
    parent: ctx.getWin(),
    modal: false,
    icon: ICON,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      spellcheck: false,
    },
  });

  if (app.isPackaged) {
    pluginsWin.loadFile(path.join(__dirname, '../renderer/pages/plugins/index.html'));
  } else {
    // 在开发环境中，尝试常用的端口
    const devPort = process.env.VITE_DEV_SERVER_PORT || '5173';
    const devUrl = `http://localhost:${devPort}/pages/plugins/index.html`;
    pluginsWin.loadURL(devUrl).catch(() => {
      // 如果失败，尝试端口 5174
      pluginsWin.loadURL('http://localhost:5174/pages/plugins/index.html').catch(() => {
        // 如果还是失败，尝试端口 5175
        pluginsWin.loadURL('http://localhost:5175/pages/plugins/index.html');
      });
    });
  }

  pluginsWin.on('ready-to-show', () => {
    pluginsWin.show();
  });
};

export const createWindow = () => {
  const win = new BrowserWindow({
    title: getTitle(),
    fullscreen: false,
    fullscreenable: true,
    icon: ICON,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      spellcheck: false,
      webviewTag: true,
    },
  });
  win.onBeforeFindInPage = function (keyword, opts) {
    const prev = !!opts && !opts.forward;
    keyword = String(keyword).replace(/"/g, '\\"');
    return ctx.execJsSafe(`window.__findWhistleCodeMirrorEditor_("${keyword}", ${prev});`);
  };

  // 注册快捷键打开开发者工具
  win.webContents.on('before-input-event', (event, input) => {
    if ((input.control || input.meta) && input.alt && input.key.toLowerCase() === 'i') {
      win.webContents.openDevTools();
      event.preventDefault();
    }
    if (input.key === 'F8') {
      win.webContents.openDevTools();
      event.preventDefault();
    }
  });

  ctx.setWin(win);
  win.setMenu(null);
  win.maximize();
  win.on('ready-to-show', () => showWin(win));
  win.on('close', (e) => {
    if (beforeQuit) {
      return;
    }
    beforeQuit = false;
    e.preventDefault();
    win.hide();
  });
  win.webContents.once('page-title-updated', () => {
    win.setTitle(getTitle());
  });
};

app.on('before-quit', () => {
  beforeQuit = true;
});
app.on('activate', showWindow);
app.on('will-quit', handleWillQuit);

export const willQuit = () => _willQuit;

export const restart = async () => {
  _willQuit = true;
  await cleanup();
  app.relaunch({ args: process.argv.slice(1).concat(['--relaunch']) });
  app.exit();
};
