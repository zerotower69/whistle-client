let win;
let child;
let options;
let dataUrl;
let timer;
let _isRunning = false;

export const execJsSafe = async (code) => {
  try {
    return await win.webContents.executeJavaScript(code);
  } catch (e) {}
};

const importDataUrl = async (delay) => {
  if (delay !== true && win && _isRunning && dataUrl && win.webContents) {
    const result = await execJsSafe(`window.setWhistleDataUrl("${dataUrl}")`);
    if (result != null) {
      dataUrl = null;
    }
  }
  timer = dataUrl && setTimeout(importDataUrl, _isRunning ? 100 : 300);
};

const _setDataUrl = function () {
  clearTimeout(timer);
  importDataUrl(true);
};

export const setChild = (c) => {
  child = c;
};

export const getChild = () => child;

export const setWin = (w) => {
  win = w;
  _setDataUrl();
};

export const getWin = () => win;

export const setOptions = (o) => {
  options = o;
};

export const getOptions = () => options;

export const sendMsg = (data) => {
  if (child) {
    child.postMessage(data);
  }
};

export const setDataUrl = (url) => {
  dataUrl = url.replace(/[^\w.~!*'’();:@&=+$,/?#[\]<>{}|%-]/g, (s) => {
    try {
      return encodeURIComponent(s);
    } catch (e) {}
    return '';
  });
  _setDataUrl();
};

export const isRunning = () => _isRunning;
export const setRunning = (running) => {
  _isRunning = running;
};

export default {
  execJsSafe,
  setChild,
  getChild,
  setWin,
  getWin,
  setOptions,
  getOptions,
  sendMsg,
  setDataUrl,
  isRunning,
  setRunning
};
