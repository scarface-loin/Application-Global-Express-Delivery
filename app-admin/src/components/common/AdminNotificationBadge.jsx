import React, { useState, useEffect } from 'react';
import { MdNotifications, MdNotificationsActive } from 'react-icons/md';
import { FiBell, FiCheck, FiX } from 'react-icons/fi';
import { useNotification } from '../../context/NotificationContext';

const AdminNotificationBadge = () => {
  const { notifications, removeNotification } = useNotification();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Filtrer les notifications importantes pour les admins
  const adminNotifications = notifications.filter(n => 
    n.type === 'success' || 
    n.title.includes('Livraison') || 
    n.title.includes('Transfert') ||
    n.type === 'error'
  );

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.notification-dropdown')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isDropdownOpen]);

  // Marquer toutes les notifications comme lues
  const markAllAsRead = () => {
    adminNotifications.forEach(notification => {
      removeNotification(notification.id);
    });
    setIsDropdownOpen(false);
  };

  // Obtenir le nombre de notifications non lues
  const unreadCount = adminNotifications.length;

  return (
    <div className="relative notification-dropdown">
      {/* Bouton badge */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <MdNotificationsActive size={22} className="text-blue-600" />
        ) : (
          <MdNotifications size={22} />
        )}
        
        {/* Badge avec compteur */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown des notifications */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* En-tête */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                >
                  <FiCheck className="mr-1" size={14} />
                  Tout marquer comme lu
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {unreadCount > 0 
                ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
                : 'Aucune nouvelle notification'
              }
            </p>
          </div>
          
          {/* Liste des notifications */}
          <div className="max-h-96 overflow-y-auto">
            {adminNotifications.length > 0 ? (
              adminNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors ${
                    notification.type === 'success' ? 'bg-green-50/30' :
                    notification.type === 'error' ? 'bg-red-50/30' :
                    notification.type === 'warning' ? 'bg-yellow-50/30' : 'bg-blue-50/30'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start space-x-2">
                        {/* Icône selon le type */}
                        <div className={`flex-shrink-0 mt-0.5 rounded-full p-1 ${
                          notification.type === 'success' ? 'bg-green-100 text-green-600' :
                          notification.type === 'error' ? 'bg-red-100 text-red-600' :
                          notification.type === 'warning' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          <FiBell size={14} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date().toLocaleTimeString('fr-FR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Bouton pour supprimer la notification */}
                    <button
                      onClick={() => removeNotification(notification.id)}
                      className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-600"
                      aria-label="Fermer"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <div className="mx-auto w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full mb-3">
                  <FiBell className="text-gray-400" size={20} />
                </div>
                <p className="text-gray-500 text-sm">Aucune notification</p>
                <p className="text-gray-400 text-xs mt-1">
                  Les nouvelles notifications apparaîtront ici
                </p>
              </div>
            )}
          </div>
          
          {/* Footer */}
          {adminNotifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <div className="text-center">
                <button
                  onClick={() => setIsDropdownOpen(false)}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminNotificationBadge;