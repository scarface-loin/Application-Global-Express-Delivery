import React, { useState } from 'react';
import { FiUser, FiLock, FiTruck, FiPackage } from 'react-icons/fi';
import { db } from '../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import bcrypt from 'bcryptjs';

export default function LivreurLoginPage({ onLogin }) {
  const [credentials, setCredentials] = useState({ telephone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔐 Tentative de connexion pour:', credentials.telephone);

      // Rechercher le livreur par téléphone
      const q = query(
        collection(db, "livreurs"),
        where("telephone", "==", credentials.telephone)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log('❌ Aucun livreur trouvé avec ce numéro');
        setError("Numéro de téléphone ou mot de passe incorrect");
        setLoading(false);
        return;
      }

      const livreurDoc = querySnapshot.docs[0];
      const livreurData = livreurDoc.data();

      console.log('✅ Livreur trouvé:', livreurDoc.id);

      // Vérifier si le compte est actif
      if (livreurData.actif === false) {
        console.log('❌ Compte désactivé');
        setError("Votre compte a été désactivé. Contactez l'administrateur.");
        setLoading(false);
        return;
      }

      // Vérifier le mot de passe
      const isPasswordValid = await bcrypt.compare(
        credentials.password,
        livreurData.motDePasseHash
      );

      if (!isPasswordValid) {
        console.log('❌ Mot de passe incorrect');
        setError("Numéro de téléphone ou mot de passe incorrect");
        setLoading(false);
        return;
      }

      console.log('✅ Authentification réussie');

      // Créer l'objet utilisateur à retourner
      const userData = {
        id: livreurDoc.id,
        nom: livreurData.nom,
        telephone: livreurData.telephone,
        photoUrl: livreurData.photoUrl || null,
        isFirstLogin: livreurData.isFirstLogin || false,
        finance: livreurData.finance || {}
      };

      console.log('📦 Données utilisateur:', userData);

      // Appeler la fonction de callback avec les données utilisateur
      onLogin(userData);

    } catch (err) {
      console.error('❌ Erreur lors de la connexion:', err);
      setError("Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="bg-blue-600 p-4 rounded-2xl shadow-lg">
              <FiTruck size={40} className="text-white" />
            </div>
            <div className="bg-indigo-600 p-4 rounded-2xl shadow-lg">
              <FiPackage size={40} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Global Express</h1>
          <p className="text-gray-600 font-medium">Espace Livreur</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Connexion</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Champ Téléphone */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                Numéro de téléphone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiUser className="text-gray-400" size={20} />
                </div>
                <input
                  type="tel"
                  value={credentials.telephone}
                  onChange={(e) => setCredentials({ ...credentials, telephone: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900 font-medium"
                  placeholder="Ex: 690123456"
                  required
                />
              </div>
            </div>

            {/* Champ Mot de passe */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiLock className="text-gray-400" size={20} />
                </div>
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900 font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            {/* Bouton de connexion */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Connexion en cours...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          {/* Footer info */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              Problème de connexion ? Contactez votre administrateur
            </p>
          </div>
        </div>

        {/* Version */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Version 2.0 - Livreur App
        </p>
      </div>
    </div>
  );
}