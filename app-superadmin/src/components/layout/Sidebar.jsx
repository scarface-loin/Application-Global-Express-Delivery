// src/components/layout/Sidebar.js

import React from 'react';
import {
  FiHome,
  FiPackage,
  FiUser,
  FiLogOut,
  FiTruck,
  FiPlus,
  FiCheckCircle,
  FiTool,
  FiClock,
  FiFileText,
  FiDollarSign,
  FiUsers // <--- 1. AJOUTER L'IMPORT ICI
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isOpen, onClose, currentPage, setCurrentPage }) => {
  const { logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: <FiHome /> },
    { id: 'deliverymen', label: 'Équipe Livreurs', icon: <FiUsers /> }, // <--- 2. AJOUTER LA LIGNE ICI (Je l'ai mise en haut pour un accès rapide)
    { id: 'GarageValidationPage', label: 'Garage & Entretien', icon: <FiTool /> },
    { id: 'deliveries', label: 'Course du jour', icon: <FiPackage /> },
    { id: 'admin-assign-delivery', label: 'Attribution Livraisons', icon: <FiTruck /> },
    { id: 'CreateLivreurForm', label: 'Recruter Livreur', icon: <FiUser /> },
    { id: 'create-partner', label: 'Créer Partenaire', icon: <FiPlus /> },
    { id: 'validation', label: 'Validation', icon: <FiCheckCircle /> },
    { id: 'daily-summary', label: 'Récapitulatif jour', icon: <FiFileText /> },
    { id: 'driver-salary', label: 'Salaires Livreurs', icon: <FiDollarSign /> },
    { id: 'history', label: 'Historique', icon: <FiClock /> },
    { id: 'create-delivery', label: 'Créer Livraison', icon: <FiPlus /> },
  ];

  return (
    <>
      {/* ... Le reste du code reste identique ... */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        ></div>
      )}

      <aside
        className={`fixed top-0 left-0 h-full bg-gray-900 text-white w-64 z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 flex flex-col`}
      >
        <div className="p-4 border-b border-gray-800 flex-shrink-0">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <FiTruck size={20} />
            Admin Livraisons
          </h1>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto flex-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentPage(item.id);
                onClose();
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                currentPage === item.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-800 flex-shrink-0">
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors text-sm"
          >
            <FiLogOut size={16} />
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;