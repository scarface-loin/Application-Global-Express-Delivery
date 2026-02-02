import React, { useState } from 'react';
import { FiTruck } from 'react-icons/fi';
import Input from '../common/Input';
import Button from '../common/Button';
import Alert from '../common/Alert';
// import { apiRequest } from '../../services/api'; // Backend désactivé temporairement

export const LoginPage = ({ onLogin }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // --- DÉBUT MODIFICATION : BYPASS BACKEND ---
    
    // On simule un petit délai pour l'effet visuel, puis on valide
    setTimeout(() => {
      // On passe un faux token pour que l'app croie qu'on est connecté
      const fakeToken = "token-de-test-bypass-backend"; 
      onLogin(fakeToken);
      setLoading(false);
    }, 500);

    /* CODE BACKEND ORIGINAL (COMMENTÉ)
    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phone, password }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.token) {
        onLogin(response.token);
      }
    } catch (err) {
      setError(err.message || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
    */
    // --- FIN MODIFICATION ---
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <FiTruck size={32} className="text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Super-Admin Livraisons</h1>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Numéro de téléphone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+237 6XX XXX XXX"
            // required // J'ai enlevé required pour que tu puisses cliquer vite sans rien remplir si tu veux
          />
          <Input
            label="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            // required
          />
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="w-full justify-center"
          >
            {loading ? 'Connexion...' : 'Se connecter (Bypass)'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;