import React, { useState, useEffect } from 'react';
import { FiUser, FiLock, FiLogOut, FiSave, FiCheck, FiAlertTriangle } from 'react-icons/fi'; // Ajout de FiAlertTriangle
import { fetchLivreurInfo, updateLivreurPassword } from '../logic/LivreurAppLogic'; 

export default function ProfilePage({ livreurId, onLogout, onPasswordChanged, forcePasswordChange = false }) { // NOUVELLES PROPS
  const [livreur, setLivreur] = useState(null);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [status, setStatus] = useState({ loading: false, error: '', success: '' });

  useEffect(() => {
  if (livreurId) {
    fetchLivreurInfo(livreurId)
      .then(setLivreur)
      .catch(err => {
        if (err.message === "LIVREUR_NOT_FOUND") {
          onLogout(); // Redirection si compte supprimé
        } else {
          setStatus(s => ({ ...s, error: "Erreur de chargement du profil." }));
        }
      });
  }
}, [livreurId, onLogout]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: '', success: '' });

    if (passwords.new !== passwords.confirm) {
      setStatus({ loading: false, error: 'Les mots de passe ne correspondent pas', success: '' });
      return;
    }
    
    if (passwords.new.length < 6) {
      setStatus({ loading: false, error: 'Le mot de passe doit contenir au moins 6 caractères', success: '' });
      return;
    }

    try {
      await updateLivreurPassword(livreurId, passwords.new);
      setStatus({ loading: false, error: '', success: 'Mot de passe modifié avec succès !' });
      setPasswords({ current: '', new: '', confirm: '' });

      // Notifier le composant parent (LivreurRoot) que le mot de passe a été changé
      if (onPasswordChanged) {
        onPasswordChanged();
      }

    } catch (err) {
      setStatus({ loading: false, error: err.message, success: '' });
    }
  };

  if (!livreur) return <div className="p-8 text-center">Chargement du profil...</div>;

  return (
    <div className="p-4 pb-24 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>

      {forcePasswordChange && ( // Afficher l'alerte si le changement est obligatoire
        <div className="bg-orange-50 border-2 border-orange-200 text-orange-800 p-4 rounded-xl flex items-start gap-3">
          <FiAlertTriangle size={20} className="text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-orange-900 mb-1">Action Requise !</h3>
            <p className="text-sm">Veuillez changer votre mot de passe pour des raisons de sécurité. Vous ne pourrez pas accéder au reste de l'application tant que ce n'est pas fait.</p>
          </div>
        </div>
      )}

      {/* Info Carte */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
          {livreur.photoUrl ? (
            <img src={livreur.photoUrl} alt="Profil" className="h-full w-full object-cover" />
          ) : (
            <FiUser size={32} className="text-gray-400" />
          )}
        </div>
        <div>
          <h2 className="font-bold text-lg">{livreur.nom}</h2>
          <p className="text-gray-500">{livreur.telephone}</p>
          <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
            Actif
          </span>
        </div>
      </div>

      {/* Formulaire Mot de passe */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FiLock className="text-blue-600" /> Sécurité
        </h3>
        
        <form onSubmit={handleChangePassword} className="space-y-4">
          {/* Le champ de mot de passe actuel n'est pas strictement nécessaire pour un premier login forcé,
              mais il est recommandé pour la sécurité si vous voulez le vérifier. */}
          {/*
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">MOT DE PASSE ACTUEL</label>
            <input 
              type="password"
              value={passwords.current}
              onChange={e => setPasswords({...passwords, current: e.target.value})}
              className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••"
              required={!forcePasswordChange} // Requis seulement si ce n'est PAS un changement forcé
            />
          </div>
          */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">NOUVEAU MOT DE PASSE</label>
            <input 
              type="password"
              value={passwords.new}
              onChange={e => setPasswords({...passwords, new: e.target.value})}
              className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">CONFIRMER</label>
            <input 
              type="password"
              value={passwords.confirm}
              onChange={e => setPasswords({...passwords, confirm: e.target.value})}
              className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••"
              required
            />
          </div>

          {status.error && <p className="text-red-500 text-sm">{status.error}</p>}
          {status.success && <p className="text-green-500 text-sm flex items-center gap-1"><FiCheck /> {status.success}</p>}

          <button 
            type="submit"
            disabled={status.loading || passwords.new.length < 6 || passwords.new !== passwords.confirm}
            className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors flex justify-center items-center gap-2"
          >
            {status.loading ? (
                <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Enregistrement...
                </>
            ) : (
                <><FiSave /> Enregistrer</>
            )}
          </button>
        </form>
      </div>

      {!forcePasswordChange && ( // N'afficher le bouton de déconnexion que si le changement n'est PAS obligatoire
        <button 
          onClick={onLogout}
          className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold flex justify-center items-center gap-2"
        >
          <FiLogOut /> Déconnexion
        </button>
      )}
    </div>
  );
}