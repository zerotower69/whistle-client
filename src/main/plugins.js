import npminstall from 'npminstall';
import fs from 'fs';
import path from 'path';
import npa from 'npminstall/lib/npa';
import Context from 'npminstall/lib/context';
import { getPeerPlugins, WHISTLE_PLUGIN_RE } from 'whistle/lib/util/common';
import { showMessageBox } from './dialog';
import { CLIENT_PLUGINS_PATH, noop } from './util';
import { sendMsg } from './context';

const refreshPlugins = () => {
  sendMsg({ type: 'refreshPlugins' });
};

const addRegistry = (registry) => {
  if (registry) {
    sendMsg({ type: 'addRegistry', registry });
  }
};

const _install = async (data) => {
  let context;
  const tgzFiles = [];
  data.pkgs.forEach((pkg) => {
    const { name } = pkg;
    if (name && !WHISTLE_PLUGIN_RE.test(name)) {
      try {
        context = context || new Context();
        const p = npa(name, { where: data.root, nested: context.nested });
        pkg.name = p.name;
        pkg.version = p.fetchSpec || p.rawSpec;
        pkg.type = p.type;
        pkg.arg = p;
        if (!name.indexOf('file:')) {
          tgzFiles.push(name.substring(5));
        }
      } catch (e) {}
    }
  });
  try {
    await npminstall(data);
    refreshPlugins();
    tgzFiles.forEach((file) => {
      fs.unlink(file, noop);
    });
    return true;
  } catch (e) {
    showMessageBox(e, () => _install(data));
  }
};

const installPlugins = async (data) => {
  data.root = CLIENT_PLUGINS_PATH;
  if (!(await _install(data))) {
    return;
  }
  getPeerPlugins(data.pkgs, CLIENT_PLUGINS_PATH, (pkgs) => {
    data.pkgs = pkgs;
    if (data.pkgs.length) {
      _install(data);
    }
    addRegistry(data.registry);
  });
};

const uninstallPlugin = async (name) => {
  const pluginPath = path.join(CLIENT_PLUGINS_PATH, 'node_modules', name);
  try {
    if (fs.existsSync(pluginPath)) {
      await fs.promises.rm(pluginPath, { recursive: true, force: true });
      refreshPlugins();
      return true;
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
  return false;
};

export const uninstall = uninstallPlugin;
export const install = installPlugins;
