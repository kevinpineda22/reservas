import { pool } from "../config/database.js";
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

    const checkQuery = `
      SELECT * FROM ${tableName}
      WHERE fecha = $1 AND salon = $2
      AND (
        ($3 >= hora_inicio AND $3 < hora_fin) OR
        ($4 > hora_inicio AND $4 <= hora_fin) OR
        ($3 <= hora_inicio AND $4 >= hora_fin)
      )
    `;

    const result = await pool.query(checkQuery, [
      fecha,
      salon,
      horaInicio,
      horaFinal,
    ]);
    return result.rows.length > 0;
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

    const insertQuery = `
      INSERT INTO ${tableName}
      (nombre, area, motivo, fecha, hora_inicio, hora_fin, estado, salon)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      nombre,
      area,
      motivo,
      fecha,
      horaInicio,
      horaFinal,
      "reservado",
      salon,
    ]);

    return result.rows[0];
  }

  /**
   * Obtiene las reservas por salón y fecha
   * @param {string} salon - Salón
   * @param {string} fecha - Fecha
   * @returns {Promise<Array>} Lista de reservas
   */
  static async getByDateAndSalon(salon, fecha) {
    const tableName = getTableName(salon);

    const query = `
      SELECT 
        TO_CHAR(hora_inicio, 'HH24:MI') AS hora_inicio, 
        TO_CHAR(hora_fin, 'HH24:MI') AS hora_fin, 
        estado, 
        nombre, 
        motivo
      FROM ${tableName}
      WHERE salon = $1 AND fecha = $2;
    `;

    const result = await pool.query(query, [salon, fecha]);
    return result.rows;
  }

  /**
   * Cancela una reserva
   * @param {Object} reservaData - Datos de la reserva a cancelar
   * @returns {Promise<boolean>} True si se canceló, false si no se encontró
   */
  static async cancel({ nombre, salon, fecha, hora_inicio, hora_fin }) {
    const tableName = getTableName(salon);

    const deleteQuery = `
      DELETE FROM ${tableName}
      WHERE nombre = $1 AND salon = $2 AND fecha = $3 AND hora_inicio = $4 AND hora_fin = $5
      RETURNING *;
    `;

    const result = await pool.query(deleteQuery, [
      nombre,
      salon,
      fecha,
      hora_inicio,
      hora_fin,
    ]);

    return result.rows.length > 0;
  }

  /**
   * Obtiene todas las reservas para el calendario
   * @param {string} salon - Salón opcional para filtrar
   * @returns {Promise<Array>} Lista de todas las reservas
   */
  static async getAllForCalendar(salon = null) {
    // Solo usar las dos tablas que realmente existen en la base de datos
    let query = `
      SELECT 
        salon, 
        nombre, 
        TO_CHAR(fecha, 'YYYY-MM-DD') AS fecha, 
        TO_CHAR(hora_inicio, 'HH24:MI') AS hora_inicio, 
        TO_CHAR(hora_fin, 'HH24:MI') AS hora_fin, 
        motivo
      FROM sala_juntas_reservas
      UNION ALL
      SELECT 
        salon, 
        nombre, 
        TO_CHAR(fecha, 'YYYY-MM-DD') AS fecha, 
        TO_CHAR(hora_inicio, 'HH24:MI') AS hora_inicio, 
        TO_CHAR(hora_fin, 'HH24:MI') AS hora_fin, 
        motivo
      FROM auditorio_reservas
    `;

    const parametros = [];

    // Si se especifica un salón, filtrar después del UNION
    if (salon) {
      query = `
        SELECT * FROM (${query}) AS todas_reservas 
        WHERE salon = $1
      `;
      parametros.push(salon);
    }

    const result = await pool.query(query, parametros);
    return result.rows;
  }
}
