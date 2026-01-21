// components/NotificationsTab.jsx
import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import apiService from '../services/api';

const NotificationsTab = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    const data = await apiService.notifications.getAll();
    setNotifications(data);
    setLoading(false);
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 24) {
      return hours === 0 ? "À l'instant" : `Il y a ${hours}h`;
    }
    return `Il y a ${days}j`;
  };

  const markAsRead = async (id) => {
    await apiService.notifications.markAsRead()(id);
    setNotifications(prev =>
      prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: '#f2f2f7' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-purple-600 mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pb-24" style={{ backgroundColor: '#f2f2f7' }}>
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-white/80 border-b border-gray-200/50 px-5 pt-14 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">{unreadCount}</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pt-4">
        {notifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Bell className="text-gray-400" size={40} />
            </div>
            <p className="text-gray-900 text-lg font-semibold mb-1">Aucune notification</p>
            <p className="text-gray-500 text-sm">Vous êtes à jour !</p>
          </div>
        ) : (
          <div className="space-y-2 pb-4">
            {notifications.map(notif => (
              <button
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={`w-full text-left rounded-2xl p-4 shadow-sm border transition-all active:scale-98 ${
                  notif.read
                    ? 'bg-white border-gray-100'
                    : 'bg-blue-50 border-blue-100'
                }`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <div className="flex items-start">
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0" style={{ backgroundColor: '#667eea' }}></div>
                  )}
                  <div className="flex-1">
                    <h3 className={`font-semibold mb-1 text-sm ${notif.read ? 'text-gray-900' : 'text-gray-900'}`}>
                      {notif.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2 leading-relaxed">{notif.message}</p>
                    <span className="text-gray-400 text-xs">{formatTime(notif.date)}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsTab;