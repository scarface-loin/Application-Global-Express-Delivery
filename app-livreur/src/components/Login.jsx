// components/Login.jsx
import React, { useState } from 'react';
import { Phone, Lock, AlertCircle } from 'lucide-react';
import apiService from '../services/api';

const Login = ({ onLoginSuccess }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!phone || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    // Nettoyer le numéro de téléphone (enlever les espaces)
    const cleanPhone = phone.replace(/\s/g, '');

    setLoading(true);

    try {
      const result = await apiService.auth.login({
        phone: cleanPhone,
        password: password
      });
      
      console.log('Login result:', result); // Debug
      
      if (result.success) {
        // Le token et user sont déjà stockés par apiService.auth.login
        // Appeler le callback avec les infos utilisateur
        onLoginSuccess(result.user, result.mustChangePassword || false);
      } else {
        // Gérer les erreurs du serveur
        const errorMessage = result.message || 
                            result.data?.message || 
                            'Échec de la connexion';
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Login catch error:', err);
      setError('Une erreur inattendue est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Formatteur de numéro de téléphone (ajoute des espaces)
  const formatPhone = (value) => {
    // Enlever tout ce qui n'est pas chiffre
    const numbers = value.replace(/\D/g, '');
    
    // Limiter à 9 chiffres (format Cameroun)
    const limitedNumbers = numbers.slice(0, 9);
    
    // Formater avec des espaces tous les 2 chiffres
    let formatted = '';
    for (let i = 0; i < limitedNumbers.length; i++) {
      if (i > 0 && i % 2 === 0) {
        formatted += ' ';
      }
      formatted += limitedNumbers[i];
    }
    
    return formatted;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#f2f2f7' }}>
      <div className="w-full max-w-md">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-lg" 
               style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <span className="text-white font-bold text-3xl">L</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Livraison Express</h1>
          <p className="text-gray-500">Connectez-vous à votre compte</p>
        </div>

        {/* Formulaire de connexion */}
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
          <form onSubmit={handleSubmit}>
            {/* Message d'erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
                <div className="flex items-start">
                  <AlertCircle className="text-red-600 mr-3 flex-shrink-0 mt-0.5" size={20} />
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Champ téléphone */}
            <div className="mb-5">
              <label className="block text-gray-700 font-medium mb-2 text-sm">
                Numéro de téléphone
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Phone size={20} className="text-gray-400" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 text-base"
                  style={{ WebkitTapHighlightColor: 'transparent', '--tw-ring-color': '#667eea' }}
                  placeholder="62 21 12 29 8"
                  disabled={loading}
                  inputMode="numeric"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Format: 622112298</p>
            </div>

            {/* Champ mot de passe */}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2 text-sm">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Lock size={20} className="text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 text-base"
                  style={{ WebkitTapHighlightColor: 'transparent', '--tw-ring-color': '#667eea' }}
                  placeholder="matricule123"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Bouton de connexion */}
            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-4 rounded-xl font-semibold transition-all shadow-md active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                background: loading ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Connexion...
                </div>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          {/* Info mot de passe par défaut */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-center text-sm text-gray-500">
              Première connexion ? <br />
              Utilisez le mot de passe par défaut : <span className="font-semibold text-gray-700">matricule123</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 mt-6">
          © 2026 Livraison Express. Tous droits réservés.
        </p>
      </div>
    </div>
  );
};

export default Login;