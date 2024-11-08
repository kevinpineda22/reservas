import express from 'express';
import cors from 'cors';
import pkg from 'pg'; // Importa el módulo pg como un objeto
import bodyParser from 'body-parser';

const port = 5200;
const { Pool } = pkg; // Extrae Pool del objeto pkg

// Crear la instancia de la aplicación Express
const app = express();

// Usar CORS y body-parser
app.use(cors());
app.use(bodyParser.json());

// Conexión a PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'reservas',
  password: 'desarrollador',
  port: 5432,
});


// Verificar si la conexión a PostgreSQL es exitosa
pool.connect()
  .then(() => {
    console.log('Conexión a PostgreSQL exitosa');
  })
  .catch((err) => {
    console.error('Error de conexión a PostgreSQL', err);
  });

  app.post('/reservar', async (req, res) => {
    const { nombre, cedula, fecha, horaInicio, horaFinal, salon, telefono, correo } = req.body;
  
    const tableName = salon.toLowerCase() === 'sala de juntas'
        ? 'sala_juntas_reservas'
        : 'auditorio_reservas';
  
    try {
      // Verificar si ya existe una reserva en el mismo salón, fecha y rango de horas solapado
      const checkQuery = `
        SELECT * FROM ${tableName}
        WHERE fecha = $1 AND salon = $2
        AND (
          ($3 >= hora_inicio AND $3 < hora_fin) OR  -- Hora de inicio dentro de una reserva existente
          ($4 > hora_inicio AND $4 <= hora_fin) OR  -- Hora de fin dentro de una reserva existente
          ($3 <= hora_inicio AND $4 >= hora_fin)    -- Nueva reserva cubre completamente una reserva existente
        )
      `;
  
      const checkResult = await pool.query(checkQuery, [fecha, salon, horaInicio, horaFinal]);
  
      if (checkResult.rows.length > 0) {
        return res.status(400).json({ mensaje: 'Ya existe una reserva en este horario. Intenta con otro horario.' });
      }
  
      // Insertar la nueva reserva
      const insertQuery = `
        INSERT INTO ${tableName} 
        (usuario_nombre, cedula, fecha, hora_inicio, hora_fin, telefono, correo, estado, salon)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'reservado', $8)
      `;
  
      await pool.query(insertQuery, [nombre, cedula, fecha, horaInicio, horaFinal, telefono, correo, salon]);
  
      res.json({ mensaje: 'Reserva realizada con éxito' });
  
    } catch (error) {
      console.error('Error al realizar la reserva:', error.message);
      console.error(error.stack);
      res.status(500).json({ mensaje: 'Hubo un error al realizar la reserva.', error: error.message });
    }
  });
  
  
// Iniciar servidor
app.listen(port, () => {
  console.log('Servidor corriendo en el puerto', port);
});