import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VideoCard from '../../components/VideoCard/VideoCard';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api';
import { getAuthHeaders } from '../../services/authService';
import styles from './LikedVideosPage.module.css';

const LikedVideosPage = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLikedVideos();
  }, []);

  const fetchLikedVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.USER_LIKED_VIDEOS}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch liked videos');
      }

      const data = await response.json();
      setVideos(data.videos || []);
    } catch (err) {
      console.error('Error fetching liked videos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Liked Videos</h1>
        <div className={styles.loading}>Loading your liked videos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Liked Videos</h1>
        <div className={styles.error}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Liked Videos</h1>
      <p className={styles.subtitle}>
        {videos.length} {videos.length === 1 ? 'video' : 'videos'}
      </p>

      {videos.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>You haven't liked any videos yet</p>
          <button 
            className={styles.browseButton}
            onClick={() => navigate('/')}
          >
            Browse Videos
          </button>
        </div>
      ) : (
        <div className={styles.videoGrid}>
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LikedVideosPage;

