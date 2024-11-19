import express from 'express';
import cors from 'cors';
import pkg from 'pg';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config(); // Cargar las variables de entorno

const port = process.env.PORT || 5200;
const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(bodyParser.json());

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL
});

pool.connect()
  .then(() => {
    console.log('Conexión a PostgreSQL exitosa');
  })
  .catch((err) => {
    console.error('Error de conexión a PostgreSQL', err);
  });

app.post('/reservar', async (req, res) => {
  const { nombre, area, motivo, fecha, horaInicio, horaFinal, salon,  } = req.body;
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

    const checkResult = await pool.query(checkQuery, [fecha, salon, horaInicio, horaFinal]);

    if (checkResult.rows.length > 0) {
      return res.status(400).json({ mensaje: 'Ya existe una reserva en este horario. Intenta con otro horario.' });
    }

    const insertQuery = `
      INSERT INTO ${tableName}
      (usuario_nombre, area, motivo, fecha, hora_inicio, hora_fin, estado, salon)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    await pool.query(insertQuery, [nombre, area ,motivo, fecha, horaInicio, horaFinal,'reservado',salon]);
    res.json({ mensaje: 'Reserva realizada con éxito' });

  } catch (error) {
    console.error('Error al realizar la reserva:', error.message);
    res.status(500).json({ mensaje: 'Hubo un error al realizar la reserva.', error: error.message });
  }
});

// Endpoint para consultar horarios reservados
app.get('/reservas', async (req, res) => {
  const { salon, fecha } = req.query;

  if (!salon || !fecha) {
    return res.status(400).json({ error: 'Por favor, proporciona el salón y la fecha.' });
  }

  // Determina dinámicamente el nombre de la tabla según el salón
  const tableName =
    salon.toLowerCase() === "sala de juntas"
      ? "sala_juntas_reservas"
      : salon.toLowerCase() === "sala de reserva"
      ? "sala_reserva_reservas"
      : "auditorio_reservas"; 

  // Consulta para obtener las reservas del salón en una fecha específica
  const query = `
    SELECT hora_inicio, hora_fin, estado
    FROM ${tableName}
    WHERE salon = $1 AND fecha = $2;
  `;

  try {
    const result = await pool.query(query, [salon, fecha]);

    // Imprimir datos de las reservas para verificar en consola
    console.log('Datos de reservas disponibles:', JSON.stringify(result.rows, null, 2));

    // Retornar los datos en formato JSON
    res.json({ horarios: result.rows });
  } catch (err) {
    console.error('Error al consultar la base de datos:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});


app.listen(port, () => {
  console.log('Servidor corriendo en el puerto', port);
});
