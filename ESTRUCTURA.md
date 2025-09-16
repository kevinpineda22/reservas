# Estructura del Proyecto Modularizado

Este proyecto ha sido refactorizado siguiendo las mejores prácticas de desarrollo con Node.js y Express.

## 📁 Estructura de Carpetas

```
src/
├── config/           # Configuraciones de la aplicación
│   └── database.js   # Configuración de conexión a PostgreSQL
├── controllers/      # Lógica de negocio
│   └── reservasController.js  # Controladores de reservas
├── models/           # Modelos de datos
│   └── reservaModel.js        # Modelo de reservas
├── routes/           # Definición de rutas
│   └── reservasRoutes.js      # Rutas de reservas
├── middleware/       # Middleware personalizado
│   ├── cors.js       # Configuración de CORS
│   └── errorHandler.js        # Manejo de errores
└── utils/            # Utilidades
    └── tableNames.js # Lógica de nombres de tablas
```

## 🚀 Beneficios de la Modularización

### 1. **Separación de Responsabilidades**

- **Config**: Maneja la configuración de la base de datos
- **Controllers**: Contiene toda la lógica de negocio
- **Models**: Encapsula las operaciones de base de datos
- **Routes**: Define únicamente las rutas y sus métodos HTTP
- **Middleware**: Funciones reutilizables para manejo de errores y CORS
- **Utils**: Funciones auxiliares y constantes

### 2. **Mantenibilidad**

- Código más fácil de leer y entender
- Cambios localizados en módulos específicos
- Reducción de duplicación de código

### 3. **Escalabilidad**

- Fácil agregar nuevas funcionalidades
- Estructura preparada para crecimiento del proyecto
- Posibilidad de trabajar en equipo sin conflictos

### 4. **Testabilidad**

- Cada módulo puede ser probado de forma independiente
- Fácil implementación de mocks y stubs
- Testing unitario más eficiente

## 📋 Funcionalidades

### Endpoints Disponibles:

- `POST /reservar` - Crear una nueva reserva
- `GET /reservas` - Consultar reservas por salón y fecha
- `DELETE /cancelarReserva` - Cancelar una reserva existente
- `GET /consulta` - Obtener todas las reservas para el calendario
- `GET /` - Health check del servidor

## 🔧 Configuración

## 🚦 Uso

### Instalación de dependencias

```bash
npm install
```

### Ejecutar el servidor

```bash
npm start
```

## 📝 Notas Técnicas

### Validaciones Implementadas:

- Validación de conflictos de horarios
- Validación de salones válidos
- Validación de campos requeridos
- Manejo centralizado de errores

### Mejoras Implementadas:

- Manejo asíncrono mejorado con async/await
- Middleware de manejo de errores globalizado
- Configuración CORS centralizada
- Lógica de nombres de tablas reutilizable
- Separación clara entre lógica de negocio y acceso a datos

Esta estructura facilita el mantenimiento, testing y escalabilidad del proyecto de reservas.
