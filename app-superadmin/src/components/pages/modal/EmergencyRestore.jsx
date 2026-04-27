import React, { useState } from 'react';
// ATTENTION: Ajustez ce chemin d'import pour pointer vers votre fichier Logic.
import { annulerResetAccidentel } from './DeliveryDriverSalaryPageLogic'; 

const EmergencyRestore = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);

  const handleRestore = async () => {
    const confirmMsg = "ATTENTION : Êtes-vous absolument sûr de vouloir annuler la dernière réinitialisation des salaires ?\n\nCela va ramener les cycles et les dettes de vos livreurs à l'état exact AVANT votre clic accidentel.";
    
    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    setMessage(null);
    setIsError(false);

    try {
      // Appel de la fonction de restauration
      const result = await annulerResetAccidentel();
      setMessage("✅ Succès : " + result.message + " Vous pouvez maintenant recharger votre page des salaires.");
      setIsError(false);
    } catch (error) {
      console.error(error);
      setMessage("❌ Erreur : " + (error.message || "Une erreur est survenue lors de la restauration."));
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '600px', 
      margin: '50px auto', 
      fontFamily: 'sans-serif', 
      border: '2px solid #d32f2f', 
      borderRadius: '8px', 
      backgroundColor: '#fff5f5',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ color: '#d32f2f', marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
        🚨 Restauration d'Urgence des Salaires
      </h2>
      <p style={{ color: '#555', lineHeight: '1.6' }}>
        Utilisez ce bouton <b>uniquement</b> si vous avez cliqué par erreur sur "Réinitialiser" dans la page des salaires.<br/>
        Cette action va rechercher la toute dernière sauvegarde effectuée par le système et annuler la réinitialisation.
      </p>

      <button 
        onClick={handleRestore}
        disabled={loading}
        style={{
          backgroundColor: loading ? '#ccc' : '#d32f2f',
          color: 'white',
          padding: '14px 24px',
          border: 'none',
          borderRadius: '6px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: loading ? 'not-allowed' : 'pointer',
          width: '100%',
          marginTop: '15px',
          transition: 'background-color 0.2s'
        }}
      >
        {loading ? 'Restauration en cours, veuillez patienter...' : '⚠️ ANNULER LE DERNIER RESET ACCIDENTEL'}
      </button>

      {message && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: isError ? '#ffebee' : '#e8f5e9', 
          color: isError ? '#c62828' : '#2e7d32',
          border: `1px solid ${isError ? '#ef9a9a' : '#a5d6a7'}`,
          borderRadius: '6px',
          fontWeight: 'bold',
          lineHeight: '1.4'
        }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default EmergencyRestore;