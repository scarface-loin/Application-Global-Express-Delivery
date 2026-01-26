import React, { useState, useEffect } from 'react';

const DeliveryLoader = ({ onLoadingComplete, gifUrl }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const loadingSteps = [
    "Démarrage du serveur...",
    "Préparation des informations des livreurs...",
    "Calculs de compatibilité...",
    "Vérification des sécurités..."
  ];

  useEffect(() => {
    if (currentStep < loadingSteps.length) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 2000); // 2 secondes par message pour savourer
      return () => clearTimeout(timer);
    } else if (!isComplete) {
      const finalTimer = setTimeout(() => {
        setIsComplete(true);
        if (onLoadingComplete) {
          onLoadingComplete();
        }
      }, 1500); // Pause de 1.5s après le dernier message
      return () => clearTimeout(finalTimer);
    }
  }, [currentStep, isComplete, onLoadingComplete]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      opacity: isComplete ? 0 : 1,
      transition: 'opacity 0.5s ease-out',
      pointerEvents: isComplete ? 'none' : 'auto',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      {/* Container du GIF de la moto */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '300px',
        height: 'auto',
        marginBottom: '30px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <img 
          src={gifUrl} 
          alt="Moto de livraison"
          style={{
            width: '100%',
            maxWidth: '200px',
            height: 'auto',
            filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
          }}
        />

        {/* La route sous la moto */}
        <div style={{
          position: 'absolute',
          bottom: '-20px',
          left: '0',
          right: '0',
          height: '4px',
          background: 'rgba(255, 255, 255, 0.3)',
          overflow: 'hidden',
          borderRadius: '2px'
        }}>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '0',
            width: '200%',
            height: '2px',
            background: 'repeating-linear-gradient(90deg, transparent, transparent 15px, white 15px, white 30px)',
            transform: 'translateY(-50%)',
            animation: 'roadMove 1s linear infinite'
          }} />
        </div>
      </div>

      {/* Messages de chargement */}
      <div style={{
        minHeight: '120px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        maxWidth: '400px',
        padding: '0 15px',
        boxSizing: 'border-box'
      }}>
        {loadingSteps.map((step, index) => (
          <div
            key={index}
            style={{
              color: 'white',
              fontSize: 'clamp(14px, 4vw, 18px)',
              fontWeight: '500',
              opacity: index === currentStep ? 1 : (index < currentStep ? 0.5 : 0),
              transform: index === currentStep ? 'translateY(0)' : 'translateY(10px)',
              transition: 'all 0.4s ease-out',
              textAlign: 'center',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              width: '100%',
              padding: '8px 0'
            }}
          >
            {index < currentStep && '✓ '}
            {step}
          </div>
        ))}
      </div>

      {/* Barre de progression */}
      <div style={{
        width: '100%',
        maxWidth: '300px',
        height: '4px',
        background: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '2px',
        marginTop: '30px',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          background: 'white',
          borderRadius: '2px',
          width: `${(currentStep / loadingSteps.length) * 100}%`,
          transition: 'width 0.4s ease-out',
          boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
        }} />
      </div>

      {/* Pourcentage */}
      <div style={{
        color: 'white',
        fontSize: 'clamp(12px, 3vw, 14px)',
        marginTop: '15px',
        fontWeight: '600',
        opacity: 0.9
      }}>
        {Math.round((currentStep / loadingSteps.length) * 100)}%
      </div>

      <style>{`
        @keyframes roadMove {
          from {
            transform: translateY(-50%) translateX(0);
          }
          to {
            transform: translateY(-50%) translateX(-30px);
          }
        }
      `}</style>
    </div>
  );
};

export default DeliveryLoader;