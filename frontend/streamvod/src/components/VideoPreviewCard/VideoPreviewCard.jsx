// src/components/VideoPreviewCard/VideoPreviewCard.jsx
import React from 'react';
import styles from './VideoPreviewCard.module.css';
import checkIcon from '../../assets/icons/checkicon.svg'; //

const VideoPreviewCard = ({ thumbnail, duration, fileName, fileSize }) => {
  return (
    <div className={styles.previewCard}>
      <div className={styles.thumbnailContainer}>
        <img src={thumbnail} alt="Video preview" className={styles.thumbnail} />
        <span className={styles.duration}>{duration}</span>
      </div>
      <div className={styles.videoInfo}>
        <p className={styles.fileName}>{fileName}</p>
        <div className={styles.status}>
          <img src={checkIcon} alt="Success" className={styles.checkIcon} />
          <span>Đã tải lên ({fileSize})</span>
        </div>
      </div>
    </div>
  );
};

export default VideoPreviewCard;