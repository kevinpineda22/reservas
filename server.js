import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";

// Importar configuraciones y middleware
import { connectDatabase } from "./src/config/database.js";
import { corsOptions } from "./src/middleware/cors.js";
import { errorHandler, notFoundHandler } from "./src/middleware/errorHandler.js";

// Importar rutas
import reservasRoutes from "./src/routes/reservasRoutes.js";

// Configuración inicial
dotenv.config();
const port = process.env.PORT || 5200;
const app = express();

// Middleware global
app.use(cors(corsOptions));
app.use(bodyParser.json());

// Rutas
app.use("/", reservasRoutes);

// Middleware de manejo de errores (debe ir al final)
app.use(notFoundHandler);
app.use(errorHandler);

// Inicializar servidor
const startServer = async () => {
  try {
    // Conectar a la base de datos
    await connectDatabase();
    
    // Iniciar servidor
    app.listen(port, () => {
      console.log(`Servidor corriendo en el puerto ${port}`);
    });
  } catch (error) {
    console.error("Error al inicializar el servidor:", error);
    process.exit(1);
  }
};

startServer();