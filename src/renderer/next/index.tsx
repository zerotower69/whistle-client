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

// Navigation reference for Electron main process
let navigateRef: ((path: string) => void) | null = null;

/**
 * Set the navigate function reference
 * Called from App.tsx to enable navigation from main process
 */
export const setNavigateRef = (navigate: (path: string) => void) => {
  navigateRef = navigate;
};

/**
 * Global function to switch pages
 * Called by Electron main process via window.showWhistleWebUI()
 */
(window as any).showWhistleWebUI = (name: string) => {
  if (navigateRef) {
    const path = `/${name.toLowerCase()}`;
    navigateRef(path);
  } else {
    console.warn('Navigation reference not yet initialized');
  }
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
