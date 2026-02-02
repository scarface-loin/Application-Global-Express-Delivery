// src/components/auth/LoginPage.js

import React, { useState } from 'react';
import { FiTruck } from 'react-icons/fi';
import Input from '../common/Input';
import Button from '../common/Button';
import Alert from '../common/Alert';
import { loginSuperAdmin, saveSession } from '../../services/authService'; // Importez les nouvelles fonctions

const LoginPage = ({ onLogin }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // On appelle notre nouvelle fonction de login
      const adminInfo = await loginSuperAdmin(phone, password);
      
      // Si la connexion réussit, on sauvegarde en local
      saveSession(adminInfo);
      
      // On notifie l'application parente que la connexion est réussie
      onLogin(adminInfo);

    } catch (err) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <FiTruck size={32} className="text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Super-Admin Livraisons</h1>
          <p className="text-gray-600 mt-2">Connexion sécurisée</p>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        <form onSubmit={handleSubmit} className="space-y-4">
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
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="w-full justify-center"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;