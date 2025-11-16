// src/components/VideoPreviewCard/VideoPreviewCard.jsx
import React from 'react';
import styles from './VideoPreviewCard.module.css';
import checkIcon from '../../assets/icons/checkicon.svg';
import { FiUploadCloud, FiLoader, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { getStatusText } from '../../utils/formatters';

const VideoPreviewCard = ({ thumbnail, duration, fileName, fileSize, status = 'processing' }) => {
  // Get status icon based on video status
  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <FiLoader className={`${styles.statusIcon} ${styles.spinning}`} />;
      case 'ready':
        return <FiCheckCircle className={`${styles.statusIcon} ${styles.success}`} />;
      case 'failed':
        return <FiXCircle className={`${styles.statusIcon} ${styles.error}`} />;
      default:
        return <FiLoader className={`${styles.statusIcon} ${styles.spinning}`} />;
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case 'ready':
        return styles.statusSuccess;
      case 'failed':
        return styles.statusError;
      case 'processing':
        return styles.statusProcessing;
      default:
        return styles.statusProcessing;
    }
  };

  return (
    <div className={styles.previewCard}>
      <div className={styles.thumbnailContainer}>
        {thumbnail ? (
          <img src={thumbnail} alt="Video preview" className={styles.thumbnail} />
        ) : (
          <div className={styles.thumbnailPlaceholder}>
            <FiLoader size={48} color="#999" className={styles.spinning} />
          </div>
        )}
        {duration && <span className={styles.duration}>{duration}</span>}
      </div>
      <div className={styles.videoInfo}>
        <p className={styles.fileName}>{fileName}</p>
        <div className={`${styles.status} ${getStatusClass()}`}>
          {getStatusIcon()}
          <span>{getStatusText(status)}{fileSize && ` (${fileSize})`}</span>
        </div>
      </div>
    </div>
  );
};

export default VideoPreviewCard;