import fs from 'fs';
import path from 'path';
import { requireW2, compareFile, BASE_DIR, LOCALHOST, sudoPrompt } from './util';
import { app } from 'electron';

const {
  enableProxy: _enableProxy,
  disableProxy: _disableProxy,
  getMacProxyHelper,
  getUid,
  getServerProxy,
} = requireW2('set-global-proxy');

const TITLE = 'Whistle Web Debugging Proxy';
const DISABLED_TITLE = `${TITLE} (Not Set As System Proxy)`;
const PROXY_HELPER = path.join(BASE_DIR, 'whistle');
let _isEnabled = false;

// Initialize proxy status
const initProxyStatus = () => {
  getServerProxy((err, status) => {
    if (!err && status) {
      _isEnabled = !!(status.http && status.http.enabled);
      console.log('[Proxy] Initial status:', _isEnabled);
    }
  });
};
initProxyStatus();

const installProxyHelper = async () => {
  const originHelper = getMacProxyHelper();
  if (!originHelper) {
    console.error('[Proxy] Could not find origin helper');
    return;
  }
  if (!fs.existsSync(originHelper)) {
    console.error('[Proxy] Origin helper does not exist at:', originHelper);
    return;
  }
  if (getUid(PROXY_HELPER) === 0 && (await compareFile(PROXY_HELPER, originHelper))) {
    return;
  }

  // Copy to a temp file first to handle ASAR and permissions
  const tempHelper = path.join(app.getPath('temp'), `whistle_helper_${Date.now()}`);
  try {
    fs.copyFileSync(originHelper, tempHelper);
    fs.chmodSync(tempHelper, 0o755);
  } catch (e) {
    console.error('[Proxy] Failed to create temp helper:', e);
    throw e;
  }

  const command = `/bin/mkdir -p "${path.dirname(PROXY_HELPER)}" && /usr/bin/install -m 4755 -o root -g admin "${tempHelper}" "${PROXY_HELPER}" && /bin/rm -f "${tempHelper}" && /usr/bin/xattr -c "${PROXY_HELPER}"`;
  console.log('[Proxy] Executing command:', command);
  return new Promise((resolve, reject) => {
    sudoPrompt(command, (err, stdout, stderr) => {
      if (err) {
        console.error('[Proxy] sudoPrompt error:', err);
        console.error('[Proxy] sudoPrompt stderr:', stderr);
        return reject(new Error(err.message || err));
      }
      console.log('[Proxy] sudoPrompt success:', stdout);
      if (stderr) {
        console.log('[Proxy] sudoPrompt stderr (non-fatal):', stderr);
      }
      try {
        const stats = fs.statSync(PROXY_HELPER);
        console.log('[Proxy] Helper stats:', {
          uid: stats.uid,
          mode: stats.mode.toString(8),
          size: stats.size
        });
      } catch (e) {
        console.error('[Proxy] Failed to stat helper after install:', e);
      }
      resolve(stdout);
    });
  });
};

export const enableProxy = async (options) => {
  await installProxyHelper();
  _enableProxy({
    port: options.port,
    host: options.host || LOCALHOST,
    bypass: options.bypass,
    proxyHelper: PROXY_HELPER,
  });
  _isEnabled = true;
};

export const disableProxy = async () => {
  await installProxyHelper();
  _disableProxy(PROXY_HELPER);
  _isEnabled = false;
};

export const isEnabled = () => _isEnabled;

export const setEnabled = (flag) => {
  _isEnabled = flag;
};

export const getTitle = () => (_isEnabled !== false ? TITLE : DISABLED_TITLE);
