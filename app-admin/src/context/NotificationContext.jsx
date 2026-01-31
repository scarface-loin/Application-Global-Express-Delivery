import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification doit être utilisé dans un NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Ajouter une notification
  const addNotification = useCallback((notification) => {
    const id = Date.now().toString();
    const newNotification = {
      id,
      message: notification.message || '',
      type: notification.type || 'info', // 'success', 'error', 'warning', 'info'
      duration: notification.duration || 5000,
      timestamp: new Date().toISOString()
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-suppression après la durée spécifiée
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, []);

  // Supprimer une notification
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  // Notification de succès
  const success = useCallback((message, duration) => {
    return addNotification({ message, type: 'success', duration });
  }, [addNotification]);

  // Notification d'erreur
  const error = useCallback((message, duration) => {
    return addNotification({ message, type: 'error', duration });
  }, [addNotification]);

  // Notification d'avertissement
  const warning = useCallback((message, duration) => {
    return addNotification({ message, type: 'warning', duration });
  }, [addNotification]);

  // Notification d'information
  const info = useCallback((message, duration) => {
    return addNotification({ message, type: 'info', duration });
  }, [addNotification]);

  // Supprimer toutes les notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    success,
    error,
    warning,
    info,
    clearAll
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;