// src/components/VideoCard/VideoCard.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './VideoCard.module.css';

const VideoCard = ({ video }) => {
  const { id, thumbnail, duration, title, uploadedAgo } = video;
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/watch/${id}`);
  };

  return (
    <div className={styles.card} onClick={handleClick}>
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