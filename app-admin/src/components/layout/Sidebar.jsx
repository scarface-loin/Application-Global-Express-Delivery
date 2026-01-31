import React from 'react';
import {
  FiHome,
  FiPackage,
  FiUser,
  FiLogOut,
  FiTruck,
  FiPlus,
  FiCheckCircle,
  FiClock,      // <--- Pour Historique
  FiFileText    // <--- Pour Récapitulatif
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isOpen, onClose, currentPage, setCurrentPage }) => {
  const { logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: <FiHome /> },
    { id: 'deliveries', label: 'Course du jour', icon: <FiPackage /> },
    { id: 'validation', label: 'Validation', icon: <FiCheckCircle /> },
    { id: 'history', label: 'Historique', icon: <FiClock /> },            // <--- NOUVEAU
    { id: 'create-delivery', label: 'Créer Livraison', icon: <FiPlus /> },
    { id: 'profile', label: 'Mon Profil', icon: <FiUser /> },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        ></div>
      )}

      <aside
        className={`fixed top-0 left-0 h-full bg-gray-900 text-white w-64 z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0`}
      >
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FiTruck size={24} />
            Admin Livraisons
          </h1>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentPage(item.id);
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentPage === item.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
                }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
          >
            <FiLogOut />
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;