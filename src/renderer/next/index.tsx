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

// Valid route names for navigation
const VALID_ROUTES = ['network', 'rules', 'values', 'plugins'] as const;

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
  if (!navigateRef) {
    console.warn('Navigation reference not yet initialized');
    return;
  }

  const normalizedName = name.toLowerCase();
  
  // Validate the route name
  if (!VALID_ROUTES.includes(normalizedName as any)) {
    console.warn(`Invalid route name: ${name}. Valid routes are: ${VALID_ROUTES.join(', ')}`);
    return;
  }

  const path = `/${normalizedName}`;
  navigateRef(path);
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
