import React, { useState } from 'react';
import { FiTruck, FiLock } from 'react-icons/fi';
import Input from '../common/Input';
import Button from '../common/Button';
import Alert from '../common/Alert';
import { loginSuperAdmin, saveSession, updateFirstLoginPassword } from '../../services/authService';

export const LoginPage = ({ onLogin }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  // États changement mot de passe
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [requiresChange, setRequiresChange] = useState(false);
  const [tempAdminInfo, setTempAdminInfo] = useState(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Connexion initiale
  const handleLoginSubmit = async (e) => {
  e.preventDefault();
  console.log("🔵 Tentative de connexion avec:", phone); // <-- AJOUT
  setError('');
  setLoading(true);

  try {
    const adminInfo = await loginSuperAdmin(phone, password);
    console.log("✅ AdminInfo reçu:", adminInfo); // <-- AJOUT
    
    if (adminInfo.mustChangePassword) {
      setTempAdminInfo(adminInfo);
      setRequiresChange(true);
      setLoading(false);
    } else {
      finalizeLogin(adminInfo);
    }
  } catch (err) {
    console.error("❌ ERREUR LOGIN:", err); // <-- AJOUT
    setError(err.message || 'Identifiants incorrects');
    setLoading(false);
  }
};

  // 2. Changement de mot de passe
  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      await updateFirstLoginPassword(tempAdminInfo.uid, newPassword);
      // Mettre à jour l'info locale car le mot de passe n'est plus à changer
      const updatedAdminInfo = { ...tempAdminInfo, mustChangePassword: false };
      finalizeLogin(updatedAdminInfo);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // 3. Finalisation (Appel de onLogin qui vient de App.jsx)
  const finalizeLogin = (adminInfo) => {
    saveSession(adminInfo);
    localStorage.setItem('admin_id', adminInfo.uid);
    // Déclenche le changement d'état dans App.jsx
    if (onLogin) {
        onLogin(adminInfo.token);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            {requiresChange ? <FiLock size={32} className="text-orange-600" /> : <FiTruck size={32} className="text-blue-600" />}
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {requiresChange ? 'Sécurité' : 'Admin Livraisons'}
          </h1>
          <p className="text-gray-600 mt-2">
            {requiresChange ? 'Première connexion : changez votre mot de passe.' : 'Accès Sécurisé'}
          </p>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {!requiresChange ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <Input
              label="Numéro de téléphone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+237 6XX XXX XXX"
              required 
            />
            <Input
              label="Mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <Button type="submit" variant="primary" disabled={loading} className="w-full justify-center">
              {loading ? 'Vérification...' : 'Se connecter'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleChangePasswordSubmit} className="space-y-4 animate-fadeIn">
            <Input
              label="Nouveau mot de passe"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 6 caractères"
              required
            />
            <Input
              label="Confirmer le mot de passe"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Répétez le mot de passe"
              required
            />
            <Button type="submit" variant="primary" disabled={loading} className="w-full justify-center bg-orange-600 hover:bg-orange-700">
              {loading ? 'Mise à jour...' : 'Définir et Accéder'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;