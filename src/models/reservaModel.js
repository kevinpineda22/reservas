import { supabaseAxios } from "../config/database.js";
import { getTableName } from "../utils/tableNames.js";

export class ReservaModel {
  /**
   * Verifica si existe una reserva en conflicto
   * @param {string} fecha - Fecha de la reserva
   * @param {string} salon - Salón de la reserva
   * @param {string} horaInicio - Hora de inicio
   * @param {string} horaFinal - Hora de finalización
   * @returns {Promise<boolean>} True si existe conflicto, false si no
   */
  static async checkConflict(fecha, salon, horaInicio, horaFinal) {
    const tableName = getTableName(salon);

    try {
      // Consulta con filtros RPC o usando operadores de PostgREST
      const { data } = await supabaseAxios.get(`/${tableName}`, {
        params: {
          fecha: `eq.${fecha}`,
          salon: `eq.${salon}`,
          or: `(and(hora_inicio.lte.${horaInicio},hora_fin.gt.${horaInicio}),and(hora_inicio.lt.${horaFinal},hora_fin.gte.${horaFinal}),and(hora_inicio.gte.${horaInicio},hora_fin.lte.${horaFinal}))`,
        },
      });

      return data && data.length > 0;
    } catch (error) {
      console.error("Error verificando conflictos:", error.message);
      throw error;
    }
  }

  /**
   * Crea una nueva reserva
   * @param {Object} reservaData - Datos de la reserva
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async create({
    nombre,
    area,
    motivo,
    fecha,
    horaInicio,
    horaFinal,
    salon,
  }) {
    const tableName = getTableName(salon);

    try {
      const { data } = await supabaseAxios.post(
        `/${tableName}`,
        {
          nombre,
          area,
          motivo,
          fecha,
          hora_inicio: horaInicio,
          hora_fin: horaFinal,
          estado: "reservado",
          salon,
        },
        {
          headers: {
            Prefer: "return=representation",
          },
        }
      );

      return data[0];
    } catch (error) {
      console.error("Error creando reserva:", error.message);
      throw error;
    }
  }

  /**
   * Obtiene las reservas por salón y/o fecha de forma flexible
   * @param {Object} filters - Objeto con los filtros (salon, fecha)
   * @returns {Promise<Array>} Lista de reservas
   */
  static async getByFilters({ salon, fecha }) {
    let allReservations = await this.getAllForCalendar(salon);

    if (fecha) {
      const fechaStr = new Date(fecha).toISOString().split("T")[0];
      allReservations = allReservations.filter(
        (reserva) => reserva.fecha === fechaStr
      );
    }

    return allReservations;
  }

  /**
   * Cancela una reserva
   * @param {Object} reservaData - Datos de la reserva a cancelar
   * @returns {Promise<boolean>} True si se canceló, false si no se encontró
   */
  static async cancel({ nombre, salon, fecha, hora_inicio, hora_fin }) {
    const tableName = getTableName(salon);

    try {
      const { data } = await supabaseAxios.delete(`/${tableName}`, {
        params: {
          nombre: `eq.${nombre}`,
          salon: `eq.${salon}`,
          fecha: `eq.${fecha}`,
          hora_inicio: `eq.${hora_inicio}`,
          hora_fin: `eq.${hora_fin}`,
        },
        headers: {
          Prefer: "return=representation",
        },
      });

      return data && data.length > 0;
    } catch (error) {
      console.error("Error cancelando reserva:", error.message);
      throw error;
    }
  }

  /**
   * Obtiene todas las reservas para el calendario
   * @param {string} salon - Salón opcional para filtrar
   * @returns {Promise<Array>} Lista de todas las reservas
   */
  static async getAllForCalendar(salon = null) {
    try {
      // Obtener reservas de ambas tablas
      const [salaJuntasRes, auditorioRes] = await Promise.all([
        supabaseAxios.get("/sala_juntas_reservas", {
          params: {
            select: "salon,nombre,fecha,hora_inicio,hora_fin,motivo",
            ...(salon && { salon: `eq.${salon}` }),
          },
        }),
        supabaseAxios.get("/auditorio_reservas", {
          params: {
            select: "salon,nombre,fecha,hora_inicio,hora_fin,motivo",
            ...(salon && { salon: `eq.${salon}` }),
          },
        }),
      ]);

      const allReservations = [
        ...(salaJuntasRes.data || []),
        ...(auditorioRes.data || []),
      ];

      // Formatear las fechas y horas
      return allReservations.map((reserva) => ({
        ...reserva,
        fecha: reserva.fecha ? reserva.fecha.split("T")[0] : reserva.fecha,
      }));
    } catch (error) {
      console.error("Error obteniendo reservas:", error.message);
      throw error;
    }
  }
}
