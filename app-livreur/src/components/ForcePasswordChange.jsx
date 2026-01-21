// components/ForcePasswordChange.jsx
import React, { useState } from 'react';
import { Lock, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import apiService from '../services/api';

const ForcePasswordChange = ({ onPasswordChanged }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePassword = (password) => {
    if (password.length < 4) {  // ← Changé de 6 à 4 pour correspondre au backend
      return 'Le mot de passe doit contenir au moins 4 caractères';
    }
    if (password === '0000') {
      return 'Vous ne pouvez pas utiliser le mot de passe par défaut';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    if (currentPassword === newPassword) {
      setError('Le nouveau mot de passe doit être différent de l\'ancien');
      return;
    }

    setLoading(true);

    try {
      // ← CORRECTION ICI : utiliser la bonne fonction
      const response = await apiService.profile.changePassword(currentPassword, newPassword);
      
      console.log('✅ Réponse changement mot de passe:', response);
      
      // ← CORRECTION : Le backend renvoie directement { message: "..." }
      if (response.message || response.success !== false) {
        // Mettre à jour l'utilisateur dans le localStorage
        const user = apiService.auth.getCurrentUser();
        if (user) {
          user.mustChangePassword = false;
          localStorage.setItem('user', JSON.stringify(user));
        }
        
        // Afficher un message de succès temporaire
        alert('✅ Mot de passe modifié avec succès !');
        
        // Notifier le parent que le mot de passe a été changé
        if (onPasswordChanged) {
          onPasswordChanged();
        }
      } else {
        setError(response.message || 'Erreur lors du changement de mot de passe');
      }
    } catch (err) {
      console.error('❌ Password change error:', err);
      
      // ← CORRECTION : Meilleure gestion des erreurs
      if (err.message) {
        setError(err.message);
      } else if (err.data?.error) {
        setError(err.data.error);
      } else if (err.data?.errors) {
        // Erreur de validation
        const validationErrors = err.data.errors.map(e => e.message).join(', ');
        setError(validationErrors);
      } else {
        setError('Erreur lors du changement de mot de passe');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#f2f2f7' }}>
      <div className="w-full max-w-md">
        {/* En-tête d'avertissement */}
        <div className="bg-orange-50 border border-orange-200 rounded-3xl p-6 mb-6 shadow-sm">
          <div className="flex items-start">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mr-4 flex-shrink-0" 
                 style={{ backgroundColor: '#fb923c' }}>
              <Lock className="text-white" size={24} />
            </div>
            <div>
              <h2 className="font-bold text-orange-900 text-lg mb-1">
                Changement de mot de passe requis
              </h2>
              <p className="text-orange-700 text-sm leading-relaxed">
                Pour des raisons de sécurité, vous devez changer votre mot de passe par défaut avant de continuer.
              </p>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-6 text-xl text-center">
            Créer un nouveau mot de passe
          </h3>

          <form onSubmit={handleSubmit}>
            {/* Message d'erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 animate-shake">
                <div className="flex items-start">
                  <AlertCircle className="text-red-600 mr-3 flex-shrink-0 mt-0.5" size={20} />
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Mot de passe actuel */}
            <div className="mb-5">
              <label className="block text-gray-700 font-medium mb-2 text-sm">
                Mot de passe actuel
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Lock size={20} className="text-gray-400" />
                </div>
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 text-base"
                  style={{ WebkitTapHighlightColor: 'transparent', '--tw-ring-color': '#667eea' }}
                  placeholder="0000"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Nouveau mot de passe */}
            <div className="mb-5">
              <label className="block text-gray-700 font-medium mb-2 text-sm">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Lock size={20} className="text-gray-400" />
                </div>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 text-base"
                  style={{ WebkitTapHighlightColor: 'transparent', '--tw-ring-color': '#667eea' }}
                  placeholder="••••••••"
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="text-gray-500 text-xs mt-1.5">
                Minimum 4 caractères, différent de "0000"
              </p>
            </div>

            {/* Confirmer mot de passe */}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2 text-sm">
                Confirmer le nouveau mot de passe
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Lock size={20} className="text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 text-base"
                  style={{ WebkitTapHighlightColor: 'transparent', '--tw-ring-color': '#667eea' }}
                  placeholder="••••••••"
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Bouton de validation */}
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
                  Modification...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <CheckCircle2 size={20} className="mr-2" />
                  Confirmer le changement
                </div>
              )}
            </button>
          </form>
        </div>

        {/* Info de sécurité */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <p className="text-sm text-blue-800 text-center">
            <span className="font-semibold">Conseil :</span> Choisissez un mot de passe fort que vous seul connaissez
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForcePasswordChange;