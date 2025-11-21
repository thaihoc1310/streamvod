// src/components/VideoCard/VideoCard.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './VideoCard.module.css';
import { formatDuration, formatTimeAgo } from '../../utils/formatters';

const VideoCard = ({ video }) => {
  const navigate = useNavigate();

  // Support both formats: mock data and API response
  const id = video.id;
  const thumbnail = video.thumbnail || video.thumbnail_url;
  const title = video.title;
  const duration = video.duration || (video.duration_seconds ? formatDuration(video.duration_seconds) : null);
  const uploadedAgo = video.uploadedAgo || (video.created_at ? formatTimeAgo(video.created_at) : null);

  const handleClick = () => {
    navigate(`/watch/${id}`);
  };

  return (
    <div className={styles.card} onClick={handleClick}>
      <div className={styles.thumbnailContainer}>
        {thumbnail ? (
          <img src={thumbnail} alt={title} className={styles.thumbnail} />
        ) : (
          <div className={styles.thumbnailPlaceholder}>
            <span>No Thumbnail</span>
          </div>
        )}
        {duration && <span className={styles.duration}>{duration}</span>}
      </div>
      <div className={styles.info}>
        <h3 className={styles.title}>{title}</h3>
        {uploadedAgo && <p className={styles.meta}>{uploadedAgo}</p>}
      </div>
    </div>
  );
};

export default VideoCard;