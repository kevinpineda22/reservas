import React, { useState } from 'react';
import Swal from 'sweetalert2'; // Importa SweetAlert2
import { Link } from 'react-router-dom';
import '../pages/Reserva.css';

function ReservaForm() {
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFinal, setHoraFinal] = useState('');
  const [salon, setSalon] = useState('');
  const [area, setArea] = useState('');
  const [motivo, setMotivo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [reservas, setReservas] = useState([]); // Estado para almacenar las reservas

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
  
    if (!validarFormulario()) {
      return;
    }
  
    const reservaData = { nombre, fecha, horaInicio, horaFinal, salon, area, motivo };
  
    
    fetch('https://reservas-zer3.onrender.com/reservar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reservaData),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.mensaje === 'Ya existe una reserva en este horario. Intenta con otro horario.') {
          // Si ya existe una reserva en ese horario, muestra el error
          Swal.fire('Error', data.mensaje, 'error');
        } else {
          // Reserva exitosa, muestra mensaje de confirmación
          Swal.fire('¡Reserva realizada!', 'Tu reserva ha sido registrada con éxito.', 'success')
            // .then(() => {
            //   // Redirige a la página deseada después de la confirmación
            //   window.location.href = 'https://www.merkahorro.co/';
            // });
        }
      })
      .catch((error) => {
        console.error('Error al hacer la reserva:', error);
        Swal.fire('Error', 'No se pudo realizar la reserva. Intente más tarde.', 'error');
      });
      
      fetch(`https://reservas-zer3.onrender.com/reservas?salon=${salon}`)
  .then((response) => {
    if (!response.ok) {
      throw new Error('Error en la solicitud: ' + response.statusText);
    }
    return response.json();
  })
  .then((data) => {
    if (data.mensaje) {
      // Si hay un mensaje de error, muestra el error
      Swal.fire('Error', data.mensaje, 'error');
    } else {
      // Si no hay mensaje de error, muestra las reservas
      setReservas(data.reservas);
    }
  })
  .catch((error) => {
    console.error('Error al consultar reservas:', error);
    Swal.fire('Error', 'No se pudieron cargar las reservas. Intente más tarde.', 'error');
  });

  };

  // Función para consultar las reservas del salón seleccionado
  const handleConsultarReservas = () => {
    if (!salon) {
      Swal.fire('Error', 'Por favor selecciona un salón para consultar las reservas.', 'warning');
      return;
    }
  
    
  };

  return (
    <div className='kevin'>
      <h2>Reserva tu espacio</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="salon">Salón:</label>
          <select
            id="salon"
            value={salon}
            onChange={(e) => setSalon(e.target.value)}
            required
          >
            <option value="">Seleccione el salón</option>
            <option value="Auditorio Principal">Auditorio Principal</option>
            <option value="Sala de Juntas">Sala de Juntas</option>
            <option value="Sala de reserva">Sala de reserva</option>
          </select>
        </div>
        <div>
          <label htmlFor="nombre">Nombre y Apellido:</label>
          <input
            type="text"
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="area">Área:</label>
          <select
            id="area"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            required
          >
            <option value="">Seleccione el área</option>
            <option value="Gestión humana">Gestión humana</option>
            <option value="Operaciones">Operaciones</option>
            <option value="Contabilidad">Contabilidad</option>
            <option value="Comercial">Comercial</option>
            {/* Agregar más áreas si es necesario */}
          </select>
        </div>
        <div>
          <label htmlFor="motivo">Motivo de la reserva:</label>
          <textarea
            id="motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            required
          ></textarea>
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

      <button onClick={handleConsultarReservas}>Consultar Reservas</button>

      {reservas.length > 0 && (
        <div>
          <h3>Reservas para {salon}</h3>
          <ul>
            {reservas.map((reserva, index) => (
              <li key={index}>
                {reserva.nombre} - {reserva.fecha} {reserva.horaInicio} - {reserva.horaFinal}
              </li>
            ))}
          </ul>
        </div>
      )}

      {mensaje && <p>{mensaje}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export { ReservaForm };
