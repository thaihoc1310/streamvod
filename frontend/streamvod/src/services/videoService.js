// src/services/videoService.js
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { getAuthHeaders } from './authService';

/**
 * Initiate video upload - Lấy presigned URL từ backend
 * @returns {Promise<{video_id: string, s3_source_key: string, presigned: {url: string, fields: object}}>}
 */
export const initiateVideoUpload = async () => {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.VIDEO_INITIATE}`, {
    method: 'POST',
    headers: getAuthHeaders(),
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

// ===== MULTIPART UPLOAD (with Transfer Acceleration) =====

const PART_SIZE = 10 * 1024 * 1024; // 10MB per part

/**
 * Initiate multipart upload
 * @returns {Promise<{video_id: string, upload_id: string, key: string}>}
 */
export const initiateMultipartUpload = async () => {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MULTIPART_INITIATE}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to initiate multipart upload: ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Get presigned URLs for multipart upload
 * @param {string} videoId
 * @param {string} uploadId
 * @param {number} numParts
 * @returns {Promise<{parts: Array<{part_number: number, url: string}>}>}
 */
export const getMultipartUploadUrls = async (videoId, uploadId, numParts) => {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MULTIPART_GET_URLS}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      video_id: videoId,
      upload_id: uploadId,
      num_parts: numParts,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get upload URLs: ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Upload a single part to S3
 * @param {string} url - Presigned URL
 * @param {Blob} partData - Part data
 * @param {Function} onProgress - Optional progress callback
 * @returns {Promise<string>} - ETag of uploaded part
 */
const uploadPart = async (url, partData, onProgress = null) => {
  // Don't add Content-Type header - presigned URL is signed without it
  const response = await fetch(url, {
    method: 'PUT',
    body: partData,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload part: ${response.statusText}`);
  }

  // Get ETag from response headers
  const etag = response.headers.get('ETag');
  if (!etag) {
    throw new Error('No ETag returned from S3');
  }

  // Call progress callback if provided
  if (onProgress) {
    onProgress();
  }

  return etag;
};

/**
 * Complete multipart upload
 * @param {string} videoId
 * @param {string} uploadId
 * @param {Array<{PartNumber: number, ETag: string}>} parts
 * @returns {Promise<object>}
 */
export const completeMultipartUpload = async (videoId, uploadId, parts) => {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MULTIPART_COMPLETE}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      video_id: videoId,
      upload_id: uploadId,
      parts: parts,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to complete upload: ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Upload video using multipart upload with Transfer Acceleration
 * @param {File} file - Video file to upload
 * @param {Function} onProgress - Optional progress callback (uploadedParts, totalParts)
 * @param {number} maxConcurrent - Maximum concurrent uploads (default: 5)
 * @returns {Promise<string>} - video_id
 */
export const uploadVideoMultipart = async (file, onProgress = null, maxConcurrent = 5) => {
  // Step 1: Initiate multipart upload
  const { video_id, upload_id, key } = await initiateMultipartUpload();
  
  // Step 2: Calculate number of parts
  const numParts = Math.ceil(file.size / PART_SIZE);
  
  // Step 3: Get presigned URLs for all parts
  const { parts: urlParts } = await getMultipartUploadUrls(video_id, upload_id, numParts);
  
  // Step 4: Upload all parts in parallel with concurrency limit
  const uploadedParts = [];
  let completedParts = 0;
  
  // Create upload tasks for all parts
  const uploadTasks = [];
  for (let i = 0; i < numParts; i++) {
    const start = i * PART_SIZE;
    const end = Math.min(start + PART_SIZE, file.size);
    const partData = file.slice(start, end);
    
    const urlPart = urlParts.find(p => p.part_number === i + 1);
    if (!urlPart) {
      throw new Error(`No URL for part ${i + 1}`);
    }
    
    uploadTasks.push({
      partNumber: i + 1,
      url: urlPart.url,
      data: partData,
    });
  }
  
  // Upload parts with concurrency control
  const uploadWithConcurrency = async (tasks) => {
    const results = [];
    const executing = [];
    
    for (const task of tasks) {
      const promise = uploadPart(task.url, task.data, () => {
        completedParts++;
        if (onProgress) {
          onProgress(completedParts, numParts);
        }
      }).then(etag => ({
        PartNumber: task.partNumber,
        ETag: etag,
      }));
      
      results.push(promise);
      
      if (maxConcurrent <= tasks.length) {
        const e = promise.then(() => executing.splice(executing.indexOf(e), 1));
        executing.push(e);
        
        if (executing.length >= maxConcurrent) {
          await Promise.race(executing);
        }
      }
    }
    
    return Promise.all(results);
  };
  
  // Execute uploads
  const parts = await uploadWithConcurrency(uploadTasks);
  
  // Sort parts by PartNumber (S3 requires parts to be in order)
  parts.sort((a, b) => a.PartNumber - b.PartNumber);
  
  // Step 5: Complete multipart upload
  await completeMultipartUpload(video_id, upload_id, parts);
  
  return video_id;
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
    headers: getAuthHeaders(),
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
