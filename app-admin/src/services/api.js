const API_BASE_URL = 'https://application-global-express-delivery-back.onrender.com/api';

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    ...options.headers,
  };

  if (token && !options.isFormData) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['Content-Type'] = 'application/json';
  } else if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  // Si le body est déjà une FormData, ne pas le convertir en JSON
  if (options.body && !options.isFormData && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/';
    throw new Error('Session expirée');
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Une erreur est survenue');
  }

  return response.json();
};

// Fonction spéciale pour les requêtes FormData
export const apiFormRequest = async (endpoint, formData) => {
  const token = localStorage.getItem('token');
  const headers = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/';
    throw new Error('Session expirée');
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Une erreur est survenue');
  }

  return response.json();
};

export { API_BASE_URL };