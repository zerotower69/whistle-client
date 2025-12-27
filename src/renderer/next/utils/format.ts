/**
 * 格式化插件名称
 * 1. 过滤掉结尾的 : 和 :: (绝对不允许)
 * 2. 只有在不包含 whistle 且不是私有包 (@开头) 的情况下才补全 whistle. 前缀
 * @param name
 * @returns {string}
 */
export const formatPluginName = (name: string) => {
  if (!name || typeof name !== 'string') {
    return '';
  }
  let pluginName = name.trim();

  // 过滤掉结尾的 : 和 ::
  pluginName = pluginName.replace(/:+$/, '');

  // 只有在不包含 whistle 且不是私有包的情况下才补全前缀
  // 这样可以支持 @org/whistle.xxx 或 whistle-xxx 等特殊命名（如果存在）
  if (!pluginName.toLowerCase().includes('whistle') && !pluginName.startsWith('@')) {
    pluginName = `whistle.${pluginName}`;
  }

  return pluginName;
};