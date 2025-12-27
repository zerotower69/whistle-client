import npminstall from 'npminstall';
import fs from 'fs';
import path from 'path';
import npa from 'npminstall/lib/npa';
import Context from 'npminstall/lib/context';
import { getPeerPlugins, WHISTLE_PLUGIN_RE } from 'whistle/lib/util/common';
import { showMessageBox } from './dialog';
import { CLIENT_PLUGINS_PATH, noop, formatPluginName } from './util';
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
        pkg.name = formatPluginName(p.name);
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
    tgzFiles.forEach((file) => {
      fs.unlink(file, noop);
    });
    refreshPlugins();
    return true;
  } catch (e) {
    return new Promise((resolve) => {
      showMessageBox(e, () => resolve(_install(data)));
    });
  }
};

const installPlugins = async (data) => {
  data.root = CLIENT_PLUGINS_PATH;
  const success = await _install(data);
  if (!success) {
    return false;
  }
  return new Promise((resolve) => {
    getPeerPlugins(data.pkgs, CLIENT_PLUGINS_PATH, async (pkgs) => {
      if (pkgs && pkgs.length) {
        data.pkgs = pkgs.map(pkg => {
          if (typeof pkg === 'string') return formatPluginName(pkg);
          if (pkg && pkg.name) pkg.name = formatPluginName(pkg.name);
          return pkg;
        });
        await _install(data);
      }
      addRegistry(data.registry);
      resolve(true);
    });
  });
};

const uninstallPlugin = async (name) => {
  name = formatPluginName(name);
  console.log(`[Plugins] Attempting to uninstall: ${name}`);
  const pluginPath = path.join(CLIENT_PLUGINS_PATH, 'node_modules', name);
  
  try {
    // 1. 先通知 whistle 进程卸载插件（尝试释放资源）
    sendMsg({ type: 'uninstallPlugin', name });
    
    // 2. 等待一小段时间让 whistle 处理并释放文件句柄
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 3. 尝试删除物理文件
    if (fs.existsSync(pluginPath)) {
      console.log(`[Plugins] Deleting directory: ${pluginPath}`);
      // 尝试多次删除，防止文件被临时占用
      let retry = 3;
      while (retry > 0) {
        try {
          await fs.promises.rm(pluginPath, { recursive: true, force: true });
          break;
        } catch (err) {
          retry--;
          if (retry === 0) throw err;
          console.warn(`[Plugins] Delete failed, retrying... (${retry} left)`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } else {
      console.error(`[Plugins] Plugin not found: ${name} at ${pluginPath}`);
      throw new Error(`找不到插件 "${name}"，可能已被删除或未安装`);
    }

    // 4. 再次通知 whistle 刷新状态
    refreshPlugins();
    console.log(`[Plugins] Successfully uninstalled: ${name}`);
    return true;
  } catch (e) {
    console.error(`[Plugins] Failed to uninstall ${name}:`, e);
    refreshPlugins();
    // 如果是主动抛出的“找不到插件”错误，直接透传
    if (e.message.includes('找不到插件')) {
      throw e;
    }
    throw new Error(`无法删除插件文件，可能正在被使用或权限不足: ${e.message}`);
  }
};

export const uninstall = uninstallPlugin;
export const install = installPlugins;
