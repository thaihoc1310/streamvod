// src/config/api.js
export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  // Videos
  VIDEOS: '/videos',
  VIDEO_INITIATE: '/videos/initiate',
  VIDEO_BY_ID: (id) => `/videos/${id}`,
  
  // Multipart Upload (with Transfer Acceleration)
  MULTIPART_INITIATE: '/videos/multipart/initiate',
  MULTIPART_GET_URLS: '/videos/multipart/get-urls',
  MULTIPART_COMPLETE: '/videos/multipart/complete',
  
  // Authentication
  AUTH_REGISTER: '/auth/register',
  AUTH_LOGIN: '/auth/login',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_ME: '/auth/me',
  
  // Likes
  VIDEO_TOGGLE_LIKE: (id) => `/videos/${id}/like`,
  VIDEO_LIKES: (id) => `/videos/${id}/likes`,
  USER_LIKED_VIDEOS: '/videos/me/liked-videos',
  
  // Watch Later
  VIDEO_TOGGLE_WATCH_LATER: (id) => `/videos/${id}/watch-later`,
  USER_WATCH_LATER: '/videos/me/watch-later',
  
  // Users
  USER_BY_ID: (id) => `/users/${id}`,
  USER_VIDEOS: (id) => `/users/${id}/videos`,
};
