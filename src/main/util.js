import fs from 'fs';
import path from 'path';
import { homedir } from 'os';
import http from 'http';
import { parse, fileURLToPath } from 'url';
import sudoPrompt from 'sudo-prompt';
import requireW2 from 'whistle/require';
import whistle from 'whistle';
import { getChild, sendMsg, getOptions } from './context';
import config from '../../package.json';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WHISTLE_PATH = whistle.getWhistlePath();
const fse = requireW2('fs-extra');
export const noop = () => {};
export const USERNAME = config.name;
export const PROC_PATH = path.join(homedir(), '.whistle_client.pid');
const HTTPS_RE = /^https:\/\//;
const URL_RE = /^https?:\/\/\S/;
export const LOCALHOST = '127.0.0.1';
export const isMac = process.platform === 'darwin';
const IMPORT_URL_RE = /[?&#]data(?:_url|Url)=([^&#]+)(?:&|#|$)/;
const SUDO_OPTIONS = { name: 'Whistle' };

export const getDataUrl = (url) => {
  const result = IMPORT_URL_RE.exec(url);
  if (!result) {
    return;
  }
  [, url] = result;
  try {
    url = decodeURIComponent(url).trim();
  } catch (e) {}
  return URL_RE.test(url) ? url : null;
};

export const VERSION = config.version;
export const BASE_DIR = path.join(WHISTLE_PATH, '.whistle_client');
export const CLIENT_PLUGINS_PATH = path.join(WHISTLE_PATH, '.whistle_client_plugins');
export const CUSTOM_PLUGINS_PATH = path.join(WHISTLE_PATH, 'custom_plugins');

export { requireW2 };

export const sudoPromptExec = (command, callback) => {
  sudoPrompt.exec(command, SUDO_OPTIONS, callback);
};
// Alias for compatibility if needed, or just export sudoPromptExec
export { sudoPromptExec as sudoPrompt };

const existsFile = (file) => new Promise((resolve) => {
  fs.stat(file, (err, stat) => {
    if (err) {
      return fs.stat(file, (_, s) => resolve(s && s.isFile()));
    }
    resolve(stat.isFile());
  });
});

const readFile = (file) => new Promise((resolve) => {
  fs.readFile(file, (err, buf) => {
    if (err) {
      return fs.readFile(file, (_, buf2) => resolve(buf2));
    }
    resolve(buf);
  });
});

export const compareFile = async (file1, file2) => {
  const exists = await existsFile(file1);
  if (!exists) {
    return false;
  }
  const [ctn1, ctn2] = await Promise.all([readFile(file1), readFile(file2)]);
  return ctn1 && ctn2 ? ctn1.equals(ctn2) : false;
};

export const readJson = (file) => new Promise((resolve) => {
  fse.readJson(file, (err, data) => {
    if (err) {
      return fse.readJson(file, (_, data2) => {
        resolve(data2 || {});
      });
    }
    resolve(data || {});
  });
});

const killProcess = (pid) => {
  if (pid) {
    try {
      process.kill(pid);
    } catch (e) {}
  }
};

export const closeWhistle = () => {
  const child = getChild();
  const curPid = child && child.pid;
  if (child) {
    child.removeAllListeners();
    child.on('error', noop);
  }
  if (curPid) {
    sendMsg({ type: 'exitWhistle' });
    killProcess(curPid);
  }
  try {
    const pid = +fs.readFileSync(PROC_PATH, { encoding: 'utf-8' }).split(',', 1)[0];
    if (pid !== curPid) {
      killProcess(pid);
    }
  } catch (e) {} finally {
    try {
      fs.unlinkSync(PROC_PATH);
    } catch (e) {}
  }
};

export const showWin = (win) => {
  if (!win) {
    return;
  }
  if (win.isMinimized()) {
    win.restore();
  }
  win.show();
  win.focus();
};

export const getErrorMsg = (err) => {
  try {
    return err.message || err.stack || `${err}`;
  } catch (e) {}
  return 'Unknown Error';
};

export const getErrorStack = (err) => {
  if (!err) {
    return '';
  }

  let stack;
  try {
    stack = err.stack;
  } catch (e) {}
  stack = stack || err.message || err;
  const result = [
    `From: ${USERNAME}@${config.version}`,
    `Node: ${process.version}`,
    `Date: ${new Date().toLocaleString()}`,
    stack,
  ];
  return result.join('\r\n');
};

const parseJson = (str) => {
  try {
    return str && JSON.parse(str);
  } catch (e) {}
};

export const getString = (str, len) => {
  if (typeof str !== 'string') {
    return '';
  }
  str = str.trim();
  return len ? str.substring(0, len) : str;
};

export const getJson = (url) => {
  const options = getOptions();
  if (!options) {
    return;
  }
  const isHttps = HTTPS_RE.test(url);
  url = parse(url.replace(HTTPS_RE, 'http://'));
  const headers = { host: url.host };
  if (isHttps) {
    headers['x-whistle-https-request'] = '1';
  }
  url.headers = headers;
  delete url.hostname;
  url.host = options.host || LOCALHOST;
  url.port = options.port;
  return new Promise((resolve, reject) => {
    const handleError = (err) => {
      clearTimeout(timer);  // eslint-disable-line
      reject(err || new Error('Timeout'));
      client.destroy(); // eslint-disable-line
    };
    const timer = setTimeout(handleError, 16000);
    const client = http.get(url, (res) => {
      res.on('error', handleError);
      if (res.statusCode !== 200) {
        return handleError(new Error(`Response code ${res.statusCode}`));
      }
      let body;
      res.on('data', (chunk) => {
        body = body ? Buffer.concat([body, chunk]) : chunk;
      });
      res.once('end', () => {
        clearTimeout(timer);
        resolve(parseJson(body && body.toString()));
      });
    });
    client.on('error', handleError);
  });
};

const isUserInstaller = false;
const isArm = () => /^arm/i.test(process.arch);

export const getArtifactName = (version) => {
  const name = `${config.name}-${isUserInstaller ? 'user-installer-' : ''}v${version}-`;
  switch (process.platform) {
    case 'win32':
      return `${name}win-x64.exe`;
    case 'darwin':
      return `${name}mac-${isArm() ? 'arm64' : 'x64'}.dmg`;
    default:
      return `${name}linux-${isArm() ? 'arm64' : 'x86_64'}.AppImage`;
  }
};
