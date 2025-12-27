// cleanup.js
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');

// 1. 清理Electron进程
try {
  if (os.platform() === 'win32') {
    execSync('taskkill /F /IM electron.exe', { stdio: 'ignore' });
  } else {
    execSync('pkill -f electron', { stdio: 'ignore' });
  }
} catch {}

// 2. 清理锁文件
const tmpDir = os.tmpdir();
const patterns = ['.com.google.Chrome', '.org.chromium.Chromium', 'SingletonLock'];
patterns.forEach((pattern) => {
  try {
    fs.readdirSync(tmpDir)
      .filter((name) => name.includes(pattern))
      .forEach((name) => {
        fs.rmSync(`${tmpDir}/${name}`, { force: true, recursive: true });
      });
  } catch {}
});
console.log('✅ 清理完成');
