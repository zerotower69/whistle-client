import { utilityProcess, app } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { install } from './plugins';
import { loadOpenPage } from './window';
// The following imports may be needed for future features (e.g., restoring original Whistle UI loading)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getSettings, showSettings, authorization, reloadPage } from './settings';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { closeWhistle, LOCALHOST, VERSION } from './util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let SCRIPT = path.join(__dirname, 'whistle.js');
console.log('Fork.js loaded. __dirname:', __dirname);
console.log('Initial SCRIPT:', SCRIPT);
if (!fs.existsSync(SCRIPT)) {
  console.log('SCRIPT not found, trying chunks/whistle.js');
  SCRIPT = path.join(__dirname, 'chunks/whistle.js');
  if (!fs.existsSync(SCRIPT)) {
    console.log('SCRIPT still not found, trying ../whistle.js');
    SCRIPT = path.join(__dirname, '../whistle.js');
  }
}
console.log('Final SCRIPT:', SCRIPT);

import { willQuit } from './window';
import { setChild, setOptions, getWin, setRunning } from './context';
import { showMessageBox } from './dialog';
import { create as createMenu, updateRules } from './menu';

let initing = true;
let hasError;

const handleWhistleError = async (err) => {
  if (willQuit() || hasError) {
    return;
  }
  const win = getWin();
  if (!win || win.isDestroyed()) {
    return;
  }
  hasError = true;
  setRunning(false);
  err = (err !== 1 && err) || 'Failed to start, please try again';
  await showMessageBox(err, forkWhistle, showSettings); // eslint-disable-line
  hasError = false;
};

const forkWhistle = (isRestart) => {
  if (isRestart) {
    closeWhistle();
  }
  let options;
  const settings = getSettings();
  const isDev = !app.isPackaged;
  const execArgv = ['--max-semi-space-size=64', '--tls-min-v1.0'];
  execArgv.push(`--max-http-header-size=${settings.maxHttpHeaderSize * 1024}`);
  const args = [encodeURIComponent(JSON.stringify(settings))];
  console.log('Forking whistle process at:', SCRIPT);
  try {
    fs.appendFileSync(path.join(process.cwd(), 'fork_debug.log'), `Forking at ${SCRIPT}\n`);
  } catch (e) {}
  console.log('Args:', args);
  const child = utilityProcess.fork(SCRIPT, args, {
    execArgv,
    stdio: isDev ? 'pipe' : 'ignore',
  });
  if (isDev) {
    if (child.stdout) {
      child.stdout.pipe(process.stdout);
    }
    if (child.stderr) {
      child.stderr.pipe(process.stderr);
    }
  }
  setChild(child);
  child.on('error', (err, ...args) => {
    console.error('Whistle child process error:', err, args);
    handleWhistleError(err);
  });
  child.once('exit', (code, ...args) => {
    console.log(`Whistle child process exited with code ${code}, args:`, args);
    handleWhistleError(code);
  });
  child.on('message', async (data) => {
    const type = data && data.type;
    if (type === 'error') {
      return handleWhistleError(data.message);
    }
    if (type === 'rules') {
      return updateRules(data.rules);
    }
    if (type === 'install') {
      return install(data.plugins);
    }
    if (type === 'log') {
      const level = data.level || 'info';
      if (typeof console[level] === 'function') {
        console[level](data.message);
      } else {
        console.log(data.message);
      }
      return;
    }
    if (type === 'session' || type === 'session-update') {
      const win = getWin();
      if (win) {
        win.webContents.send('network-session', data);
      }
      return;
    }
    if (type === 'plugins') {
      const win = getWin();
      if (win) {
        win.webContents.send('plugins-list', data.plugins, data.disabledAllPlugins);
      }
      return;
    }
    if (type === 'getRegistryList') {
      return app.emit('getRegistryList', data.list);
    }
    if (type !== 'options') {
      return;
    }
    options = data.options;
    updateRules(data.rules);
    setRunning(true);
    setOptions(options);
    const win = getWin();
    const proxyRules = `http://${options.host || LOCALHOST}:${options.port}`;
    if (isDev) {
      await win.webContents.session.setProxy({
        proxyRules,
        proxyBypassRules: '<-loopback>',
      });
      try {
        const { default: installExtension, REACT_DEVELOPER_TOOLS } =
          await import('electron-devtools-installer');
        await installExtension(REACT_DEVELOPER_TOOLS);
      } catch (e) {
        // ignore
      }
    } else {
      await win.webContents.session.setProxy({ proxyRules });
    }
    if (initing) {
      initing = false;
      // Load the open page first
      loadOpenPage(win);
      createMenu();
    } else {
      reloadPage(isRestart);
    }
  });
};

export default forkWhistle;
