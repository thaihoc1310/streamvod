import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import VideoCard from '../../components/VideoCard/VideoCard';
import SkeletonCard from '../../components/SkeletonCard/SkeletonCard';
import styles from './SearchResultsPage.module.css';
import { searchVideos } from '../../services/videoService';

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query) {
        setVideos([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await searchVideos(query);
        // Handle both direct array and paginated response
        const videoList = Array.isArray(data) ? data : (data.videos || data.items || []);
        setVideos(videoList);
      } catch (err) {
        console.error('Search error:', err);
        setError('Không thể tìm kiếm video. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query]);

  if (!query) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <p>Vui lòng nhập từ khóa tìm kiếm</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>
          Đang tìm kiếm: <span className={styles.query}>"{query}"</span>
        </h1>
        <div className={styles.videoGrid}>
          {[...Array(8)].map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        Kết quả tìm kiếm cho: <span className={styles.query}>"{query}"</span>
      </h1>
      
      {videos.length === 0 ? (
        <div className={styles.noResults}>
          <p>Không tìm thấy video nào phù hợp với "{query}"</p>
          <p className={styles.suggestion}>Hãy thử tìm kiếm với từ khóa khác</p>
        </div>
      ) : (
        <>
          <p className={styles.resultCount}>
            Tìm thấy {videos.length} video
          </p>
          <div className={styles.videoGrid}>
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SearchResultsPage;
