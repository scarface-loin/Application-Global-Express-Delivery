// src/components/CarLoader.jsx

import React from 'react';
import './CarLoader.css'; // Nous créerons ce fichier juste après

const CarLoader = ({ text = "Chargement en cours..." }) => {
  return (
    <div className="loader-container">
      <div className="car-animation-wrapper">
        {/* SVG de la camionnette de livraison */}
        <svg className="delivery-van" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 50">
          <g fill="#667EEA">
            {/* Corps de la camionnette */}
            <path d="M5,20 H60 V40 H80 L95,20 H115 V40 H118 V45 H115 A5,5 0 0,1 110,50 H10 A5,5 0 0,1 5,45 V20 Z" />
            {/* Fenêtre */}
            <path fill="#FFFFFF" d="M62,22 H78 L90,22 V38 H62 Z" />
          </g>
          {/* Roues - avec une classe pour l'animation */}
          <g fill="#2D3748">
            <circle className="wheel" cx="25" cy="45" r="5" />
            <circle className="wheel" cx="100" cy="45" r="5" />
          </g>
        </svg>

        {/* La route */}
        <div className="road">
          <div className="road-lines"></div>
        </div>
      </div>
      <p className="loading-text">{text}</p>
    </div>
  );
};

export default CarLoader;