// src/components/VideoCard/VideoCard.jsx

import React from 'react';
import styles from './VideoCard.module.css';

const VideoCard = ({ video }) => {
  const { thumbnail, duration, title, uploadedAgo } = video;

  return (
    <div className={styles.card}>
      <div className={styles.thumbnailContainer}>
        <img src={thumbnail} alt={title} className={styles.thumbnail} />
        <span className={styles.duration}>{duration}</span>
      </div>
      <div className={styles.info}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.meta}>{uploadedAgo}</p>
      </div>
    </div>
  );
};

export default VideoCard;