import React from 'react';
import { FiCheck, FiPlus, FiSearch, FiDownload, FiEdit, FiTrash2, FiEye, FiLock, FiUpload } from 'react-icons/fi';

export const Button = ({ children, variant = 'primary', onClick, disabled, icon, className = '', type = 'button', size = 'md' }) => {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  const iconMap = {
    check: <FiCheck />,
    plus: <FiPlus />,
    search: <FiSearch />,
    download: <FiDownload />,
    edit: <FiEdit />,
    trash: <FiTrash2 />,
    eye: <FiEye />,
    lock: <FiLock />,
    upload: <FiUpload />,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {icon && iconMap[icon]}
      {children}
    </button>
  );
};

export default Button;