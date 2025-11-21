import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

// Construir la connection string desde las variables de entorno de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Extraer el project reference de la URL de Supabase
const projectRef = supabaseUrl
  ? supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
  : null;

// Construir la connection string de PostgreSQL para Supabase
// Formato: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
const connectionString = projectRef
  ? `postgresql://postgres.${projectRef}:${supabaseKey}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
  : process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Función para conectar a la base de datos
export const connectDatabase = async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Conexión a PostgreSQL (Supabase) exitosa");
    console.log(`📍 Proyecto: ${projectRef}`);
    client.release();
  } catch (err) {
    console.error("❌ Error de conexión a PostgreSQL:", err.message);
    console.error("Verifica las credenciales de Supabase en el archivo .env");
    process.exit(1);
  }
};

export { pool };
