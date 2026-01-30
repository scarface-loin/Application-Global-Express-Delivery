import React, { useState, useEffect } from 'react';
import { FiEdit, FiLock, FiUser, FiPhone, FiShield, FiPlus, FiUsers, FiPackage, FiSearch } from 'react-icons/fi';
import Card from '../common/Card';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Alert from '../common/Alert';
import LoadingSpinner from '../common/LoadingSpinner';
// import { apiRequest } from '../../services/api'; // Backend désactivé
import { useAuth } from '../../context/AuthContext';

// Sous-composant: Formulaire d'édition du profil
const ProfileEditForm = ({ profile, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // --- BYPASS BACKEND ---
    setTimeout(() => {
      // Simulation de succès
      onSuccess();
      setLoading(false);
    }, 1000);

    /* CODE BACKEND ORIGINAL
    try {
      await apiRequest('/admin/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name: formData.name }),
      });
      onSuccess();
    } catch (err) {
      setError(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
    */
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Modifier mes informations">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error" message={error} />}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom complet
            </label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Votre nom complet"
                required
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone
            </label>
            <div className="relative">
              <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                value={formData.phone}
                disabled
                className="pl-10 bg-gray-50"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Le numéro de téléphone ne peut pas être modifié
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-4">
          <Button variant="secondary" onClick={onClose} type="button">
            Annuler
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Enregistrement...' : 'Enregistrer (Test)'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Sous-composant: Formulaire de changement de mot de passe
const PasswordChangeForm = ({ onClose, onSuccess }) => {
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (passwords.newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    setError('');

    // --- BYPASS BACKEND ---
    setTimeout(() => {
      alert('Mot de passe modifié avec succès (Mode Simulation)');
      onSuccess();
      setLoading(false);
    }, 1000);

    /* CODE BACKEND ORIGINAL
    try {
      await apiRequest('/admin/profile/password', {
        method: 'PATCH',
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      });
      alert('Mot de passe modifié avec succès');
      onSuccess();
    } catch (err) {
      setError(err.message || 'Erreur lors de la modification');
    } finally {
      setLoading(false);
    }
    */
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Changer mon mot de passe">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error" message={error} />}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe actuel
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                placeholder="Entrez votre mot de passe actuel"
                required
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <FiShield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                placeholder="Au moins 6 caractères"
                required
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmer le nouveau mot de passe
            </label>
            <div className="relative">
              <FiShield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="password"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                placeholder="Retapez le nouveau mot de passe"
                required
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-800 mb-1">Conseils de sécurité :</h4>
          <ul className="text-xs text-yellow-700 space-y-1">
            <li>• Utilisez au moins 6 caractères</li>
            <li>• Combinez lettres, chiffres et symboles</li>
            <li>• Évitez les mots de passe courants</li>
            <li>• Ne réutilisez pas d'anciens mots de passe</li>
          </ul>
        </div>

        <div className="flex gap-2 justify-end pt-4">
          <Button variant="secondary" onClick={onClose} type="button">
            Annuler
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Modification...' : 'Modifier le mot de passe'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Sous-composant: Carte d'informations de sécurité
const SecurityCard = () => {
  const { logout } = useAuth();
  const [sessionHistory, setSessionHistory] = useState([]);

  useEffect(() => {
    // Simuler l'historique des sessions
    setSessionHistory([
      { id: 1, device: 'Chrome sur Windows', location: 'Yaoundé, Cameroun', time: '2024-01-15 14:30', current: true },
      { id: 2, device: 'Safari sur iPhone', location: 'Douala, Cameroun', time: '2024-01-14 10:15', current: false },
      { id: 3, device: 'Firefox sur Mac', location: 'Paris, France', time: '2024-01-12 09:45', current: false },
    ]);
  }, []);

  const handleLogoutAllDevices = async () => {
    if (!confirm('Êtes-vous sûr de vouloir vous déconnecter de tous les appareils ?')) return;

    // --- BYPASS BACKEND ---
    alert('Déconnexion de tous les appareils effectuée (Simulation)');
    logout();

    /* CODE BACKEND ORIGINAL
    try {
      await apiRequest('/admin/profile/logout-all', {
        method: 'POST',
      });
      alert('Déconnexion de tous les appareils effectuée');
      logout();
    } catch (error) {
      alert('Erreur lors de la déconnexion globale');
    }
    */
  };

  return (
    <Card title="Sécurité et sessions">
      <div className="space-y-4">
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Sessions actives</h4>
          {sessionHistory.map((session) => (
            <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">{session.device}</p>
                <p className="text-xs text-gray-600">{session.location} • {session.time}</p>
              </div>
              {session.current && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Actuelle
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="border-t pt-4">
          <div className="space-y-2">
            <Button
              variant="secondary"
              onClick={handleLogoutAllDevices}
              className="w-full justify-center"
            >
              Se déconnecter de tous les appareils
            </Button>
            <p className="text-xs text-gray-600 text-center">
              Cela mettra fin à toutes vos sessions actives sur tous les appareils
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};

// Sous-composant: Carte d'activité récente
const ActivityCard = ({ profile }) => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    // Simuler les activités récentes
    setActivities([
      { id: 1, action: 'Connexion', details: 'Depuis Chrome sur Windows', time: 'Aujourd\'hui, 14:30' },
      { id: 2, action: 'Création de livraison', details: '3 colis pour Jean Dupont', time: 'Hier, 10:15' },
      { id: 3, action: 'Modification de profil', details: 'Mise à jour des informations', time: '12 Jan, 09:45' },
      { id: 4, action: 'Ajout de livreur', details: 'Paul Martin ajouté', time: '10 Jan, 16:20' },
    ]);
  }, []);

  return (
    <Card title="Activité récente">
      <div className="space-y-3">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div className="flex-1">
              <p className="font-medium text-sm">{activity.action}</p>
              <p className="text-xs text-gray-600">{activity.details}</p>
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">{activity.time}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

// Composant principal: Page de profil
const ProfilePage = () => {
  const { admin, setAdmin } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    activeDeliveryMen: 0,
    pendingDeliveries: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    
    // --- BYPASS BACKEND ---
    setTimeout(() => {
        const mockProfile = {
            _id: "admin-12345",
            name: "Steve (Admin Test)",
            phone: "+237699000000",
            createdAt: "2023-01-15T10:00:00Z",
            lastLogin: new Date().toISOString()
        };
        
        setProfile(mockProfile);
        setAdmin(mockProfile);
    
        // Récupérer les statistiques (simulation)
        setStats({
            totalDeliveries: 156,
            activeDeliveryMen: 8,
            pendingDeliveries: 12,
            totalRevenue: 1250000,
        });
        setLoading(false);
    }, 500);

    /* CODE BACKEND ORIGINAL
    try {
      // Récupérer les informations du profil
      const profileResponse = await apiRequest('/admin/profile');
      setProfile(profileResponse.data);
      setAdmin(profileResponse.data);

      // Récupérer les statistiques (simulation)
      setStats({
        totalDeliveries: 156,
        activeDeliveryMen: 8,
        pendingDeliveries: 12,
        totalRevenue: 1250000,
      });
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
    */
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    // Format: +237 XXX XX XX XX
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{2})(\d{2})(\d{2})$/);
    if (match) {
      return `+237 ${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
    }
    return phone;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mon Profil</h2>
          <p className="text-gray-600">Gérez vos informations personnelles et votre sécurité</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne de gauche: Informations du profil */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Informations personnelles">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <FiUser size={32} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">{profile?.name || 'Administrateur'}</h3>
                  <p className="text-gray-600">{formatPhoneNumber(profile?.phone)}</p>
                  <p className="text-gray-600">Administrateur système (Mode Test)</p>
                  
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="primary"
                      icon="edit"
                      onClick={() => setShowEditForm(true)}
                      size="sm"
                    >
                      Modifier le profil
                    </Button>
                    <Button
                      variant="secondary"
                      icon="lock"
                      onClick={() => setShowPasswordForm(true)}
                      size="sm"
                    >
                      Changer le mot de passe
                    </Button>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Détails du compte</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">ID Administrateur</p>
                    <p className="font-medium">{profile?._id?.slice(-8) || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Date d'inscription</p>
                    <p className="font-medium">
                      {profile?.createdAt 
                        ? new Date(profile.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Dernière connexion</p>
                    <p className="font-medium">
                      {profile?.lastLogin 
                        ? new Date(profile.lastLogin).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Aujourd\'hui'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">Statut du compte</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Actif
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover:shadow-lg transition-shadow">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Livraisons totales</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDeliveries}</p>
                <p className="text-xs text-green-600">+12% ce mois</p>
              </div>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Livreurs actifs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeDeliveryMen}</p>
                <p className="text-xs text-green-600">+2 ce mois</p>
              </div>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingDeliveries}</p>
                <p className="text-xs text-yellow-600">-3 aujourd'hui</p>
              </div>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Revenu total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRevenue.toLocaleString()} FCFA</p>
                <p className="text-xs text-green-600">+8% ce mois</p>
              </div>
            </Card>
          </div>

          {/* Activité récente */}
          <ActivityCard profile={profile} />
        </div>

        {/* Colonne de droite: Sécurité et actions */}
        <div className="space-y-6">
          <SecurityCard />

          <Card title="Actions rapides">
            <div className="space-y-2">
              <button
                onClick={() => window.location.hash = '#create-delivery'}
                className="w-full flex items-center gap-3 text-left px-4 py-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors text-blue-700"
              >
                <FiPlus /> Créer une livraison
              </button>
              <button
                onClick={() => window.location.hash = '#deliverymen'}
                className="w-full flex items-center gap-3 text-left px-4 py-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors text-green-700"
              >
                <FiUsers /> Gérer les livreurs
              </button>
              <button
                onClick={() => window.location.hash = '#deliveries'}
                className="w-full flex items-center gap-3 text-left px-4 py-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors text-purple-700"
              >
                <FiPackage /> Voir les livraisons
              </button>
              <button
                onClick={() => window.location.hash = '#tracking'}
                className="w-full flex items-center gap-3 text-left px-4 py-3 rounded-lg bg-yellow-50 hover:bg-yellow-100 transition-colors text-yellow-700"
              >
                <FiSearch /> Suivre un colis
              </button>
            </div>
          </Card>

          <Card title="Support">
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Besoin d'aide ? Contactez notre équipe de support.
              </p>
              <div className="space-y-2">
                <a 
                  href="mailto:support@adminlivraisons.cm" 
                  className="block text-blue-600 hover:text-blue-800 text-sm"
                >
                  ✉️ support@adminlivraisons.cm
                </a>
                <a 
                  href="tel:+237699999999" 
                  className="block text-blue-600 hover:text-blue-800 text-sm"
                >
                  📞 +237 699 999 999
                </a>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Modals */}
      {showEditForm && (
        <ProfileEditForm
          profile={profile}
          onClose={() => setShowEditForm(false)}
          onSuccess={() => {
            fetchProfileData();
            setShowEditForm(false);
          }}
        />
      )}

      {showPasswordForm && (
        <PasswordChangeForm
          onClose={() => setShowPasswordForm(false)}
          onSuccess={() => {
            setShowPasswordForm(false);
          }}
        />
      )}
    </div>
  );
};

export default ProfilePage;