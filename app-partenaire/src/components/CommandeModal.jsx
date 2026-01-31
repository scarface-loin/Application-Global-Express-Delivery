/**
 * 📋 COMPOSANT CommandeModal - Détails d'une commande (Optimisé Android)
 */

import React from 'react';
import { FiPackage, FiTruck, FiMapPin, FiPhone, FiUser, FiX, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import StatusBadge from './StatusBadge';
import { formatCurrency, formatDate } from '../services/utils';

export default function CommandeModal({ commande, onClose }) {
  if (!commande) return null;

  const getStatutMessage = (statut) => {
    const messages = {
      'en_attente_attribution': {
        icon: FiClock,
        color: 'orange',
        text: "Votre commande est en attente d'attribution à un livreur par Global Express."
      },
      'en_cours': {
        icon: FiTruck,
        color: 'blue',
        text: 'Votre commande est actuellement en cours de livraison.'
      },
      'livre': {
        icon: FiCheckCircle,
        color: 'green',
        text: 'Votre commande a été livrée avec succès !'
      },
      'non_livre': {
        icon: FiAlertCircle,
        color: 'red',
        text: "La livraison a échoué. Contactez Global Express pour plus d'informations."
      }
    };
    return messages[statut] || null;
  };

  const statutInfo = getStatutMessage(commande.statut);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-end sm:items-center justify-center z-50">
      {/* Overlay cliquable pour fermer */}
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Modal - Slide from bottom sur mobile */}
      <div className="relative bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto animate-slide-up">
        
        {/* Barre de glissement (Android style) */}
        <div className="sm:hidden flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        <div className="p-5 sm:p-6">
          
          {/* En-tête */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-3.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-md">
                {commande.type === 'course' ? (
                  <FiPackage className="text-white" size={26} />
                ) : (
                  <FiTruck className="text-white" size={26} />
                )}
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {commande.type === 'course' ? 'Course locale' : 'Expédition'}
                </h2>
                <p className="text-sm text-gray-600 mt-0.5">{commande.numeroSuivi}</p>
              </div>
            </div>
            {/* Bouton de fermeture agrandi pour tactile */}
            <button 
              onClick={onClose} 
              className="p-3 hover:bg-gray-100 active:bg-gray-200 rounded-full transition-colors touch-manipulation"
              aria-label="Fermer"
            >
              <FiX size={26} className="text-gray-500" />
            </button>
          </div>

          {/* Statut */}
          <div className="mb-6">
            <StatusBadge statut={commande.statut} />
            {statutInfo && (
              <div className={`mt-4 p-4 bg-${statutInfo.color}-50 border-2 border-${statutInfo.color}-200 rounded-2xl flex items-start gap-3`}>
                <statutInfo.icon className={`text-${statutInfo.color}-600 flex-shrink-0 mt-0.5`} size={22} />
                <p className={`text-sm leading-relaxed text-${statutInfo.color}-900`}>{statutInfo.text}</p>
              </div>
            )}
          </div>

          {/* Destination */}
          <div className="bg-gray-50 rounded-2xl p-5 mb-5 border border-gray-100">
            <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Destination</h3>
            <div className="space-y-3.5">
              {commande.type === 'course' ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FiMapPin className="text-purple-600" size={20} />
                    </div>
                    <span className="font-semibold text-gray-900 text-base">{commande.quartier}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FiPhone className="text-purple-600" size={20} />
                    </div>
                    <a 
                      href={`tel:${commande.numeroDestinataire}`} 
                      className="font-semibold text-purple-600 underline text-base active:text-purple-700 touch-manipulation"
                    >
                      {commande.numeroDestinataire}
                    </a>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FiUser className="text-purple-600" size={20} />
                    </div>
                    <span className="font-semibold text-gray-900 text-base">{commande.nomClient}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FiPhone className="text-purple-600" size={20} />
                    </div>
                    <a 
                      href={`tel:${commande.contactClient}`} 
                      className="font-semibold text-purple-600 underline text-base active:text-purple-700 touch-manipulation"
                    >
                      {commande.contactClient}
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FiMapPin className="text-purple-600" size={20} />
                    </div>
                    <span className="font-semibold text-gray-900 text-base">{commande.villeDestination}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Livreur */}
          <div className="bg-gray-50 rounded-2xl p-5 mb-5 border border-gray-100">
            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Livreur</h3>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-lg shadow-sm">
                {commande.livreurNom ? commande.livreurNom.charAt(0) : '?'}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-base">{commande.livreurNom}</p>
                {commande.statut === 'en_attente_attribution' && (
                  <p className="text-sm text-gray-600 mt-0.5">Attribution en cours...</p>
                )}
              </div>
            </div>
          </div>

          {/* Articles */}
          <div className="bg-gray-50 rounded-2xl p-5 mb-5 border border-gray-100">
            <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">
              Articles ({commande.articles?.length || 0})
            </h3>
            <div className="space-y-3">
              {commande.articles?.map((article, index) => (
                <div key={index} className="flex justify-between items-center text-base py-2">
                  <span className="text-gray-700 font-medium">
                    {article.nom} <span className="text-gray-500">×{article.quantiteCommandee}</span>
                  </span>
                  <span className="font-bold text-gray-900">
                    {formatCurrency(article.quantiteCommandee * article.coutUnitaire)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Horaires */}
          <div className="bg-gray-50 rounded-2xl p-5 mb-5 border border-gray-100">
            <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Horaires</h3>
            <div className="space-y-3 text-base">
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-600">Créée le:</span>
                <span className="font-semibold text-gray-900">{formatDate(commande.dateCreation)}</span>
              </div>
              {commande.dateAttribution && (
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-600">Attribuée le:</span>
                  <span className="font-semibold text-gray-900">{formatDate(commande.dateAttribution)}</span>
                </div>
              )}
              {commande.dateLivraison && (
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-600">Livrée le:</span>
                  <span className="font-semibold text-green-700">{formatDate(commande.dateLivraison)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Total */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-5 mb-5 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-900 text-base">Montant total</span>
              <span className="text-3xl font-bold text-purple-700">{formatCurrency(commande.total)}</span>
            </div>
          </div>

          {/* Bouton de fermeture - Taille tactile optimale */}
          <button
            onClick={onClose}
            className="w-full bg-gray-200 text-gray-700 py-4 rounded-2xl font-semibold text-base hover:bg-gray-300 active:bg-gray-400 transition-all touch-manipulation shadow-sm"
          >
            Fermer
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .touch-manipulation {
          touch-action: manipulation;
        }
      `}</style>
    </div>
  );
}