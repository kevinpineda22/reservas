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
      return "sala_reserva_reservas";
    case "auditorio principal":
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
    "sala de juntas",
    "sala de reserva",
  ];
  return allowedSalons.includes(salon.toLowerCase());
};
