import React, { useState } from 'react';

function ReservaForm() {
  const [nombre, setNombre] = useState('');
  const [cedula, setCedula] = useState('');
  const [fecha, setFecha] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFinal, setHoraFinal] = useState('');
  const [salon, setSalon] = useState('Auditorio Principal');
  const [telefono, setTelefono] = useState(''); // Nuevo campo de teléfono
  const [correo, setCorreo] = useState(''); // Nuevo campo de correo
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  // Validación para asegurarse de que la hora de inicio es antes que la hora final
  const validarFormulario = () => {
    if (horaInicio >= horaFinal) {
      setError('La hora de inicio debe ser antes de la hora final.');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    // Validar formulario
    if (!validarFormulario()) {
      return;
    }

    const reservaData = { nombre, cedula, fecha, horaInicio, horaFinal, salon, telefono, correo };

    // Enviar la reserva al backend
    fetch('https://reservas-zer3.onrender.com/reservar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reservaData),
    })
      .then((response) => response.json())
      .then((data) => {
        setMensaje(data.mensaje);
        setError('');
      })
      .catch((error) => {
        console.error('Error al hacer la reserva:', error);
        setMensaje('');
        setError('Hubo un error al realizar la reserva. Intente de nuevo más tarde.');
      });
  };

  return (
    <div>
      <h2>Formulario de Reserva</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="salon">Selecciona el salón:</label>
          <select
            id="salon"
            value={salon}
            onChange={(e) => setSalon(e.target.value)}
          >
            <option value="Auditorio Principal">Auditorio Principal</option>
            <option value="Sala de Juntas">Sala de Juntas</option>
          </select>
        </div>
        <div>
          <label htmlFor="nombre">Nombre:</label>
          <input
            type="text"
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="cedula">Cédula:</label>
          <input
            type="text"
            id="cedula"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="telefono">Teléfono:</label>
          <input
            type="text"
            id="telefono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="correo">Correo:</label>
          <input
            type="email"
            id="correo"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="fecha">Fecha:</label>
          <input
            type="date"
            id="fecha"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="horaInicio">Hora de Inicio:</label>
          <input
            type="time"
            id="horaInicio"
            value={horaInicio}
            onChange={(e) => setHoraInicio(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="horaFinal">Hora Final:</label>
          <input
            type="time"
            id="horaFinal"
            value={horaFinal}
            onChange={(e) => setHoraFinal(e.target.value)}
            required
          />
        </div>
        <button type="submit">Reservar</button>
      </form>

      {mensaje && <p>{mensaje}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export { ReservaForm };
