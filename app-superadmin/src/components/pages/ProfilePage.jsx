import React, { useState } from 'react';
import { FiLock, FiShield, FiCheck } from 'react-icons/fi';
import Button from '../common/Button';
import Input from '../common/Input';
import Alert from '../common/Alert';
// import { apiRequest } from '../../services/api'; // Backend désactivé

const ProfilePage = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Réinitialiser les messages quand l'utilisateur tape
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // 1. Validation locale simple
    if (formData.newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);

    // 2. Simulation de l'appel API (Bypass Backend)
    setTimeout(() => {
      setLoading(false);
      setSuccess('Votre mot de passe a été modifié avec succès.');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      /* CODE BACKEND RÉEL (COMMENTÉ)
      try {
        await apiRequest('/admin/profile/password', {
          method: 'PATCH',
          body: JSON.stringify({
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword,
          }),
        });
        setSuccess('Mot de passe mis à jour');
      } catch (err) {
        setError(err.message || 'Erreur serveur');
      }
      */
    }, 1000);
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        
        {/* En-tête simple */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FiLock className="text-blue-600" />
            Sécurité du compte
          </h2>
          <p className="text-sm text-gray-500 mt-1">Mettez à jour votre mot de passe</p>
        </div>

        {/* Corps du formulaire */}
        <div className="p-6">
          {error && <Alert type="error" message={error} onClose={() => setError('')} />}
          {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Mot de passe actuel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe actuel
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="password"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="pl-10 w-full"
                />
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Nouveau mot de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <FiShield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="6 caractères minimum"
                  required
                  className="pl-10 w-full"
                />
              </div>
            </div>

            {/* Confirmation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmer le nouveau mot de passe
              </label>
              <div className="relative">
                <FiCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Répétez le mot de passe"
                  required
                  className="pl-10 w-full"
                />
              </div>
            </div>

            {/* Bouton d'action */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full justify-center"
              >
                {loading ? 'Mise à jour...' : 'Enregistrer le nouveau mot de passe'}
              </Button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;