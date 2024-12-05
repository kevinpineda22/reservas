import React from 'react';
import { Link } from 'react-router-dom';
import './header.css';

const Header = () => {
  return (
    <header className="header">
      <h1>Reserva tus espacios</h1>
      <div className="image-container">
        <img src="/img1.jpeg" alt="Imagen 1" className="header-image" />
        <p className="image-title">Auditorio Principal</p>
      </div>
      
      <div className="image-container">
        <img src="/img2.jpeg" alt="Imagen 2" className="header-image" />
        <p className="image-title">Sala de Juntas</p>
      </div>
     

      {/* Enlace a /reservas */}
      <Link to="/reservas" className="reserve-link">
      Reserva aquí
      </Link>
    </header>
  );
};

export { Header };