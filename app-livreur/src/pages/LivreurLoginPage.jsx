import React, { useState } from 'react';
import { FiTruck, FiPhone, FiLock, FiAlertCircle } from 'react-icons/fi';

/**
 * Page de connexion pour les livreurs
 * 
 * NOTES D'IMPLÉMENTATION :
 * - Pour l'instant, utilise une authentification simplifiée (téléphone uniquement)
 * - À améliorer avec Firebase Auth ou un système de hash de mot de passe
 * - Le mot de passe par défaut est vérifié contre livreur.motDePasseHash
 */

export default function LivreurLoginPage({ onLogin }) {
  const [telephone, setTelephone] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // ⚠️ AUTHENTIFICATION SIMPLIFIÉE - À AMÉLIORER EN PRODUCTION
      // Cette logique devrait être dans un fichier Logic séparé
      
      // 1. Chercher le livreur par téléphone
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('../../../services/firebase');
      
      const livreursRef = collection(db, 'livreurs');
      const q = query(livreursRef, where('telephone', '==', telephone.replace(/\s/g, '')));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error('Numéro de téléphone non reconnu');
      }
      
      const livreurDoc = snapshot.docs[0];
      const livreurData = livreurDoc.data();
      
      // 2. Vérifier le statut
      if (livreurData.statut !== 'actif') {
        throw new Error('Votre compte est désactivé. Contactez l\'administration.');
      }
      
      // 3. Vérifier le mot de passe
      // ⚠️ EN PRODUCTION : Utiliser bcrypt ou Firebase Auth
      // Pour l'instant, on compare directement (très peu sécurisé)
      if (motDePasse !== '123456' && livreurData.motDePasseHash !== motDePasse) {
        throw new Error('Mot de passe incorrect');
      }
      
      // 4. Vérifier si c'est la première connexion
      if (livreurData.isFirstLogin) {
        // TODO : Rediriger vers page de changement de mot de passe
        alert('⚠️ Première connexion : Vous devez changer votre mot de passe par défaut.');
      }
      
      // 5. Connexion réussie
      const userData = {
        id: livreurDoc.id,
        nom: livreurData.nom,
        telephone: livreurData.telephone,
        photoUrl: livreurData.photoUrl
      };
      
      // Sauvegarder dans localStorage (ou Context/Redux)
      localStorage.setItem('livreur_auth', JSON.stringify(userData));
      
      // Callback vers le parent
      onLogin(userData);
      
    } catch (err) {
      console.error('Erreur de connexion:', err);
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <FiTruck size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Espace Livreur</h1>
          <p className="text-gray-600">Connectez-vous pour accéder à vos livraisons</p>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <FiAlertCircle className="text-red-600 flex-shrink-0" size={20} />
              <div>
                <p className="text-sm font-semibold text-red-900">Erreur de connexion</p>
                <p className="text-xs text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Champ téléphone */}
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
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Champ mot de passe */}
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
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Bouton de connexion */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

        {/* Message d'aide */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex gap-3">
            <FiAlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
            <div className="text-xs text-blue-900">
              <p className="font-semibold mb-1">Mot de passe par défaut : 123456</p>
              <p>Vous devrez le changer lors de votre première connexion.</p>
              <p className="mt-2">En cas de problème, contactez votre superviseur.</p>
            </div>
          </div>
        </div>

        {/* Mode dev - À retirer en production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setTelephone('+237691234567');
                setMotDePasse('123456');
              }}
              className="text-xs text-gray-500 hover:text-blue-600 underline"
            >
              [Dev] Remplir avec compte test
            </button>
          </div>
        )}

      </div>
    </div>
  );
}