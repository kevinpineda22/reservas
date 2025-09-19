import { ReservaModel } from "../models/reservaModel.js";
import { isValidSalon } from "../utils/tableNames.js";

export class ReservasController {
  /**
   * Crear una nueva reserva
   */
  static async crearReserva(req, res) {
    try {
      const { nombre, area, motivo, fecha, horaInicio, horaFinal, salon } =
        req.body;

      // Validar datos requeridos
      if (
        !nombre ||
        !area ||
        !motivo ||
        !fecha ||
        !horaInicio ||
        !horaFinal ||
        !salon
      ) {
        return res.status(400).json({
          mensaje: "Todos los campos son requeridos",
        });
      }

      // Verificar conflictos de horario
      const hasConflict = await ReservaModel.checkConflict(
        fecha,
        salon,
        horaInicio,
        horaFinal
      );

      if (hasConflict) {
        return res.status(400).json({
          mensaje:
            "Ya existe una reserva en este horario. Intenta con otro horario.",
        });
      }

      // Crear la reserva
      await ReservaModel.create({
        nombre,
        area,
        motivo,
        fecha,
        horaInicio,
        horaFinal,
        salon,
      });

      res.json({ mensaje: "Reserva almacenada exitosamente" });
    } catch (error) {
      console.error("Error al realizar la reserva:", error.message);
      res.status(500).json({
        mensaje: "Hubo un error al realizar la reserva.",
        error: error.message,
      });
    }
  }

  /**
   * Obtener reservas por salón y fecha
   */
  static async obtenerReservas(req, res) {
    try {
      const { salon, fecha } = req.query;

      if (!salon || !fecha) {
        return res.status(400).json({
          error: "Por favor, proporciona el salón y la fecha para buscar.",
        });
      }

      if (salon && !isValidSalon(salon)) {
        return res.status(400).json({
          error: "El salón proporcionado no es válido.",
        });
      }

      const horarios = await ReservaModel.getByFilters({ salon, fecha });

      if (horarios.length === 0) {
        return res.status(200).json({
          mensaje: "No se encontraron reservas para la fecha y el salón seleccionados.",
          horarios: [],
        });
      }

      res.status(200).json({
        mensaje: "Reservas encontradas",
        horarios,
      });
    } catch (error) {
      console.error("Error al consultar la base de datos:", error);
      res.status(500).json({ error: "Error interno del servidor." });
    }
  }

  /**
   * Cancelar una reserva
   */
  static async cancelarReserva(req, res) {
    try {
      const { nombre, salon, fecha, hora_inicio, hora_fin } = req.query;

      if (!nombre || !salon || !fecha || !hora_inicio || !hora_fin) {
        return res.status(400).json({
          mensaje:
            "Debe proporcionar nombre, salón, fecha, hora_inicio y hora_fin.",
        });
      }

      if (!isValidSalon(salon)) {
        return res.status(400).json({
          mensaje: "El salón proporcionado no es válido.",
        });
      }

      const wasDeleted = await ReservaModel.cancel({
        nombre,
        salon,
        fecha,
        hora_inicio,
        hora_fin,
      });

      if (!wasDeleted) {
        return res.status(404).json({
          mensaje: "No se encontró una reserva con los datos proporcionados.",
        });
      }

      return res.status(200).json({
        mensaje: "Reserva cancelada correctamente.",
      });
    } catch (error) {
      console.error("Error al cancelar la reserva:", error);
      return res.status(500).json({
        mensaje: "Error interno del servidor. Por favor, intente más tarde.",
      });
    }
  }

  /**
   * Consultar todas las reservas para el calendario
   */
  static async consultarReservas(req, res) {
    try {
      const { salon } = req.query;

      const horarios = await ReservaModel.getAllForCalendar(salon);

      if (horarios.length === 0) {
        return res.status(404).json({
          mensaje:
            "No se encontraron reservas para los parámetros especificados.",
        });
      }

      res.status(200).json({
        mensaje: "Reservas encontradas",
        horarios,
      });
    } catch (error) {
      console.error("Error al consultar la base de datos:", error.message);
      res.status(500).json({
        mensaje: "Hubo un error al consultar la base de datos.",
        error: error.message,
      });
    }
  }

  /**
   * Endpoint de salud del servidor
   */
  static healthCheck(req, res) {
    res.send("server running");
  }

  /**
   * Endpoint de diagnóstico para verificar tablas de la base de datos
   */
  static async diagnosticTables(req, res) {
    try {
      const { pool } = await import("../config/database.js");

      const tablesQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND (table_name LIKE '%reservas%' OR table_name LIKE '%reserva%')
        ORDER BY table_name;
      `;

      const tablesResult = await pool.query(tablesQuery);
      const existingTables = tablesResult.rows.map((row) => row.table_name);

      const expectedTables = [
        "sala_juntas_reservas",
        "sala_reserva_reservas",
        "auditorio_reservas",
      ];

      const missingTables = expectedTables.filter(
        (table) => !existingTables.includes(table)
      );

      res.json({
        mensaje: "Diagnóstico de tablas completado",
        tablas_existentes: existingTables,
        tablas_esperadas: expectedTables,
        tablas_faltantes: missingTables,
        estado: missingTables.length === 0 ? "OK" : "FALTAN_TABLAS",
      });
    } catch (error) {
      console.error("Error en diagnóstico:", error.message);
      res.status(500).json({
        mensaje: "Error al realizar diagnóstico",
        error: error.message,
      });
    }
  }
}