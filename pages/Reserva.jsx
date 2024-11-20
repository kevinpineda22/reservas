import React, { useState,useMemo,    } from 'react';
import Swal from 'sweetalert2'; // Importa SweetAlert2
import DatePicker from 'react-datepicker'; // Importa react-datepicker
import 'react-datepicker/dist/react-datepicker.css'; // Importa estilos de react-datepicker
import '../pages/Reserva.css';
import {useTable} from 'react-table'; // tablas dinamicas
 



function ReservaForm() {
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState(null);
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFinal, setHoraFinal] = useState('');
  const [horasDisponibles, setHorasDisponibles] = useState([]);
  const [salon, setSalon] = useState('');
  const [area, setArea] = useState('');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');
  const [reservas, setReservas] = useState([]);
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);

  const mostrarHoras = () => {
    // Generar las horas de 6:00 AM a 5:00 PM
    const horas = [];
    for (let i = 6; i <= 19; i++) {
      let hora = i < 10 ? `0${i}:00` : `${i}:00`; // Formatear como 06:00, 07:00, etc.
      horas.push(hora);
    }
    setHorasDisponibles(horas);
  };

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
      return;
    }
  
    const reservaData = { nombre, fecha, horaInicio, horaFinal, salon, area, motivo };
  
    // Hacer una solicitud para verificar si el horario está disponible
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
          // Si no hay conflictos, muestra la confirmación de la reserva
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
              // Si el usuario confirma la reserva, la registramos
              fetch('https://reservas-zer3.onrender.com/reservar', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(reservaData),
              })
                .then((response) => response.json())
                .then((data) => {
                  Swal.fire('¡Reserva realizada!', 'Tu reserva ha sido registrada con éxito.', 'success')
                    .then(() => {
                      // Redirige a la página deseada después de la confirmación
                      window.location.href = 'https://www.merkahorro.com/';
                    });
                })
                .catch((error) => {
                  console.error('Error al hacer la reserva:', error);
                  Swal.fire('Error', 'No se pudo realizar la reserva. Intente más tarde.', 'error');
                });
            } else {
              // Si el usuario cancela, no hacemos nada (no se guarda la reserva)
              console.log('Reserva cancelada por el usuario.');
            }
          });
        }
      })
      .catch((error) => {
        console.error('Error al verificar la disponibilidad:', error);
        Swal.fire('Error', 'Hubo un problema al verificar la disponibilidad. Intente de nuevo más tarde.', 'error');
      });
  };
  
  // Consultar reservas para un salón y fecha específicos
  const consultarReservasPorFecha = (fechaSeleccionada) => {
    if (!salon) {
      Swal.fire('Error', 'Por favor selecciona un salón para consultar las reservas.', 'warning');
      return;
    }
    fetch(`https://reservas-zer3.onrender.com/reservas?fecha=${fechaSeleccionada}&salon=${salon}&horaInicio=${horaInicio}&horaFinal=${horaFinal}`, {
      method: 'GET',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Error al obtener las reservas');
        }
        return response.json();
      })
      .then((data) => {
        console.log('Datos de reservas disponibles:', data);
        if (data.reservasDisponibles) {
          setReservas(data.reservasDisponibles); // Actualiza la lista de reservas
          generarHorariosDisponibles(data.reservasDisponibles); // Genera horarios disponibles
        } else {
          Swal.fire('Error', 'No se encontraron reservas para esta fecha y salón.', 'error');
        }
      })
      .catch((error) => {
        console.error('Error:', error);
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
        <select
          id="horaInicio"
          value={horaInicio}
          onFocus={mostrarHoras}  // Al hacer clic, mostramos las horas
          onChange={(e) => setHoraInicio(e.target.value)}
          required
        >
          <option value="">Seleccione una hora</option>
          {horasDisponibles.map((hora) => (
            <option key={hora} value={hora}>
              {hora}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="horaFinal">Hora Final:</label>
        <select
          id="horaFinal"
          value={horaFinal}
          onFocus={mostrarHoras}  // Al hacer clic, mostramos las horas
          onChange={(e) => setHoraFinal(e.target.value)}
          required
        >
          <option value="">Seleccione una hora</option>
          {horasDisponibles.map((hora) => (
            <option key={hora} value={hora}>
              {hora}
            </option>
          ))}
        </select>
      </div>
        <button type="submit">Reservar</button>
      </form>
      
    

    </div>
  );
}

export { ReservaForm };
