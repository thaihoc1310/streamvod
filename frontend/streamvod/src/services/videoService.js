// src/services/videoService.js
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

/**
 * Initiate video upload - Lấy presigned URL từ backend
 * @returns {Promise<{video_id: string, s3_source_key: string, presigned: {url: string, fields: object}}>}
 */
export const initiateVideoUpload = async () => {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.VIDEO_INITIATE}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to initiate upload: ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Upload video file to S3 using presigned POST
 * @param {File} file - Video file to upload
 * @param {object} presignedData - Presigned POST data from backend
 * @returns {Promise<void>}
 */
export const uploadVideoToS3 = async (file, presignedData) => {
  const formData = new FormData();
  
  // Append all fields from presigned data
  Object.keys(presignedData.fields).forEach(key => {
    formData.append(key, presignedData.fields[key]);
  });
  
  // File must be the last field
  formData.append('file', file);

  const response = await fetch(presignedData.url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload to S3: ${response.statusText}`);
  }
};

/**
 * Get video details by ID
 * @param {string} videoId
 * @returns {Promise<object>}
 */
export const getVideoById = async (videoId) => {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.VIDEO_BY_ID(videoId)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get video: ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Update video metadata (title and description)
 * @param {string} videoId
 * @param {object} data - {title?: string, description?: string}
 * @returns {Promise<object>}
 */
export const updateVideo = async (videoId, data) => {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.VIDEO_BY_ID(videoId)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update video: ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Get list of videos with pagination
 * @param {number} page - Page number (default: 1)
 * @param {number} perPage - Items per page (default: 10)
 * @param {string} query - Search query (optional)
 * @returns {Promise<object>}
 */
export const getVideos = async (page = 1, perPage = 10, query = null) => {
  let url = `${API_BASE_URL}${API_ENDPOINTS.VIDEOS}?page=${page}&per_page=${perPage}`;
  
  if (query) {
    url += `&q=${encodeURIComponent(query)}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get videos: ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Search videos by query
 * @param {string} query - Search query
 * @returns {Promise<Array>}
 */
export const searchVideos = async (query) => {
  const response = await fetch(
    `${API_BASE_URL}${API_ENDPOINTS.VIDEOS}?q=${encodeURIComponent(query)}&per_page=50`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to search videos: ${response.statusText}`);
  }

  const data = await response.json();
  return data.videos || data.items || data; // Handle different response formats
};
