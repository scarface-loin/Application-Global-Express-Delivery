import React, { useState, useEffect } from 'react';
import { 
  FiPlus, FiTrash2, FiCheck, FiUser, 
  FiBell, FiMessageSquare, FiX, FiRefreshCw, FiAlertCircle,
  FiWifi, FiWifiOff, FiInfo
} from 'react-icons/fi';
import { io } from 'socket.io-client';

// Import des fonctions logiques
import { 
  createDeliveryInFirebase, 
  fetchActiveLivreurs, 
  sendWhatsAppNotification,
  checkWhatsAppStatus // ✅ Nouvelle fonction
} from './logic/CreateDeliveryPageLogic';

// ✅ Configuration du serveur WhatsApp (À adapter selon votre URL de déploiement)
const SOCKET_URL = "https://whatsapp-bot-34294235336.europe-west1.run.app";

// ✅ Initialisation Socket.IO avec reconnexion automatique
const socket = io(SOCKET_URL, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

export default function CreateDeliveryPage() {
  // --- ÉTATS WHATSAPP & NOTIFICATIONS ---
  const [wsStatus, setWsStatus] = useState('connecting'); // connecting, qr, ready, error
  const [qrCode, setQrCode] = useState(null);
  const [sendNotifAuto, setSendNotifAuto] = useState(true);
  const [queuedNotifs, setQueuedNotifs] = useState([]);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false); // ✅ Modal pour QR code

  // --- ÉTATS FORMULAIRE ---
  const [deliveryType, setDeliveryType] = useState('course');
  const [formData, setFormData] = useState({
    livreurId: '',
    livreurNom: '',
    livreurTelephone: '', // ✅ Ajout du téléphone
    quartier: '',
    numeroDestinataire: '',
    coutLivraison: '',
    nomClient: '',
    contactClient: '',
    villeDestination: '',
    coutExpedition: '1000',
  });

  const [articles, setArticles] = useState([
    { id: Date.now(), nom: '', quantite: '', cout: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [livreurs, setLivreurs] = useState([]);

  // ✅ AMÉLIORATION: Vérification du statut initial au chargement
  useEffect(() => {
    console.log("🚀 Initialisation de la page...");
    
    // 1. Charger les livreurs
    fetchActiveLivreurs().then(livreursData => {
      setLivreurs(livreursData);
      console.log(`✅ ${livreursData.length} livreur(s) chargé(s)`);
    });

    // 2. ✅ Vérifier le statut initial du bot WhatsApp
    const checkInitialStatus = async () => {
      try {
        console.log("🔍 Vérification du statut WhatsApp...");
        const data = await checkWhatsAppStatus();
        
        if (data.connected) {
          console.log("✅ WhatsApp déjà connecté");
          setWsStatus('ready');
          setQrCode(null);
          setShowQRModal(false);
        } else if (data.qrDataURL) {
          console.log("📱 QR Code disponible");
          setWsStatus('qr');
          setQrCode(data.qrDataURL);
          setShowQRModal(true);
        } else {
          console.log("⏳ En attente de connexion");
          setWsStatus('connecting');
        }
      } catch (err) {
        console.error("❌ Erreur lors de la vérification du statut:", err);
        setWsStatus('error');
      }
    };
    
    checkInitialStatus();

    // 3. ✅ Gestion Socket.io pour WhatsApp (temps réel)
    socket.on('connect', () => {
      console.log("🔌 Socket.IO connecté");
    });

    socket.on('qr', (url) => {
      console.log("📱 QR Code reçu via Socket.IO");
      setQrCode(url);
      setWsStatus('qr');
      setShowQRModal(true);
    });

    socket.on('ready', () => {
      console.log("✅ WhatsApp prêt (via Socket.IO)");
      setWsStatus('ready');
      setQrCode(null);
      setShowQRModal(false);
      
      // ✅ Envoyer automatiquement les notifications en attente
      if (queuedNotifs.length > 0) {
        console.log(`📤 Envoi de ${queuedNotifs.length} notification(s) en attente...`);
        queuedNotifs.forEach(notif => retryNotification(notif));
      }
    });

    socket.on('disconnected', (info) => {
      console.warn("⚠️ WhatsApp déconnecté", info);
      setWsStatus('qr');
      setQrCode(null);
    });

    socket.on('max-reconnect-failed', () => {
      console.error("🚨 Échec de reconnexion WhatsApp");
      setWsStatus('error');
      alert("🚨 Impossible de reconnecter WhatsApp. Veuillez redémarrer le serveur ou contacter l'administrateur.");
    });

    socket.on('disconnect', () => {
      console.warn("🔌 Socket.IO déconnecté");
    });

    // Nettoyage
    return () => {
      socket.off('connect');
      socket.off('qr');
      socket.off('ready');
      socket.off('disconnected');
      socket.off('max-reconnect-failed');
      socket.off('disconnect');
    };
  }, []);

  // ✅ AMÉLIORATION: Fonction de notification avec meilleure gestion
  const handleAttemptNotification = async (deliveryData) => {
    if (wsStatus !== 'ready') {
      console.log("⏳ Bot non prêt, ajout en file d'attente");
      addToQueue(deliveryData);
      return;
    }

    try {
      console.log("📤 Envoi de notification WhatsApp...", deliveryData.numeroSuivi);
      const res = await sendWhatsAppNotification(deliveryData);
      
      if (!res.success) {
        console.error("❌ Échec d'envoi:", res.error);
        throw new Error(res.error);
      }
      
      console.log("✅ Notification envoyée avec succès!");
      
      // ✅ Notification toast de succès (optionnel)
      showToast("✅ Message WhatsApp envoyé !", "success");
      
    } catch (err) {
      console.error("⚠️ Erreur lors de l'envoi:", err.message);
      addToQueue(deliveryData);
      showToast(`⚠️ Message en file d'attente: ${err.message}`, "warning");
    }
  };

  const addToQueue = (data) => {
    setQueuedNotifs(prev => [...prev, { ...data, id: Date.now(), retryCount: 0 }]);
  };

  const retryNotification = async (notif) => {
    try {
      const res = await sendWhatsAppNotification(notif);
      if (res.success) {
        setQueuedNotifs(prev => prev.filter(item => item.id !== notif.id));
        showToast("✅ Notification envoyée !", "success");
      } else {
        alert("❌ L'envoi a échoué. Assurez-vous que le QR code est scanné.");
      }
    } catch (err) {
      alert("❌ Erreur de connexion au serveur WhatsApp.");
    }
  };

  // ✅ Fonction toast simple
  const showToast = (message, type = "info") => {
    // Vous pouvez utiliser une bibliothèque comme react-hot-toast ici
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  // --- GESTION FORMULAIRE ---
  const handleLivreurChange = (e) => {
    const selectedId = e.target.value;
    const selectedLivreur = livreurs.find(l => l.id === selectedId);
    
    setFormData({ 
      ...formData, 
      livreurId: selectedId,
      livreurNom: selectedLivreur ? selectedLivreur.nom : '',
      livreurTelephone: selectedLivreur ? selectedLivreur.telephone : '' // ✅ Téléphone
    });
    
    console.log("👤 Livreur sélectionné:", selectedLivreur);
  };

  const calculateArticlesTotal = () => articles.reduce(
    (sum, a) => sum + (parseFloat(a.quantite || 0) * parseFloat(a.cout || 0)), 
    0
  );
  
  const calculateGrandTotal = () => {
    const base = calculateArticlesTotal();
    const frais = deliveryType === 'course' 
      ? parseFloat(formData.coutLivraison || 0) 
      : parseFloat(formData.coutExpedition || 0);
    return base + frais;
  };

  const isFormValid = () => {
    const hasLivreur = formData.livreurId;
    const commonValid = articles.every(a => a.nom && a.quantite && a.cout);
    
    if (deliveryType === 'course') {
      return hasLivreur && commonValid && 
             formData.quartier && formData.numeroDestinataire && formData.coutLivraison;
    }
    
    return hasLivreur && commonValid && 
           formData.nomClient && formData.contactClient && formData.villeDestination;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) {
      alert("⚠️ Veuillez remplir tous les champs requis");
      return;
    }

    setLoading(true);
    try {
      console.log("📝 Création de la livraison...");
      // 1. Création dans Firebase
      const result = await createDeliveryInFirebase(formData, articles, deliveryType);

      if (result.success) {
        console.log("✅ Livraison créée:", result);
        
        // ✅ Déclenchement de la notification si activé
        if (sendNotifAuto) {
          const deliveryDataForNotif = {
            id: result.id, // <--- 🚨 C'EST CETTE LIGNE QUI MANQUAIT !
            numeroSuivi: result.trackingNumber,
            livreurNom: formData.livreurNom,
            livreurTelephone: formData.livreurTelephone,
            type: deliveryType,
            // ✅ Informations complètes de livraison
            infosLivraison: deliveryType === 'course' 
              ? { 
                  numeroDestinataire: formData.numeroDestinataire,
                  quartier: formData.quartier
                }
              : { 
                  contactClient: formData.contactClient,
                  nomClient: formData.nomClient,
                  villeDestination: formData.villeDestination
                },
            // ✅ Articles avec détails
            articles: articles.map(a => ({
              nom: a.nom,
              quantite: parseInt(a.quantite, 10),
              cout: parseFloat(a.cout)
            })),
            // ✅ Total général
            totalGeneral: calculateGrandTotal()
          };
          
          // Envoi à la fonction de notification
          await handleAttemptNotification(deliveryDataForNotif);
        }

        alert(`✅ Livraison créée avec succès !\n\n📦 Numéro de suivi: ${result.trackingNumber}`);
        
        // ✅ Reset du formulaire
        setArticles([{ id: Date.now(), nom: '', quantite: '', cout: '' }]);
        setFormData(prev => ({
          ...prev, 
          quartier: '', 
          numeroDestinataire: '', 
          coutLivraison: '',
          nomClient: '', 
          contactClient: '',
          villeDestination: ''
        }));
      }
    } catch (error) {
      console.error("❌ Erreur:", error);
      alert("❌ Erreur: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* ✅ HEADER DE STATUT AMÉLIORÉ */}
      <div className="bg-white border-b sticky top-0 z-30 px-4 py-3 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${
              wsStatus === 'ready' ? 'bg-green-500' : 
              wsStatus === 'error' ? 'bg-red-500' :
              'bg-orange-500 animate-pulse'
            }`}></div>
            <div>
              <div className="flex items-center gap-2">
                {wsStatus === 'ready' && <FiWifi className="text-green-600" size={16} />}
                {wsStatus !== 'ready' && <FiWifiOff className="text-orange-600" size={16} />}
                <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  WhatsApp: {
                    wsStatus === 'ready' ? 'Connecté' : 
                    wsStatus === 'error' ? 'Erreur' :
                    wsStatus === 'qr' ? 'Scan requis' :
                    'Connexion...'
                  }
                </span>
              </div>
              {wsStatus === 'qr' && (
                <button 
                  onClick={() => setShowQRModal(true)}
                  className="text-xs text-blue-600 hover:underline mt-1"
                >
                  Cliquez pour voir le QR code
                </button>
              )}
            </div>
          </div>
          
          <button 
            onClick={() => setShowNotifModal(true)}
            className="relative p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          >
            <FiBell size={20} className={queuedNotifs.length > 0 ? "text-orange-600" : "text-gray-400"} />
            {queuedNotifs.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                {queuedNotifs.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* CONTENU PRINCIPAL */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="space-y-6">
          {/* Toggle de type de livraison */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDeliveryType('course')}
                className={`py-3 rounded-xl font-bold text-sm transition-all ${
                  deliveryType === 'course'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                🛵 Course locale
              </button>
              <button
                onClick={() => setDeliveryType('expedition')}
                className={`py-3 rounded-xl font-bold text-sm transition-all ${
                  deliveryType === 'expedition'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                📦 Expédition
              </button>
            </div>
          </div>

          {/* Toggle notification auto */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FiMessageSquare className="text-blue-600" size={20} />
              <div>
                <p className="text-sm font-bold text-blue-900">Notification WhatsApp automatique</p>
                <p className="text-xs text-blue-700">Envoi auto au client après création</p>
              </div>
            </div>
            <button
              onClick={() => setSendNotifAuto(!sendNotifAuto)}
              className={`w-14 h-8 rounded-full transition-colors ${
                sendNotifAuto ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                sendNotifAuto ? 'translate-x-7' : 'translate-x-1'
              }`}></div>
            </button>
          </div>

          {/* Sélection du livreur */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FiUser className="text-blue-600" />
              <h3 className="text-sm font-bold text-gray-800">Livreur assigné</h3>
            </div>
            <div>
              <select
                value={formData.livreurId}
                onChange={handleLivreurChange}
                className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 ring-blue-500"
              >
                <option value="">Choisir un livreur</option>
                {livreurs.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.nom} {l.telephone !== "Non renseigné" ? `(${l.telephone})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Informations Destinations */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              📍 Détails de la destination
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deliveryType === 'course' ? (
                <>
                  <input
                    type="text"
                    placeholder="Quartier (ex: Akwa)"
                    value={formData.quartier}
                    onChange={(e) => setFormData({...formData, quartier: e.target.value})}
                    className="bg-gray-50 border-none rounded-xl px-4 py-3 text-sm"
                  />
                  <input
                    type="tel"
                    placeholder="Numéro destinataire (+237...)"
                    value={formData.numeroDestinataire}
                    onChange={(e) => setFormData({...formData, numeroDestinataire: e.target.value})}
                    className="bg-gray-50 border-none rounded-xl px-4 py-3 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Frais livraison (FCFA)"
                    value={formData.coutLivraison}
                    onChange={(e) => setFormData({...formData, coutLivraison: e.target.value})}
                    className="bg-gray-50 border-none rounded-xl px-4 py-3 text-sm md:col-span-2"
                  />
                </>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Nom du client"
                    value={formData.nomClient}
                    onChange={(e) => setFormData({...formData, nomClient: e.target.value})}
                    className="bg-gray-50 border-none rounded-xl px-4 py-3 text-sm"
                  />
                  <input
                    type="tel"
                    placeholder="Contact client"
                    value={formData.contactClient}
                    onChange={(e) => setFormData({...formData, contactClient: e.target.value})}
                    className="bg-gray-50 border-none rounded-xl px-4 py-3 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Ville destination"
                    value={formData.villeDestination}
                    onChange={(e) => setFormData({...formData, villeDestination: e.target.value})}
                    className="bg-gray-50 border-none rounded-xl px-4 py-3 text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Frais expédition"
                    value={formData.coutExpedition}
                    onChange={(e) => setFormData({...formData, coutExpedition: e.target.value})}
                    className="bg-gray-50 border-none rounded-xl px-4 py-3 text-sm"
                  />
                </>
              )}
            </div>
          </div>

          {/* Articles */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-gray-800">🛍️ Liste des articles</h3>
              <button 
                onClick={() => setArticles([...articles, {id: Date.now(), nom: '', quantite: '', cout: ''}])}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiPlus />
              </button>
            </div>
            <div className="space-y-3">
              {articles.map((art, idx) => (
                <div key={art.id} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded-xl">
                  <input 
                    className="col-span-5 bg-transparent border-none text-xs font-bold" 
                    placeholder="Nom"
                    value={art.nom}
                    onChange={(e) => setArticles(articles.map(a => a.id === art.id ? {...a, nom: e.target.value} : a))}
                  />
                  <input 
                    type="number" 
                    className="col-span-3 bg-transparent border-none text-xs" 
                    placeholder="Qté"
                    value={art.quantite}
                    onChange={(e) => setArticles(articles.map(a => a.id === art.id ? {...a, quantite: e.target.value} : a))}
                  />
                  <input 
                    type="number" 
                    className="col-span-3 bg-transparent border-none text-xs" 
                    placeholder="Prix"
                    value={art.cout}
                    onChange={(e) => setArticles(articles.map(a => a.id === art.id ? {...a, cout: e.target.value} : a))}
                  />
                  <button 
                    onClick={() => setArticles(articles.filter(a => a.id !== art.id))}
                    className="col-span-1 text-red-500 hover:text-red-700"
                    disabled={articles.length === 1}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ MODAL QR CODE */}
      {showQRModal && qrCode && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-black text-gray-800">📱 Connexion WhatsApp</h2>
              <button 
                onClick={() => setShowQRModal(false)}
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <p className="text-sm text-gray-500 mb-6">Scannez ce code avec WhatsApp</p>
            
            <div className="bg-gray-100 p-6 rounded-2xl mb-6">
              <img src={qrCode} alt="QR Code WhatsApp" className="w-full h-auto" />
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left">
              <p className="text-xs font-bold text-blue-800 mb-2 flex items-center gap-2">
                <FiInfo size={14} />
                Instructions :
              </p>
              <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                <li>Ouvrez WhatsApp sur votre téléphone</li>
                <li>Appuyez sur ⋮ (menu) puis "Appareils liés"</li>
                <li>Appuyez sur "Lier un appareil"</li>
                <li>Scannez ce code QR</li>
              </ol>
            </div>
            
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              En attente de scan...
            </div>
          </div>
        </div>
      )}

      {/* POPUP NOTIFICATIONS EN ATTENTE */}
      {showNotifModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-gray-800">File d'attente</h3>
                <p className="text-xs text-gray-500">Messages non envoyés ({queuedNotifs.length})</p>
              </div>
              <button onClick={() => setShowNotifModal(false)} className="p-2 bg-gray-100 rounded-full">
                <FiX />
              </button>
            </div>
            <div className="p-4 max-h-[400px] overflow-y-auto space-y-3">
              {queuedNotifs.length === 0 ? (
                <div className="text-center py-10">
                  <FiCheck className="mx-auto text-green-500 mb-2" size={32} />
                  <p className="text-sm text-gray-400">Tout est à jour !</p>
                </div>
              ) : (
                queuedNotifs.map(notif => (
                  <div key={notif.id} className="bg-gray-50 rounded-2xl p-4 border flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-gray-700">Ref: {notif.numeroSuivi}</p>
                      <p className="text-[10px] text-gray-500">
                        Dest: {notif.infosLivraison.numeroDestinataire || notif.infosLivraison.contactClient}
                      </p>
                    </div>
                    <button 
                      onClick={() => retryNotification(notif)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        wsStatus === 'ready' 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                      disabled={wsStatus !== 'ready'}
                    >
                      {wsStatus === 'ready' ? 'Renvoyer' : 'Indisponible'}
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="p-6 bg-gray-50 text-[10px] text-gray-400 border-t flex items-start gap-2">
              <FiAlertCircle className="flex-shrink-0 mt-0.5" /> 
              <span>
                Les messages échouent si le téléphone n'est pas connecté ou si le numéro est invalide.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* BOUTON FIXE DE CRÉATION */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <div className="flex-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Total à payer</p>
            <p className="text-xl font-black text-blue-600">
              {calculateGrandTotal().toLocaleString()} <span className="text-xs">FCFA</span>
            </p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading || !isFormValid()}
            className={`px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-3 transition-all ${
              loading || !isFormValid() 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95'
            }`}
          >
            {loading ? <FiRefreshCw className="animate-spin" /> : <FiCheck size={20} />}
            {loading ? 'CRÉATION...' : 'CRÉER LA LIVRAISON'}
          </button>
        </div>
      </div>
    </div>
  );
}