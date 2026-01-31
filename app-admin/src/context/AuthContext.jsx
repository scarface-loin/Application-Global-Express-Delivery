import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Initialisation du token depuis le localStorage
  const [token, setToken] = useState(() => {
    return localStorage.getItem('auth_token') || null;
  });

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('admin_info');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Fonction de connexion
  const login = (newToken, userInfo = null) => {
    setToken(newToken);
    localStorage.setItem('auth_token', newToken);
    
    if (userInfo) {
      setUser(userInfo);
      localStorage.setItem('admin_info', JSON.stringify(userInfo));
    }
  };

  // Fonction de déconnexion
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('admin_info');
    localStorage.removeItem('admin_id');
  };

  // Vérification du token au chargement
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('admin_info');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const value = {
    token,
    user,
    login,
    logout,
    isAuthenticated: !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;