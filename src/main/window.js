import { app, BrowserWindow } from 'electron';
import { closeWhistle, showWin } from './util';
import { ICON } from './icons';
import ctx from './context';
import { disableProxy, isEnabled, getTitle } from './proxy';
import path from 'path';

let _willQuit;
let beforeQuit;

/**
 * 清理资源，禁用代理并关闭 whistle 进程
 * @returns {Promise<void>}
 */
const cleanup = async () => {
  if (isEnabled()) {
    try {
      await disableProxy();
    } catch (err) {}
  }
  closeWhistle();
  app.removeListener('will-quit', handleWillQuit); // eslint-disable-line
};

/**
 * 处理应用退出事件
 * @param {Electron.Event} e
 * @returns {Promise<void>}
 */
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

/**
 * 显示窗口并可选地切换到指定标签页
 * @param {string} [name] 标签页名称 ('Network', 'Rules', 'Values', 'Plugins')
 */
export const showWindow = (name) => {
  if (!_willQuit) {
    showWin(ctx.getWin());
  }
  if (name && TABS.includes(name)) {
    ctx.execJsSafe(`window.showWhistleWebUI("${name}")`);
  }
};



/**
 * 加载主应用页面
 * @param {BrowserWindow} win 窗口实例
 */
const loadMainPage = (win) => {
  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/next/index.html`);
  } else {
    win.loadFile(path.join(__dirname, '../renderer/next/index.html'));
  }
};

/**
 * 打开主窗口
 * 如果窗口已存在则直接显示，否则创建新窗口并加载页面
 * @param {Electron.WebContents} [sender] 发送请求的 webContents，用于在当前窗口跳转
 */
export const openMainWindow = (sender) => {
  let win = ctx.getWin();
  
  // 如果是从已有的窗口（如 open 页面）发起的请求，且主窗口还未创建或已销毁
  if (sender && (!win || win.isDestroyed() || win.webContents === sender)) {
    const senderWin = BrowserWindow.fromWebContents(sender);
    if (senderWin) {
      console.log('openMainWindow: reuse sender window');
      loadMainPage(senderWin);
      ctx.setWin(senderWin);
      showWin(senderWin);
      return;
    }
  }

  if (win && !win.isDestroyed()) {
    console.log('openMainWindow: show existing window');
    showWin(win);
    return;
  }
  console.log('openMainWindow: create new window');
  win = new BrowserWindow({
    title: getTitle(),
    fullscreen: false,
    fullscreenable: true,
    icon: ICON,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      spellcheck: false,
      webviewTag: false,
      sandbox: false,
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
    if (input.key === 'F12') {
      win.webContents.openDevTools();
      event.preventDefault();
    }
  });

  // Load the main app
  loadMainPage(win);

  ctx.setWin(win);
  win.setMenu(null);
  win.maximize();
  win.on('ready-to-show', () => {
    showWin(win);
  });
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

/**
 * 加载 Open 页面（落地页）
 * @param {BrowserWindow} win 窗口实例
 */
export const loadOpenPage = (win) => {
  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/pages/open/index.html`);
  } else {
    win.loadFile(path.join(__dirname, '../renderer/pages/open/index.html'));
  }
};

/**
 * 创建初始窗口
 */
export const createWindow = () => {
  const win = new BrowserWindow({
    title: getTitle(),
    fullscreen: false,
    fullscreenable: true,
    icon: ICON,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      spellcheck: false,
      webviewTag: false,
      sandbox: false,
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
    if (input.key === 'F12') {
      win.webContents.openDevTools();
      event.preventDefault();
    }
  });

  ctx.setWin(win);
  win.setMenu(null);
  win.maximize();
  
  win.on('ready-to-show', () => {
    showWin(win);
  });

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

  // 初始加载 open 页面
  loadOpenPage(win);
};

app.on('before-quit', () => {
  beforeQuit = true;
});
app.on('activate', showWindow);
app.on('will-quit', handleWillQuit);

/**
 * 获取应用是否正在退出
 * @returns {boolean}
 */
export const willQuit = () => _willQuit;

/**
 * 重启应用
 * @returns {Promise<void>}
 */
export const restart = async () => {
  if (!app.isPackaged) {
    // 在开发模式下，app.relaunch() 会导致父进程 (electron-vite) 认为子进程已退出并关闭 Vite 服务
    // 从而导致重启后的页面显示空白（因为 dev server 没了）
    // 解决方案：在开发模式下仅重启 whistle，并由 forkWhistle 在准备就绪后触发页面重载
    console.log('Development mode: Restarting whistle instead of relaunching process.');
    app.emit('whistleSettingsChanged', true);
    return;
  }
  _willQuit = true;
  await cleanup();
  app.relaunch({ args: process.argv.slice(1).concat(['--relaunch']) });
  app.exit();
};
