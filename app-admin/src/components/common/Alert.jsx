import React from 'react';
import { FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

export const Alert = ({ type = 'info', message, onClose }) => {
  const types = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
  };

  return (
    <div className={`p-4 rounded-lg border ${types[type]} flex justify-between items-center mb-4`}>
      <div className="flex items-center gap-2">
        {type === 'success' && <FiCheckCircle className="text-green-600" />}
        {type === 'error' && <FiAlertCircle className="text-red-600" />}
        {type === 'warning' && <FiAlertCircle className="text-yellow-600" />}
        {type === 'info' && <FiAlertCircle className="text-blue-600" />}
        <span>{message}</span>
      </div>
      {onClose && (
        <button onClick={onClose} className="ml-4 text-gray-500 hover:text-gray-700">
          <FiX />
        </button>
      )}
    </div>
  );
};

export default Alert;