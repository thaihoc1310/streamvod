// src/config/api.js
export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  VIDEOS: '/videos',
  VIDEO_INITIATE: '/videos/initiate',
  VIDEO_BY_ID: (id) => `/videos/${id}`,
};
