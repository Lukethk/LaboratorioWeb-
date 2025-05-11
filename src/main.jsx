import { Buffer } from 'buffer';
if (!window.Buffer) {
  window.Buffer = Buffer;   // react-pdf/renderer lo necesita
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>,
)
