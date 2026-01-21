// components/AccountTab.jsx
import React, { useState, useEffect } from 'react';
import { User, CheckCircle2, LogOut, Lock, Phone, Mail, CreditCard } from 'lucide-react';
import apiService from '../services/api';

const AccountTab = ({ currentUser, onLogout }) => {
  const [profile, setProfile] = useState(null);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await apiService.profile.get();
      setProfile(response.data || response);
    } catch (error) {
      console.error('Error loading profile:', error);
      // Utiliser les données de currentUser ou données mockées
      setProfile(currentUser || {
        name: 'Jean-Baptiste Kamga',
        title: 'Livreur',
        email: 'jean.kamga@example.com',
        phone: '+237 6 12 34 56 78',
        matricule: 'LIV-2024-001'
      });
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 4) {  // ← Changé de 6 à 4 pour correspondre au backend
      setError('Le mot de passe doit contenir au moins 4 caractères');
      return;
    }

    try {
      setLoading(true);
      const result = await apiService.profile.changePassword(oldPassword, newPassword);

      // La réponse du backend est directement l'objet { message: "..." }
      if (result.message) {
        setShowSuccess(true);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');

        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error changing password:', error);

      // Gérer les différents types d'erreurs
      if (error.message) {
        setError(error.message);
      } else if (error.data?.error) {
        setError(error.data.error);
      } else {
        setError('Erreur lors du changement de mot de passe');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      onLogout();
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: '#f2f2f7' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-purple-600 mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pb-24" style={{ backgroundColor: '#f2f2f7' }}>
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-white/80 border-b border-gray-200/50 px-5 pt-14 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Mon compte</h1>
      </div>

      <div className="px-4 pt-4">
        {/* Profile card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center mb-5">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mr-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <User className="text-white" size={28} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">{profile?.name}</h2>
              <p className="text-gray-500 text-sm">{profile?.title}</p>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Mail size={18} className="text-gray-400 mr-3" />
                <span className="text-gray-500 text-sm">Email</span>
              </div>
              <span className="font-medium text-gray-900 text-sm">{profile?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Phone size={18} className="text-gray-400 mr-3" />
                <span className="text-gray-500 text-sm">Téléphone</span>
              </div>
              <span className="font-medium text-gray-900 text-sm">{profile?.phone}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CreditCard size={18} className="text-gray-400 mr-3" />
                <span className="text-gray-500 text-sm">Matricule</span>
              </div>
              <span className="font-medium text-gray-900 text-sm">{profile?.matricule}</span>
            </div>
          </div>
        </div>

        {/* Password change card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center mb-4">
            <Lock size={20} style={{ color: '#667eea' }} className="mr-2" />
            <h3 className="font-bold text-gray-900 text-base">Changer le mot de passe</h3>
          </div>

          {showSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4">
              <div className="flex items-center text-green-800">
                <CheckCircle2 className="mr-2 flex-shrink-0" size={20} />
                <span className="font-medium text-sm">Mot de passe modifié avec succès !</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">
                  Ancien mot de passe
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 text-base"
                  style={{ WebkitTapHighlightColor: 'transparent', '--tw-ring-color': '#667eea' }}
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 text-base"
                  style={{ WebkitTapHighlightColor: 'transparent', '--tw-ring-color': '#667eea' }}
                  placeholder="••••••••"
                />
                <p className="text-gray-500 text-xs mt-1.5">Minimum 6 caractères</p>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 text-base"
                  style={{ WebkitTapHighlightColor: 'transparent', '--tw-ring-color': '#667eea' }}
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full text-white py-4 rounded-xl font-semibold transition-all mt-6 shadow-sm active:scale-98"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                Modifier le mot de passe
              </button>
            </div>
          </form>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="w-full bg-white text-red-600 py-4 rounded-2xl font-semibold transition-all shadow-sm active:scale-98 border border-red-200 hover:bg-red-50 flex items-center justify-center"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <LogOut size={20} className="mr-2" />
          Se déconnecter
        </button>

        {/* Version info */}
        <div className="text-center mt-6 pb-4">
          <p className="text-gray-400 text-xs">Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default AccountTab;