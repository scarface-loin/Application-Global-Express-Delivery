import React from 'react';

export const Card = ({ 
  title, 
  children, 
  action, 
  className = '',
  onClick 
}) => {
  const cardContent = (
    <div className={`bg-white rounded-xl shadow-md p-6 ${className}`}>
      {title && (
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {action && <div>{action}</div>} {/* Encapsuler action dans un div */}
        </div>
      )}
      {/* Les children sont gérés par le parent, donc pas de problème ici */}
      {children}
    </div>
  );

  if (onClick) {
    return (
      <div onClick={onClick} className="cursor-pointer">
        {cardContent}
      </div>
    );
  }

  return cardContent;
};

export default Card;