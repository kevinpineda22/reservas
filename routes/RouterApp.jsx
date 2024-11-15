import { Home } from "../pages/Home"
import { ReservaForm } from "../pages/Reserva"
export let routes = [
   
    {
        path: '/',
        element: <Home />,
      
    },
    {
        path: '/reservas',
        element: <ReservaForm />,
    }
]