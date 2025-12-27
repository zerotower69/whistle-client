import log from 'electron-log';
import path from 'path';
import fs from 'fs';
import { app, ipcMain } from 'electron';

// 配置日志格式和文件位置
log.transports.file.level = 'info';
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';
log.transports.file.maxSize = 10 * 1024 * 1024; // 10MB

// 日志目录
const logDir = path.dirname(log.transports.file.getFile().path);

/**
 * 清理超过 7 天的日志
 */
const cleanupOldLogs = () => {
  try {
    if (!fs.existsSync(logDir)) return;

    const files = fs.readdirSync(logDir);
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    files.forEach((file) => {
      if (file.endsWith('.log')) {
        const filePath = path.join(logDir, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > sevenDaysMs) {
          console.log(`[Logger] Deleting old log file: ${file}`);
          fs.unlinkSync(filePath);
        }
      }
    });
  } catch (error) {
    console.error('[Logger] Failed to cleanup old logs:', error);
  }
};

/**
 * 初始化日志系统
 */
export const initLogger = () => {
  cleanupOldLogs();

  // 拦截 console.log 等输出到文件
  Object.assign(console, log.functions);

  console.log('[Logger] Logger initialized. Path:', log.transports.file.getFile().path);

  // 监听日志流请求
  ipcMain.on('request-logs', (event) => {
    try {
      const logPath = log.transports.file.getFile().path;
      if (fs.existsSync(logPath)) {
        const content = fs.readFileSync(logPath, 'utf-8');
        const lines = content.split('\n').filter((line) => line.trim());
        // 只发送最后 200 行，避免数据过大
        const lastLines = lines.slice(-200);
        event.reply('log-history', lastLines);
      }
    } catch (error) {
      console.error('[Logger] Failed to read log file:', error);
    }
  });
};

// 实时推送日志到渲染进程
const originalWrite = log.transports.file.write;
log.transports.file.write = (message) => {
  const formattedMsg = log.transports.file.format
    .replace('{y}', message.date.getFullYear())
    .replace('{m}', String(message.date.getMonth() + 1).padStart(2, '0'))
    .replace('{d}', String(message.date.getDate()).padStart(2, '0'))
    .replace('{h}', String(message.date.getHours()).padStart(2, '0'))
    .replace('{i}', String(message.date.getMinutes()).padStart(2, '0'))
    .replace('{s}', String(message.date.getSeconds()).padStart(2, '0'))
    .replace('{ms}', String(message.date.getMilliseconds()).padStart(3, '0'))
    .replace('{level}', message.level)
    .replace('{text}', message.data.join(' '));

  // 推送到所有窗口
  const { BrowserWindow } = require('electron');
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send('log-data', {
        level: message.level,
        message: formattedMsg,
      });
    }
  });

  return originalWrite(message);
};

export default log;
