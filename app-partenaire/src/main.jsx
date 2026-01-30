/**
 * 🚪 MAIN - Point d'entrée de l'application partenaire(MAIN.JSX)
 */

import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { FiBriefcase, FiPhone, FiLock, FiAlertCircle, FiCheckCircle, FiSave } from 'react-icons/fi';
import { useAuth } from './hooks/useAuth';
import PartenaireApp from './PartenaireApp';
import { updatePartenairePassword } from './services/firebase.service'; // Import de la nouvelle fonction
import './index.css';

// --- COMPOSANT : Formulaire de changement de mot de passe ---
function ForceChangePassword({ partenaire, onPasswordChanged }) {
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (passwords.new.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (passwords.new !== passwords.confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (passwords.new === '123456') {
      setError("Veuillez choisir un mot de passe différent de celui par défaut.");
      return;
    }

    setLoading(true);
    try {
      await updatePartenairePassword(partenaire.id, passwords.new);
      onPasswordChanged(); // Notifier le parent que c'est fini
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border-2 border-orange-100">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
            <FiLock size={32} className="text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Sécurité du compte</h2>
          <p className="text-gray-600 mt-2 text-sm">
            Pour votre sécurité, vous devez changer votre mot de passe par défaut avant de continuer.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
            <FiAlertCircle className="text-red-600 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nouveau mot de passe</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
              placeholder="Min. 6 caractères"
              value={passwords.new}
              onChange={(e) => setPasswords({...passwords, new: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Confirmer le mot de passe</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
              placeholder="Répétez le mot de passe"
              value={passwords.confirm}
              onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-orange-600 text-white rounded-xl font-bold shadow-lg hover:bg-orange-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Mise à jour...' : <><FiSave /> Enregistrer et continuer</>}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- COMPOSANT RACINE ---
function PartenaireRoot() {
  // On récupère aussi une méthode pour recharger l'état local si besoin, 
  // ou on force simplement un reload via window.location dans le pire des cas.
  // Ici, nous allons modifier le hook useAuth pour qu'il mette à jour son state interne.
  const { isAuthenticated, currentPartenaire, loading, login, logout } = useAuth();
  
  // État local pour le formulaire de connexion
  const [telephone, setTelephone] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Pour forcer le re-rendu après changement de mot de passe si le hook ne le fait pas auto
  const [forceUpdate, setForceUpdate] = useState(0);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);

    try {
      const result = await login(telephone, motDePasse);
      if (!result.success) {
        setLoginError(result.error);
      }
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoggingIn(false);
    }
  };

  const handlePasswordChanged = () => {
    // Le service a déjà mis à jour le localStorage.
    // On force simplement un rafraîchissement de la page pour recharger useAuth proprement
    // Ou on modifie l'état local si on veut être SPA pur, mais reload est plus sûr ici.
    window.location.reload();
  };

  // 1. Écran de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // 2. Si authentifié
  if (isAuthenticated && currentPartenaire) {
    // 2.1 Vérification PREMIÈRE CONNEXION
    if (currentPartenaire.isFirstLogin) {
      return (
        <ForceChangePassword 
          partenaire={currentPartenaire} 
          onPasswordChanged={handlePasswordChanged} 
        />
      );
    }

    // 2.2 App normale
    return <PartenaireApp partenaireId={currentPartenaire.id} onLogout={logout} />;
  }

  // 3. Sinon, afficher la page de login
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl mb-4 shadow-lg">
            <FiBriefcase size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Espace Partenaire</h1>
          <p className="text-gray-600">Gérez vos commandes de livraison</p>
        </div>

        {/* Message d'erreur */}
        {loginError && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <FiAlertCircle className="text-red-600 flex-shrink-0" size={20} />
              <div>
                <p className="text-sm font-semibold text-red-900">Erreur de connexion</p>
                <p className="text-xs text-red-700 mt-1">{loginError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleLogin} className="space-y-5">
          
          {/* Téléphone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Numéro de téléphone
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FiPhone className="text-gray-400" size={20} />
              </div>
              <input
                type="tel"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="+237 6XX XXX XXX"
                required
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FiLock className="text-gray-400" size={20} />
              </div>
              <input
                type="password"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Bouton */}
          <button
            type="submit"
            disabled={loggingIn}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loggingIn ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Connexion en cours...
              </>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        {/* Aide */}
        <div className="mt-6 bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex gap-3">
            <FiAlertCircle className="text-purple-600 flex-shrink-0 mt-0.5" size={18} />
            <div className="text-xs text-purple-900">
              <p className="font-semibold mb-1">Première connexion ?</p>
              <p>Utilisez le mot de passe par défaut : <span className="font-bold">123456</span></p>
            </div>
          </div>
        </div>

        {/* Dev mode */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setTelephone('+237691234567');
                setMotDePasse('123456');
              }}
              className="text-xs text-gray-500 hover:text-purple-600 underline"
            >
              [Dev] Remplir avec compte test
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <PartenaireRoot />
    </React.StrictMode>
  );
}