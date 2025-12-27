import path from 'path';
import { requireW2, compareFile, BASE_DIR, LOCALHOST, sudoPrompt } from './util';

const {
  enableProxy: _enableProxy,
  disableProxy: _disableProxy,
  getMacProxyHelper,
  getUid,
} = requireW2('set-global-proxy');

const TITLE = 'Whistle Web Debugging Proxy';
const DISABLED_TITLE = `${TITLE} (Not Set As System Proxy)`;
const PROXY_HELPER = path.join(BASE_DIR, 'whistle');
let _isEnabled;

const installProxyHelper = async () => {
  const originHelper = getMacProxyHelper();
  if (!originHelper) {
    return;
  }
  if (getUid(PROXY_HELPER) === 0 && (await compareFile(PROXY_HELPER, originHelper))) {
    return;
  }
  const command = `cp "${originHelper}" "${PROXY_HELPER}" && chown root:admin "${PROXY_HELPER}" && chmod a+rx+s "${PROXY_HELPER}"`;
  return new Promise((resolve, reject) => {
    sudoPrompt(command, (err, stdout) => {
      if (err) {
        return reject(err);
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
