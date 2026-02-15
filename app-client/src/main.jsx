import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx' // <--- Enlève les accolades { } ici
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)