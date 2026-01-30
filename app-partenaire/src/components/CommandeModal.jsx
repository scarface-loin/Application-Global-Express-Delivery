/**
 * 📋 COMPOSANT CommandeModal - Détails d'une commande
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          
          {/* En-tête */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl">
                {commande.type === 'course' ? (
                  <FiPackage className="text-white" size={24} />
                ) : (
                  <FiTruck className="text-white" size={24} />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {commande.type === 'course' ? 'Course locale' : 'Expédition'}
                </h2>
                <p className="text-sm text-gray-600">{commande.numeroSuivi}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <FiX size={24} className="text-gray-500" />
            </button>
          </div>

          {/* Statut */}
          <div className="mb-6">
            <StatusBadge statut={commande.statut} />
            {statutInfo && (
              <div className={`mt-3 p-3 bg-${statutInfo.color}-50 border border-${statutInfo.color}-200 rounded-xl flex items-start gap-3`}>
                <statutInfo.icon className={`text-${statutInfo.color}-600 flex-shrink-0 mt-0.5`} size={20} />
                <p className={`text-sm text-${statutInfo.color}-900`}>{statutInfo.text}</p>
              </div>
            )}
          </div>

          {/* Destination */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Destination</h3>
            <div className="space-y-2">
              {commande.type === 'course' ? (
                <>
                  <div className="flex items-center gap-2">
                    <FiMapPin className="text-purple-600" size={18} />
                    <span className="font-semibold text-gray-900">{commande.quartier}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiPhone className="text-purple-600" size={18} />
                    <a href={`tel:${commande.numeroDestinataire}`} className="font-semibold text-purple-600 underline">
                      {commande.numeroDestinataire}
                    </a>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <FiUser className="text-purple-600" size={18} />
                    <span className="font-semibold text-gray-900">{commande.nomClient}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiPhone className="text-purple-600" size={18} />
                    <a href={`tel:${commande.contactClient}`} className="font-semibold text-purple-600 underline">
                      {commande.contactClient}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiMapPin className="text-purple-600" size={18} />
                    <span className="font-semibold text-gray-900">{commande.villeDestination}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Livreur */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <h3 className="text-sm font-bold text-gray-700 mb-2">Livreur</h3>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
                {commande.livreurNom ? commande.livreurNom.charAt(0) : '?'}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{commande.livreurNom}</p>
                {commande.statut === 'en_attente_attribution' && (
                  <p className="text-xs text-gray-600">Attribution en cours...</p>
                )}
              </div>
            </div>
          </div>

          {/* Articles */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Articles ({commande.articles?.length || 0})</h3>
            <div className="space-y-2">
              {commande.articles?.map((article, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-700">{article.nom} x{article.quantiteCommandee}</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(article.quantiteCommandee * article.coutUnitaire)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Horaires */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Horaires</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Créée le:</span>
                <span className="font-semibold text-gray-900">{formatDate(commande.dateCreation)}</span>
              </div>
              {commande.dateAttribution && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Attribuée le:</span>
                  <span className="font-semibold text-gray-900">{formatDate(commande.dateAttribution)}</span>
                </div>
              )}
              {commande.dateLivraison && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Livrée le:</span>
                  <span className="font-semibold text-green-700">{formatDate(commande.dateLivraison)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Total */}
          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-900">Montant total</span>
              <span className="text-2xl font-bold text-purple-700">{formatCurrency(commande.total)}</span>
            </div>
          </div>

          {/* Bouton */}
          <button
            onClick={onClose}
            className="w-full bg-gray-200 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-300 transition-all"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}