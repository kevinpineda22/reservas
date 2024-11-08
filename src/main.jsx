import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ReservaForm } from './components/Reserva'




createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ReservaForm />
   
   

  </StrictMode>,
)
