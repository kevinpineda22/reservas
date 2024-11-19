import React, { useState } from 'react';
import Swal from 'sweetalert2'; // Importa SweetAlert2
import DatePicker from 'react-datepicker'; // Importa react-datepicker
import 'react-datepicker/dist/react-datepicker.css'; // Importa estilos de react-datepicker
import '../pages/Reserva.css';

function ReservaForm() {
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState(null);
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFinal, setHoraFinal] = useState('');
  const [salon, setSalon] = useState('');
  const [area, setArea] = useState('');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');
  const [reservas, setReservas] = useState([]);
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);

  // Validar el formulario antes del envío
  const validarFormulario = () => {
    if (!nombre || !fecha || !horaInicio || !horaFinal || !salon || !area || !motivo) {
      setError('Por favor, completa todos los campos.');
      return false;
    }
    if (horaInicio >= horaFinal) {
      setError('La hora de inicio debe ser antes de la hora final.');
      return false;
    }
    setError('');
    return true;
  };

  // Enviar la reserva al servidor
  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validarFormulario()) {
      Swal.fire('Error', error, 'error');
      return;
    }

    const reservaData = {
      nombre,
      fecha: fecha?.toISOString().split('T')[0], // Formatear fecha como YYYY-MM-DD
      horaInicio,
      horaFinal,
      salon,
      area,
      motivo,
    };

    fetch('https://reservas-zer3.onrender.com/reservar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reservaData),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.mensaje) {
          Swal.fire('Error', data.mensaje, 'error');
        } else {
          Swal.fire('¡Reserva realizada!', 'Tu reserva ha sido registrada con éxito.', 'success');
          setReservas([...reservas, reservaData]); // Actualizar lista de reservas
          limpiarFormulario();
        }
      })
      .catch((error) => {
        console.error('Error al hacer la reserva:', error);
        Swal.fire('Error', 'No se pudo realizar la reserva. Intente más tarde.', 'error');
      });
  };

  // Consultar reservas para un salón y fecha específicos
  const consultarReservasPorFecha = (fechaSeleccionada) => {
    if (!salon) {
      Swal.fire('Error', 'Por favor selecciona un salón para consultar las reservas.', 'warning');
      return;
    }

    fetch(`https://reservas-zer3.onrender.com/reservas?salon=${salon}&fecha=${fechaSeleccionada}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Error en la solicitud: ' + response.statusText);
        }
        return response.json();
      })
      .then((data) => {
        if (data.reservas) {
          setReservas(data.reservas);
          generarHorariosDisponibles(data.reservas);
        } else {
          Swal.fire('Error', data.mensaje, 'error');
        }
      })
      .catch((error) => {
        console.error('Error al consultar reservas:', error);
        Swal.fire('Error', 'No se pudieron cargar las reservas. Intente más tarde.', 'error');
      });
  };

  // Generar horarios disponibles basado en las reservas existentes
  const generarHorariosDisponibles = (reservas) => {
    const horarios = [];
    for (let i = 6; i <= 19; i++) {
      const hora = `${i.toString().padStart(2, '0')}:00`;
      const ocupado = reservas.some(
        (reserva) => reserva.horaInicio <= hora && reserva.horaFinal > hora
      );
      horarios.push({ hora, disponible: !ocupado });
    }
    setHorariosDisponibles(horarios);
  };

  // Limpiar el formulario después de una reserva exitosa
  const limpiarFormulario = () => {
    setNombre('');
    setFecha(null);
    setHoraInicio('');
    setHoraFinal('');
    setSalon('');
    setArea('');
    setMotivo('');
  };

  return (
    <div className="kevin">
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
          <DatePicker
            id="fecha"
            selected={fecha}
            onChange={(date) => {
              setFecha(date);
              consultarReservasPorFecha(date.toISOString().split('T')[0]);
            }}
            dateFormat="yyyy-MM-dd"
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

      {horariosDisponibles.length > 0 && (
        <div>
          <h3>Horarios disponibles para {salon} el {fecha?.toLocaleDateString()}</h3>
          <ul>
            {horariosDisponibles.map((horario, index) => (
              <li key={index} style={{ color: horario.disponible ? 'green' : 'red' }}>
                {horario.hora} - {horario.disponible ? 'Disponible' : 'Reservado'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export { ReservaForm };
