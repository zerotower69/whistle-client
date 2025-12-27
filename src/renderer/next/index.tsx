import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './styles/index.css';
import 'virtual:uno.css';
import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

// Configure Monaco Editor for Electron
// By passing the monaco instance directly, we bundle it with the app,
// which is more reliable for Electron apps that might run offline.
loader.config({ monaco });

// Bridge renderer logs to main process for LogViewer
const { ipcRenderer } = window.require('electron');
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

console.log = (...args) => {
  originalLog(...args);
  ipcRenderer.send('renderer-log', { level: 'info', message: args.join(' ') });
};
console.warn = (...args) => {
  originalWarn(...args);
  ipcRenderer.send('renderer-log', { level: 'warn', message: args.join(' ') });
};
console.error = (...args) => {
  originalError(...args);
  ipcRenderer.send('renderer-log', { level: 'error', message: args.join(' ') });
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
