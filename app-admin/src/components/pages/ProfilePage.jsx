import React, { useState } from 'react';
import { FiLock, FiShield, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

const ProfilePage = () => {
  const { user } = useAuth();
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validations
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    if (passwords.newPassword.length < 6) {
      setError('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (passwords.currentPassword === passwords.newPassword) {
      setError('Le nouveau mot de passe doit être différent de l\'ancien');
      return;
    }

    setLoading(true);

    try {
      const adminId = localStorage.getItem('admin_id');
      
      if (!adminId) {
        throw new Error('Session invalide. Veuillez vous reconnecter.');
      }

      // 1. Vérifier l'ancien mot de passe en récupérant le document
      const adminRef = doc(db, "admins", adminId);
      const adminSnap = await getDoc(adminRef);

      if (!adminSnap.exists()) {
        throw new Error('Administrateur introuvable');
      }

      const adminData = adminSnap.data();

      // Vérification du mot de passe actuel
      if (adminData.motDePasse !== passwords.currentPassword) {
        throw new Error('Le mot de passe actuel est incorrect');
      }

      // 2. Mettre à jour le mot de passe
      await updateDoc(adminRef, {
        motDePasse: passwords.newPassword,
        mustChangePassword: false,
        dateChangementMotDePasse: new Date().toISOString()
      });

      // Succès
      setSuccess('Mot de passe modifié avec succès !');
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

    } catch (err) {
      console.error("Erreur changement mot de passe:", err);
      setError(err.message || 'Erreur lors de la modification du mot de passe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        
        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4">
            <FiLock size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Sécurité</h1>
          <p className="text-gray-600 mt-2">Changement de mot de passe</p>
          {user && (
            <p className="text-sm text-gray-500 mt-1">
              Connecté en tant que: <span className="font-medium">{user.nom || user.telephone}</span>
            </p>
          )}
        </div>

        {/* Carte principale */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          
          {/* Messages */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <FiAlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-semibold text-red-900 text-sm">Erreur</h4>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
              <FiCheck className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-semibold text-green-900 text-sm">Succès</h4>
                <p className="text-green-700 text-sm mt-1">{success}</p>
              </div>
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Mot de passe actuel */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mot de passe actuel
              </label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  placeholder="Entrez votre mot de passe actuel"
                  required
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>

            {/* Nouveau mot de passe */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <FiShield className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  placeholder="Au moins 6 caractères"
                  required
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Minimum 6 caractères
              </p>
            </div>

            {/* Confirmation */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirmer le nouveau mot de passe
              </label>
              <div className="relative">
                <FiShield className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  placeholder="Retapez le nouveau mot de passe"
                  required
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>

            {/* Bouton de soumission */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Modification en cours...</span>
                  </>
                ) : (
                  <>
                    <FiShield size={18} />
                    <span>Modifier le mot de passe</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Conseils de sécurité */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              💡 Conseils de sécurité
            </h3>
            <ul className="space-y-2 text-xs text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Utilisez un mot de passe unique que vous n'utilisez nulle part ailleurs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Combinez lettres majuscules, minuscules, chiffres et caractères spéciaux</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Ne partagez jamais votre mot de passe avec qui que ce soit</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Changez régulièrement votre mot de passe (tous les 3-6 mois)</span>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;