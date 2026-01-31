import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import LivreurRoot from './pages/LivreurRoot' 

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LivreurRoot />
  </StrictMode>,
)