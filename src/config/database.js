import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
});

// Función para conectar a la base de datos
export const connectDatabase = async () => {
  try {
    await pool.connect();
    console.log("Conexión a PostgreSQL exitosa");
  } catch (err) {
    console.error("Error de conexión a PostgreSQL", err);
    process.exit(1);
  }
};

export { pool };
