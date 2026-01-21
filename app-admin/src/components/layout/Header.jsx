import React, { useState } from 'react';
import { FiMenu, FiBell } from 'react-icons/fi';
import { useNotification } from '../../context/NotificationContext';

export const Header = ({ onMenuClick, title }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, removeNotification } = useNotification();

  // Compter les notifications importantes
  const importantNotifications = notifications.filter(n => 
    n.title.includes('Livraison') || 
    n.title.includes('Transfert') ||
    n.type === 'error'
  );

  const unreadCount = importantNotifications.length;

  return (
    <header className="bg-white shadow-sm sticky top-0 z-30">
      <div className="px-4 py-4 flex items-center justify-between">
        {/* Partie gauche */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden text-gray-700 hover:text-gray-900"
            aria-label="Menu"
          >
            <FiMenu size={24} />
          </button>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        </div>

        {/* Partie droite avec badge simple */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
            aria-label="Notifications"
          >
            <FiBell size={22} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown simple des notifications */}
          {showNotifications && importantNotifications.length > 0 && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-3 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-gray-900">Notifications</h3>
                  <span className="text-xs text-gray-500">
                    {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                {importantNotifications.map(notification => (
                  <div
                    key={notification.id}
                    className="p-3 border-b border-gray-100 hover:bg-gray-50 last:border-b-0"
                    onClick={() => removeNotification(notification.id)}
                  >
                    <p className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {notification.message.split('\n')[0]}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date().toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;