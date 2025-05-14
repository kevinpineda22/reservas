import express from "express";
import cors from "cors";
import pkg from "pg";
import bodyParser from "body-parser";
import dotenv from "dotenv";

dotenv.config();

const port = process.env.PORT || 5200;
const { Pool } = pkg;

const app = express();

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
});

pool
  .connect()
  .then(() => {
    console.log("Conexión a PostgreSQL exitosa");
  })
  .catch((err) => {
    console.error("Error de conexión a PostgreSQL", err);
  });

// Ruta para crear una reserva
app.post("/reservar", async (req, res) => {
  const { nombre, area, motivo, fecha, horaInicio, horaFinal, salon } = req.body;
  const tableName =
    salon.toLowerCase() === "sala de juntas"
      ? "sala_juntas_reservas"
      : "auditorio_reservas";

  try {
    // Validar que todos los campos necesarios estén presentes
    if (!nombre || !area || !motivo || !fecha || !horaInicio || !horaFinal || !salon) {
      return res.status(400).json({ mensaje: "Faltan campos requeridos." });
    }

    // Verificar conflictos de horario
    const checkQuery = `
      SELECT * FROM ${tableName}
      WHERE fecha = $1 AND salon = $2
      AND (
        ($3 >= hora_inicio AND $3 < hora_fin) OR
        ($4 > hora_inicio AND $4 <= hora_fin) OR
        ($3 <= hora_inicio AND $4 >= hora_fin)
      )
    `;

    const checkResult = await pool.query(checkQuery, [
      fecha,
      salon,
      horaInicio,
      horaFinal,
    ]);

    if (checkResult.rows.length > 0) {
      return res.status(400).json({
        mensaje: "Ya existe una reserva en este horario. Intenta con otro horario.",
      });
    }

    // Insertar la reserva
    const insertQuery = `
      INSERT INTO ${tableName}
      (nombre, area, motivo, fecha, hora_inicio, hora_fin, estado, salon)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
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

    res.status(200).json({
      mensaje: "Reserva almacenada exitosamente",
      id: result.rows[0].id,
    });
  } catch (error) {
    console.error("Error al realizar la reserva:", error.message);
    res.status(500).json({
      mensaje: "Error al realizar la reserva.",
      error: error.message,
    });
  }
});

// Ruta para consultar reservas
app.get("/reservas", async (req, res) => {
  const { salon, fecha, nombre, fechaInicio, fechaFin } = req.query;

  let query = `
    SELECT id, nombre, area, motivo, fecha, hora_inicio, hora_fin, estado, salon
    FROM sala_juntas_reservas
    WHERE 1=1
    UNION
    SELECT id, nombre, area, motivo, fecha, hora_inicio, hora_fin, estado, salon
    FROM auditorio_reservas
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;

  if (salon) {
    query += ` AND salon = $${paramIndex}`;
    params.push(salon);
    paramIndex++;
  }
  if (fecha) {
    query += ` AND fecha = $${paramIndex}`;
    params.push(fecha);
    paramIndex++;
  }
  if (nombre) {
    query += ` AND nombre = $${paramIndex}`;
    params.push(nombre);
    paramIndex++;
  }
  if (fechaInicio && fechaFin) {
    query += ` AND fecha BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
    params.push(fechaInicio, fechaFin);
    paramIndex += 2;
  } else if (fechaInicio) {
    query += ` AND fecha >= $${paramIndex}`;
    params.push(fechaInicio);
    paramIndex++;
  } else if (fechaFin) {
    query += ` AND fecha <= $${paramIndex}`;
    params.push(fechaFin);
    paramIndex++;
  }

  try {
    const result = await pool.query(query, params);
    res.status(200).json({ horarios: result.rows });
  } catch (err) {
    console.error("Error al consultar la base de datos:", err);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
});

// Ruta para cancelar una reserva
app.delete("/cancelarReserva", async (req, res) => {
  const { id, salon } = req.query;

  if (!id || !salon) {
    return res.status(400).json({ mensaje: "Debe proporcionar el ID y el salón." });
  }

  const tableName =
    salon.toLowerCase() === "sala de juntas"
      ? "sala_juntas_reservas"
      : "auditorio_reservas";

  const deleteQuery = `
    DELETE FROM ${tableName}
    WHERE id = $1 AND salon = $2
    RETURNING *;
  `;

  try {
    const result = await pool.query(deleteQuery, [id, salon]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        mensaje: "No se encontró una reserva con los datos proporcionados.",
      });
    }

    res.status(200).json({ mensaje: "Reserva cancelada correctamente." });
  } catch (err) {
    console.error("Error al cancelar la reserva:", err);
    res.status(500).json({
      mensaje: "Error interno del servidor. Por favor, intente más tarde.",
    });
  }
});

// Ruta para consultar todas las reservas (con o sin filtro por salón)
app.get("/consulta", async (req, res) => {
  const { salon } = req.query;

  try {
    let query = `
      SELECT 
        id,
        salon, 
        nombre, 
        TO_CHAR(fecha, 'YYYY-MM-DD') AS fecha, 
        TO_CHAR(hora_inicio, 'HH24:MI') AS hora_inicio, 
        TO_CHAR(hora_fin, 'HH24:MI') AS hora_fin, 
        motivo
      FROM sala_juntas_reservas
      UNION
      SELECT 
        id,
        salon, 
        nombre, 
        TO_CHAR(fecha, 'YYYY-MM-DD') AS fecha, 
        TO_CHAR(hora_inicio, 'HH24:MI') AS hora_inicio, 
        TO_CHAR(hora_fin, 'HH24:MI') AS hora_fin, 
        motivo
      FROM auditorio_reservas
    `;

    const params = [];

    if (salon) {
      query += " WHERE salon = $1";
      params.push(salon);
    }

    const resultados = await pool.query(query, params);

    if (resultados.rows.length === 0) {
      return res.status(404).json({
        mensaje: "No se encontraron reservas para los parámetros especificados.",
      });
    }

    res.status(200).json({
      mensaje: "Reservas encontradas",
      horarios: resultados.rows,
    });
  } catch (error) {
    console.error("Error al consultar la base de datos:", error.message);
    res.status(500).json({
      mensaje: "Error al consultar la base de datos.",
      error: error.message,
    });
  }
});

// Ruta raíz
app.get("/", (req, res) => {
  res.send("Servidor corriendo");
});

app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});