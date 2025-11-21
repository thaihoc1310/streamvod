// src/pages/HomePage/HomePage.jsx

import React, { useState, useEffect } from 'react';
import styles from './HomePage.module.css';

import CategoryFilters from '../../components/CategoryFilters/CategoryFilters';
import VideoCard from '../../components/VideoCard/VideoCard';
import SkeletonCard from '../../components/SkeletonCard/SkeletonCard';
import { getVideos } from '../../services/videoService';
import { formatDuration, getTimeAgo } from '../../utils/formatters';

const HomePage = () => {
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setIsLoading(true);
        const response = await getVideos(page, 20); // Load 20 videos per page
        
        // VideoCard now handles formatting internally
        setVideos(response.videos);
        setHasMore(response.has_next);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching videos:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, [page]);

  const skeletonItems = Array.from({ length: 8 }, (_, index) => <SkeletonCard key={index} />);

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>Không thể tải video</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Thử lại</button>
      </div>
    );
  }

  return (
    <div className={styles.videoGrid}>
      {isLoading
        ? skeletonItems
        : videos.length > 0 
          ? videos.map((video) => <VideoCard key={video.id} video={video} />)
          : <div className={styles.emptyState}>
              <p>Chưa có video nào</p>
            </div>
      }
    </div>
  );
};

export default HomePage;