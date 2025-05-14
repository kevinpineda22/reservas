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

// Reservar
app.post("/reservar", async (req, res) => {
  const { nombre, area, motivo, fecha, horaInicio, horaFinal, salon } = req.body;
  const tableName =
    salon.toLowerCase() === "sala de juntas"
      ? "sala_juntas_reservas"
      : salon.toLowerCase() === "sala de reserva"
      ? "sala_reserva_reservas"
      : "auditorio_reservas";

  try {
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

    const insertQuery = `
      INSERT INTO ${tableName}
      (nombre, area, motivo, fecha, hora_inicio, hora_fin, estado, salon)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    await pool.query(insertQuery, [
      nombre,
      area,
      motivo,
      fecha,
      horaInicio,
      horaFinal,
      "reservado",
      salon,
    ]);
    res.json({ mensaje: "Reserva almacenada exitosamente" });
  } catch (error) {
    console.error("Error al realizar la reserva:", error.message);
    res.status(500).json({
      mensaje: "Hubo un error al realizar la reserva.",
      error: error.message,
    });
  }
});

// Consultar horarios reservados (modificado para formatear horas como HH:mm)
app.get("/reservas", async (req, res) => {
  const { salon, fecha } = req.query;

  if (!salon || !fecha) {
    return res
      .status(400)
      .json({ error: "Por favor, proporciona el salón y la fecha." });
  }

  const tableName =
    salon.toLowerCase() === "sala de juntas"
      ? "sala_juntas_reservas"
      : salon.toLowerCase() === "sala de reserva"
      ? "sala_reserva_reservas"
      : "auditorio_reservas";

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

  try {
    const result = await pool.query(query, [salon, fecha]);
    res.json({ horarios: result.rows });
  } catch (err) {
    console.error("Error al consultar la base de datos:", err);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

// Cancelar una reserva
app.delete("/cancelarReserva", async (req, res) => {
  const { nombre, salon, fecha, hora_inicio, hora_fin } = req.query;

  if (!nombre || !salon || !fecha || !hora_inicio || !hora_fin) {
    return res
      .status(400)
      .json({ mensaje: "Debe proporcionar nombre, salón, fecha, hora_inicio y hora_fin." });
  }

  const allowedSalons = {
    "auditorio principal": "auditorio_reservas",
    "sala de juntas": "sala_juntas_reservas",
    "sala de reserva": "sala_reserva_reservas",
  };

  const tableName = allowedSalons[salon.toLowerCase()];
  if (!tableName) {
    return res
      .status(400)
      .json({ mensaje: "El salón proporcionado no es válido." });
  }

  const deleteQuery = `
    DELETE FROM ${tableName}
    WHERE nombre = $1 AND salon = $2 AND fecha = $3 AND hora_inicio = $4 AND hora_fin = $5
    RETURNING *;
  `;

  try {
    const result = await pool.query(deleteQuery, [
      nombre,
      salon,
      fecha,
      hora_inicio,
      hora_fin,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        mensaje: "No se encontró una reserva con los datos proporcionados.",
      });
    }
    return res.status(200).json({ mensaje: "Reserva cancelada correctamente." });
  } catch (err) {
    console.error("Error al cancelar la reserva:", err);
    return res.status(500).json({
      mensaje: "Error interno del servidor. Por favor, intente más tarde.",
    });
  }
});

// Consulta para calendario
app.get("/consulta", async (req, res) => {
  const { salon } = req.query;

  try {
    let query = `
      SELECT 
        salon, 
        nombre, 
        TO_CHAR(fecha, 'YYYY-MM-DD') AS fecha, 
        TO_CHAR(hora_inicio, 'HH24:MI') AS hora_inicio, 
        TO_CHAR(hora_fin, 'HH24:MI') AS hora_fin, 
        motivo
      FROM sala_juntas_reservas
      UNION
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
    if (salon) {
      query += " WHERE salon = $1";
      parametros.push(salon);
    }

    const resultados = await pool.query(query, parametros);

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
      mensaje: "Hubo un error al consultar la base de datos.",
      error: error.message,
    });
  }
});

// Endpoint para verificar que el servidor está funcionando
app.get("/", (req, res) => {
  res.send("server running");
});

app.listen(port, () => {
  console.log("Servidor corriendo en el puerto", port);
});