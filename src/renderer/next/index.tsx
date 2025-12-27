import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/index.css'
import 'virtual:uno.css'
import { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'

// Configure Monaco Editor for Electron
// By passing the monaco instance directly, we bundle it with the app,
// which is more reliable for Electron apps that might run offline.
loader.config({ monaco })

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
