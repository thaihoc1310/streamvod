// src/pages/HomePage/HomePage.jsx

import React, { useState, useEffect } from 'react';
import styles from './HomePage.module.css';

import CategoryFilters from '../../components/CategoryFilters/CategoryFilters';
import VideoCard from '../../components/VideoCard/VideoCard';
import SkeletonCard from '../../components/SkeletonCard/SkeletonCard';
import { mockVideos } from '../../data/mockVideos';

const HomePage = () => {
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // đợi
    const timer = setTimeout(() => {
      setVideos(mockVideos);
      setIsLoading(false);
    }, 2000);

    
    return () => clearTimeout(timer);
  }, []); 

  const skeletonItems = Array.from({ length: 8 }, (_, index) => <SkeletonCard key={index} />);

  return (
    
      <div className={styles.videoGrid}>
        {isLoading
          ? skeletonItems
          : videos.map((video) => <VideoCard key={video.id} video={video} />)}
      </div>
    
  );
};

export default HomePage;