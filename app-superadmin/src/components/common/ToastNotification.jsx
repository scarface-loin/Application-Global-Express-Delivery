import React, { useEffect, useState } from 'react';
import { MdCheckCircle, MdError, MdInfo, MdWarning } from 'react-icons/md';
import { FiX } from 'react-icons/fi';

const ToastNotification = ({ 
  message, 
  type = 'success', 
  duration = 5000,
  onClose,
  title 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  const typeConfig = {
    success: {
      icon: <MdCheckCircle className="text-green-500" size={24} />,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      title: title || 'Succès'
    },
    error: {
      icon: <MdError className="text-red-500" size={24} />,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      title: title || 'Erreur'
    },
    info: {
      icon: <MdInfo className="text-blue-500" size={24} />,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      title: title || 'Information'
    },
    warning: {
      icon: <MdWarning className="text-yellow-500" size={24} />,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      title: title || 'Attention'
    }
  };

  const config = typeConfig[type];

  useEffect(() => {
    const interval = duration / 100;
    const timer = setInterval(() => {
      setProgress(prev => Math.max(prev - (100 / (duration / interval)), 0));
    }, interval);

    const timeout = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 300);
    }, duration);

    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 300);
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 min-w-[320px] max-w-md animate-slideInRight`}>
      <div className={`${config.bgColor} border ${config.borderColor} rounded-lg shadow-lg overflow-hidden`}>
        {/* Progress bar */}
        <div className="h-1 bg-gray-200">
          <div 
            className={`h-full ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`}
            style={{ width: `${progress}%`, transition: 'width 0.1s linear' }}
          />
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {config.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${config.textColor}`}>
                  {config.title}
                </p>
                <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                  {message}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToastNotification;