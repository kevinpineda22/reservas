import React, { useState, useMemo } from "react";
import Swal from "sweetalert2"; // Importa SweetAlert2
import DatePicker, { registerLocale } from "react-datepicker"; // Importa react-datepicker
import "react-datepicker/dist/react-datepicker.css"; // Importa estilos de react-datepicker
import "../pages/Reserva.css";
import { es } from "date-fns/locale"; // Importa el idioma español de date-fns

registerLocale("es", es); // Registra el idioma español

function ReservaForm() {
  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState(null);
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFinal, setHoraFinal] = useState("");
  const [horasDisponibles, setHorasDisponibles] = useState([]);
  const [salon, setSalon] = useState("");
  const [area, setArea] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  const [reservas, setReservas] = useState([]);
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const [mostrarCancelar, setMostrarCancelar] = useState(false); // Estado para alternar formularios
  const [nombreCancelar, setNombreCancelar] = useState("");
  const [areaCancelar, setAreaCancelar] = useState("");
  const [salonCancelar, setSalonCancelar] = useState("");
  // Estados de errores para cada campo
  const [errorNombre, setErrorNombre] = useState("");
  const [errorMotivo, setErrorMotivo] = useState("");
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
    if (
      !nombre ||
      !fecha ||
      !horaInicio ||
      !horaFinal ||
      !salon ||
      !area ||
      !motivo
    ) {
      setError("Por favor, completa todos los campos.");
      return false;
    }
    if (horaInicio >= horaFinal) {
      setError("La hora de inicio debe ser antes de la hora final.");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    // Verificamos si el formulario es válido
    if (!validarFormulario()) {
      return;
    }

    const reservaData = {
      nombre,
      fecha,
      horaInicio,
      horaFinal,
      salon,
      area,
      motivo,
    };

    // Mostrar la confirmación antes de proceder
    Swal.fire({
      title: "¿Confirmas tu reserva?",
      html: `
        <p style="color: blue;"><strong>Nombre:</strong> ${nombre}</p>
        <p><strong>Fecha:</strong> ${
          fecha ? fecha.toISOString().split("T")[0] : "No seleccionada"
        }</p> 
        <p><strong>Hora de Inicio:</strong> ${horaInicio}</p>
        <p><strong>Hora Final:</strong> ${horaFinal}</p>
        <p><strong>Salón:</strong> ${salon}</p>
        <p><strong>Área:</strong> ${area}</p>
        <p><strong>Motivo:</strong> ${motivo}</p>
      `,
      icon: "info",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Confirmar Reserva",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        // Si el usuario confirma la reserva, la enviamos al servidor
        fetch("https://reservas-zer3.onrender.com/reservar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reservaData),
        })
          .then((response) => {
            // Verificar si la respuesta es exitosa

            if (!response.ok) {
              throw new Error("Hubo un problema con la reserva.");
            }
            return response.json();
          })
          .then((data) => {
            // Log de la respuesta para depuración
            console.log("Respuesta del servidor:", data);

            // Asegurarse de que el mensaje de éxito esté presente
            if (data.mensaje === "Reserva almacenada exitosamente") {
              // Si la reserva se almacena correctamente, mostrar el mensaje de éxito
              Swal.fire(
                "¡Reserva realizada!",
                "Tu reserva ha sido registrada con éxito.",
                "success"
              ).then(() => {
                // Redirigir a otra página después de la confirmación
                window.location.href = "https://www.merkahorro.com/";
              });
            } else {
              // Si no se recibe el mensaje esperado, mostrar un mensaje de error
              Swal.fire(
                "Error",
                data.mensaje ||
                  "Hubo un problema al guardar la reserva. Intenta más tarde.",
                "error"
              );
            }
          })
          .catch((error) => {
            // Manejo de error en caso de problemas con la red o servidor
            console.error("Error al realizar la reserva:", error);
            Swal.fire(
              "Error",
              error.message ||
                "No se pudo realizar la reserva. Intente más tarde.",
              "error"
            );
          });
      } else {
        // Si el usuario cancela, no hacemos nada
        console.log("Reserva cancelada por el usuario.");
      }
    });
  };

  // Consultar reservas para un salón y fecha específicos
  const consultarReservasPorFecha = (fechaSeleccionada) => {
    if (!salon) {
      Swal.fire(
        "Error",
        "Por favor selecciona un salón para consultar las reservas.",
        "warning"
      );
      return;
    }
    fetch(
      `https://reservas-zer3.onrender.com/reservas?fecha=${fechaSeleccionada}&salon=${salon}&horaInicio=${horaInicio}&horaFinal=${horaFinal}`,
      {
        method: "GET",
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Error al obtener las reservas");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Datos de reservas disponibles:", data); // Verifica que los datos incluyen 'usuario_nombre'
        if (data.horarios) {
          setReservas(data.horarios); // Actualiza los horarios
          generarHorariosDisponibles(data.horarios); // Genera horarios disponibles
        } else {
          Swal.fire(
            "Error",
            "No se encontraron reservas para esta fecha y salón.",
            "error"
          );
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        Swal.fire(
          "Error",
          "No se pudieron cargar las reservas. Intente más tarde.",
          "error"
        );
      });
  };

  const handleCancelarSubmit = (e) => {
    e.preventDefault(); // Evitar recarga de la página

    // Validación
    if (!nombreCancelar || !areaCancelar || !salonCancelar) {
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Por favor, complete todos los campos para cancelar la reserva.",
      });
      return;
    }

    // Mostrar confirmación antes de proceder
    Swal.fire({
      title: "¿Está seguro?",
      text: `Está a punto de cancelar la reserva. ¿Desea continuar?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No, mantener reserva",
    }).then((result) => {
      if (result.isConfirmed) {
        // Construir la URL
        const url = `https://reservas-zer3.onrender.com/cancelarReserva?nombre=${encodeURIComponent(
          nombreCancelar
        )}&area=${encodeURIComponent(areaCancelar)}&salon=${encodeURIComponent(
          salonCancelar
        )}`;

        // Realizar la petición DELETE
        fetch(url, {
          method: "DELETE",
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`Error en la solicitud: ${response.status}`);
            }
            return response.json();
          })
          .then((data) => {
            Swal.fire({
              icon: "success",
              title: "Reserva cancelada",
              text: data.mensaje,
            }).then(() => {
              // Redirigir a una nueva URL después de mostrar el mensaje
              window.location.href = "https://www.merkahorro.com/"; // Reemplaza con la URL deseada
            });

            // Limpiar campos tras cancelar
            setNombreCancelar("");
            setAreaCancelar("");
            setSalonCancelar("");
          })
          .catch((error) => {
            console.error("Error al cancelar la reserva:", error);
            Swal.fire({
              icon: "error",
              title: "Error",
              text: "Hubo un problema al cancelar la reserva.",
            });
          });
      }
    });
  };

  // Generar horarios disponibles basado en las reservas existentes
  const generarHorariosDisponibles = (reservas) => {
    const horarios = [];
    for (let i = 6; i <= 19; i++) {
      const hora = `${i.toString().padStart(2, "0")}:00`;

      // Encuentra si el horario está ocupado y quién lo reservó
      const reservaOcupada = reservas.find(
        (reserva) => reserva.hora_inicio <= hora && reserva.hora_fin > hora // Ajusta según tu estructura
      );

      horarios.push({
        hora,
        disponible: !reservaOcupada, // Si hay una reserva, no está disponible
        reservadoPor: reservaOcupada ? reservaOcupada.nombre : null, // Nombre de quien reservó o null
      });
    }
    setHorariosDisponibles(horarios); // Guardar la lista completa con estados
  };

  // Limpiar el formulario después de una reserva exitosa
  const limpiarFormulario = () => {
    setNombre("");
    setFecha(null);
    setHoraInicio("");
    setHoraFinal("");
    setSalon("");
    setArea("");
    setMotivo("");
  };

 // Función para manejar la validación del nombre
const validarNombre = (e) => {
  const value = e.target.value;
  const regex = /^[a-zA-Z\s]+$/; // Solo letras y espacios

  // Validación de caracteres
  if (!regex.test(value) && value !== "") {
    setErrorNombre("El nombre solo puede contener letras y espacios");
  }
  // Validación de longitud
  else if (value.length > 30) {
    setErrorNombre("El nombre no puede tener más de 30 caracteres");
  } 
  else {
    setErrorNombre(""); // Si no hay errores, se limpia el mensaje
    setNombre(value);
  }
};


  // Función para manejar la validación del motivo
  const validarMotivo = (e) => {
    const value = e.target.value;
    const regex = /^[a-zA-Z\s]+$/; // Solo letras y espacios

    if (value.length > 60) {
      setErrorMotivo("El motivo no puede exceder los 60 caracteres");
    } else if (!regex.test(value) && value !== "") {
      setErrorMotivo("El motivo solo puede contener letras y espacios");
    } else {
      setErrorMotivo("");
      setMotivo(value);
    }
  };

  return (
    <div>
      {!mostrarCancelar && (
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
                {/* <option value="Sala de reserva">Sala de reserva</option> */}
              </select>
            </div>
            <div>
              <label htmlFor="nombre">Nombre y Apellido:</label>
              <input
                type="text"
                id="nombre"
                value={nombre}
                onChange={validarNombre}
                required
              />
              {errorNombre && (
                <p
                  style={{ color: "red", fontSize: "0.9em", marginTop: "5px" }}
                >
                  {errorNombre}
                </p>
              )}
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
                <option value="Gerencia">Gerencia</option>
                <option value="Gestión humana">Dirección Gestión humana</option>
                <option value="Operaciones">Dirección Operaciones</option>
                <option value="Contabilidad">Dirección Administrativa y Financiera</option>
                <option value="Comercial">Dirección Comercial</option>
                <option value="Bachilleres">Escuela de Bachilleres</option>
               
              </select>
            </div>
            <div>
              <label htmlFor="motivo">Motivo de la reserva:</label>
              <textarea
                id="motivo"
                value={motivo}
                onChange={validarMotivo}
              ></textarea>
               {errorMotivo && (
                <p
                  style={{ color: "red", fontSize: "0.9em", marginTop: "5px" }}
                >
                  {errorMotivo}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="fecha">Fecha:</label>
              <DatePicker
                id="fecha"
                selected={fecha}
                onChange={(date) => {
                  setFecha(date);
                  consultarReservasPorFecha(date.toISOString().split("T")[0]); // Actualiza horarios
                }}
                dateFormat="yyyy-MM-dd"
                locale="es"
                showTimeSelect={false}
                required
              />
            </div>
            <div>
              <label htmlFor="horaInicio">Hora de Inicio:</label>
              <select
                id="horaInicio"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                required
              >
                <option value="">Seleccione una hora</option>
                {horariosDisponibles.map(
                  ({ hora, disponible, reservadoPor }) => (
                    <option key={hora} value={hora} disabled={!disponible}>
                      {hora}{" "}
                      {disponible
                        ? ""
                        : `Reservado por: ${reservadoPor || "nul"}`}
                    </option>
                  )
                )}
              </select>
            </div>
            <div>
              <label htmlFor="horaFinal">Hora Final:</label>
              <select
                id="horaFinal"
                value={horaFinal}
                onChange={(e) => setHoraFinal(e.target.value)}
                required
              >
                <option value="">Seleccione una hora</option>
                {horariosDisponibles.map(
                  ({ hora, disponible, reservadoPor }) => (
                    <option key={hora} value={hora} disabled={!disponible}>
                      {hora}{" "}
                      {disponible
                        ? ""
                        : `Reservado por: ${reservadoPor || "nul"}`}
                    </option>
                  )
                )}
              </select>
            </div>
            <button type="submit" className="btn-primary">
              Reservar
            </button>
            <button
              className="btn-primary"
              onClick={() => setMostrarCancelar(!mostrarCancelar)}
            >
              {mostrarCancelar ? "Volver a Reservar" : "Cancelar Reserva"}
            </button>
          </form>
        </div>
      )}

      {/* Formulario de Cancelar */}
      {mostrarCancelar && (
        <div className="cancelar">
          <h2>Cancelar Reserva</h2>
          <form onSubmit={handleCancelarSubmit}>
            <div>
              <label htmlFor="nombre">Nombre y Apellido:</label>
              <input
                type="text"
                id="nombre"
                value={nombreCancelar}
                onChange={(e) => setNombreCancelar(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="area">Área:</label>
              <select
                id="area"
                value={areaCancelar}
                onChange={(e) => setAreaCancelar(e.target.value)}
                required
              >
                <option value="">Seleccione el área</option>
                <option value="Gerencia">Gerencia</option>
                <option value="Gestión humana">Dirección Gestión humana</option>
                <option value="Operaciones">Dirección Operaciones</option>
                <option value="Contabilidad">Dirección Administrativa y Financiera</option>
                <option value="Comercial">Dirección Comercial</option>
                <option value="Bachilleres">Escuela de Bachilleres</option>
                
              </select>
            </div>
            <div>
              <label htmlFor="salon">Salón:</label>
              <select
                id="salon"
                value={salonCancelar}
                onChange={(e) => setSalonCancelar(e.target.value)}
                required
              >
                <option value="">Seleccione el salón</option>
                <option value="Auditorio Principal">Auditorio Principal</option>
                <option value="Sala de Juntas">Sala de Juntas</option>
                {/* <option value="Sala de reserva">Sala de reserva</option> */}
              </select>
            </div>

            <button className="btn-primary" type="submit">
              Cancelar Reserva
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export { ReservaForm };
