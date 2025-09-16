import { Router } from "express";
import { ReservasController } from "../controllers/reservasController.js";

const router = Router();

// Ruta para crear una nueva reserva
router.post("/reservar", ReservasController.crearReserva);

// Ruta para consultar horarios reservados
router.get("/reservas", ReservasController.obtenerReservas);

// Ruta para cancelar una reserva
router.delete("/cancelarReserva", ReservasController.cancelarReserva);

// Ruta para consulta de calendario
router.get("/consulta", ReservasController.consultarReservas);

// Ruta de salud del servidor
router.get("/", ReservasController.healthCheck);

export default router;
