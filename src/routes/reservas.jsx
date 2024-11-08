
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Ejemplo de ruta para obtener todas las reservas
router.get('/reservas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reservas');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener las reservas' });
  }
});

module.exports = router;
