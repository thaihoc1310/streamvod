// src/utils/videoConstants.js

/**
 * Supported video formats that can be converted to HLS by AWS MediaConvert
 */
export const SUPPORTED_VIDEO_FORMATS = {
  MIME_TYPES: [
    'video/mp4',
    'video/quicktime',      // .mov
    'video/x-msvideo',      // .avi
    'video/x-matroska',     // .mkv
    'video/webm',           // .webm
    'video/x-flv',          // .flv
    'video/mpeg',           // .mpeg, .mpg
    'video/3gpp',           // .3gp
    'video/x-ms-wmv',       // .wmv
  ],
  EXTENSIONS: [
    '.mp4',
    '.mov',
    '.avi',
    '.mkv',
    '.webm',
    '.flv',
    '.mpeg',
    '.mpg',
    '.3gp',
    '.wmv',
    '.m4v',
  ],
  DISPLAY_NAMES: {
    '.mp4': 'MP4',
    '.mov': 'MOV',
    '.avi': 'AVI',
    '.mkv': 'MKV',
    '.webm': 'WebM',
    '.flv': 'FLV',
    '.mpeg': 'MPEG',
    '.mpg': 'MPEG',
    '.3gp': '3GP',
    '.wmv': 'WMV',
    '.m4v': 'M4V',
  },
};

/**
 * Maximum file size for upload with multipart (5TB)
 * Note: Multipart upload with S3 Transfer Acceleration supports up to 5TB
 * For practical purposes, we set a reasonable limit
 */
export const MAX_FILE_SIZE = 100 * 1024 * 1024 * 1024; // 100GB in bytes (practical limit)

/**
 * Get display name for video format
 * @param {string} filename
 * @returns {string}
 */
export const getVideoFormatName = (filename) => {
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return SUPPORTED_VIDEO_FORMATS.DISPLAY_NAMES[extension] || extension.toUpperCase();
};

/**
 * Validate if file is a supported video format
 * @param {File} file
 * @returns {boolean}
 */
export const isValidVideoFormat = (file) => {
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  return (
    SUPPORTED_VIDEO_FORMATS.MIME_TYPES.includes(file.type) ||
    SUPPORTED_VIDEO_FORMATS.EXTENSIONS.includes(fileExtension)
  );
};

/**
 * Validate file size
 * @param {File} file
 * @returns {boolean}
 */
export const isValidFileSize = (file) => {
  return file.size <= MAX_FILE_SIZE;
};

/**
 * Get formatted list of supported formats for display
 * @returns {string}
 */
export const getSupportedFormatsText = () => {
  const formats = Object.values(SUPPORTED_VIDEO_FORMATS.DISPLAY_NAMES);
  const uniqueFormats = [...new Set(formats)];
  return uniqueFormats.join(', ');
};
