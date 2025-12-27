interface Window {
  require: (module: string) => any;
  showWhistleWebUI: (name: string) => void;
}

interface IpcRenderer {
  send(channel: string, ...args: any[]): void;
  on(channel: string, listener: (event: any, ...args: any[]) => void): void;
  removeListener(channel: string, listener: (...args: any[]) => void): void;
}

interface SettingsOptions {
  port: string;
  socksPort: string;
  host: string;
  username: string;
  password: string;
  bypass: string;
  useDefaultStorage: boolean;
  maxHttpHeaderSize: number;
}
