/**
 * Obtiene el nombre de la tabla basado en el salón
 * @param {string} salon - El nombre del salón
 * @returns {string} El nombre de la tabla correspondiente
 */
export const getTableName = (salon) => {
  const salonLower = salon.toLowerCase();

  switch (salonLower) {
    case "sala de juntas":
      return "sala_juntas_reservas";
    case "sala de reserva":
      // Esta tabla NO existe en la BD, redirigir a auditorio
      return "auditorio_reservas";
    case "auditorio principal":
    case "auditorio":
      return "auditorio_reservas";
    default:
      return "auditorio_reservas";
  }
};

/**
 * Valida si el salón es válido
 * @param {string} salon - El nombre del salón
 * @returns {boolean} True si es válido, false si no
 */
export const isValidSalon = (salon) => {
  const allowedSalons = [
    "auditorio principal",
    "auditorio",
    "sala de juntas",
    "sala de reserva", // Permitido, pero se mapea a auditorio_reservas
  ];
  return allowedSalons.includes(salon.toLowerCase());
};
