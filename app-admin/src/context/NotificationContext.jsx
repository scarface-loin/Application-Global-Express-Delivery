import React, { createContext, useContext, useState, useCallback } from 'react';
import ToastNotification from '../components/common/ToastNotification';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback(({ 
    message, 
    type = 'success', 
    duration = 5000,
    title 
  }) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      message,
      type,
      duration,
      title
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove after duration
    setTimeout(() => {
      removeNotification(id);
    }, duration);

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const notifySuccess = useCallback((message, options = {}) => {
    return addNotification({
      message,
      type: 'success',
      title: 'Succès',
      ...options
    });
  }, [addNotification]);

  const notifyError = useCallback((message, options = {}) => {
    return addNotification({
      message,
      type: 'error',
      title: 'Erreur',
      ...options
    });
  }, [addNotification]);

  const notifyInfo = useCallback((message, options = {}) => {
    return addNotification({
      message,
      type: 'info',
      title: 'Information',
      ...options
    });
  }, [addNotification]);

  const notifyWarning = useCallback((message, options = {}) => {
    return addNotification({
      message,
      type: 'warning',
      title: 'Attention',
      ...options
    });
  }, [addNotification]);

  // Notification pour les livraisons/transferts
  const notifyDeliverySuccess = useCallback((deliveryType, trackingNumber, options = {}) => {
    const typeText = deliveryType === 'transfer' ? 'Transfert' : 'Livraison';
    const message = `${typeText} créée avec succès!\nNuméro de suivi: ${trackingNumber}`;
    
    // Notifier tous les administrateurs (simuler un envoi via WebSocket)
    // Dans une vraie application, vous enverriez ceci via WebSocket
    simulateAdminNotification(`${typeText} créée - ${trackingNumber}`);
    
    return addNotification({
      message,
      type: 'success',
      title: `${typeText} Réussie`,
      duration: 8000,
      ...options
    });
  }, [addNotification]);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    notifySuccess,
    notifyError,
    notifyInfo,
    notifyWarning,
    notifyDeliverySuccess
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <ToastNotification
            key={notification.id}
            message={notification.message}
            type={notification.type}
            duration={notification.duration}
            title={notification.title}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

// Simuler une notification pour tous les admins (à remplacer par WebSocket)
const simulateAdminNotification = (message) => {
  console.log(`[NOTIFICATION ADMIN] ${message}`);
  // Ici, vous intégreriez votre système WebSocket
  // Exemple: socket.emit('admin-notification', { message, type: 'delivery_created' });
};