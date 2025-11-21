// src/services/authService.js
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

const TOKEN_KEY = 'auth_token';

/**
 * Store token in localStorage
 */
export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Get token from localStorage
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Remove token from localStorage
 */
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!getToken();
};

/**
 * Get headers with authentication token
 */
export const getAuthHeaders = () => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

/**
 * Register a new user
 * @param {object} userData - {username, email, password}
 * @returns {Promise<object>}
 */
export const register = async (userData) => {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH_REGISTER}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Registration failed');
  }

  return await response.json();
};

/**
 * Login user
 * @param {object} credentials - {email, password}
 * @returns {Promise<object>}
 */
export const login = async (credentials) => {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH_LOGIN}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Login failed');
  }

  const data = await response.json();
  setToken(data.access_token);
  return data;
};

/**
 * Logout user
 */
export const logout = async () => {
  try {
    await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH_LOGOUT}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    removeToken();
  }
};

/**
 * Get current user profile
 * @returns {Promise<object>}
 */
export const getCurrentUser = async () => {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH_ME}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      removeToken();
    }
    throw new Error('Failed to get user profile');
  }

  return await response.json();
};

