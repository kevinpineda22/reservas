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
  
    // Muestra el cuadro de confirmación
    Swal.fire({
      title: 'Confirma tu reserva',
      html: `
        <p><strong>Nombre:</strong> ${nombre}</p>
        <p><strong>Fecha:</strong> ${fecha}</p>
        <p><strong>Hora de Inicio:</strong> ${horaInicio}</p>
        <p><strong>Hora Final:</strong> ${horaFinal}</p>
        <p><strong>Salón:</strong> ${salon}</p>
        <p><strong>Área:</strong> ${area}</p>
        <p><strong>Motivo:</strong> ${motivo}</p>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Confirmar Reserva',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        // Si el usuario confirma, envía la solicitud al servidor
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
            Swal.fire('¡Reserva realizada!', 'Tu reserva ha sido registrada con éxito.', 'success')
              .then(() => {
                // Redirige a la página deseada después de mostrar el mensaje de éxito
                window.location.href = 'https://www.merkahorro.com/';
              });
          })
          .catch((error) => {
            console.error('Error al hacer la reserva:', error);
            setMensaje('');
            setError('Hubo un error al realizar la reserva. Intente de nuevo más tarde.');
            Swal.fire('Error', 'No se pudo realizar la reserva. Intente más tarde.', 'error');
          });
      }
    });
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
            <option value="Contabilidad">Administrativa y financiera</option>
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

      {mensaje && <p>{mensaje}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export { ReservaForm };
