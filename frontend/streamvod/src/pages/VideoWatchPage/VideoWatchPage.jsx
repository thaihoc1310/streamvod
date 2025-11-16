// src/pages/VideoWatchPage/VideoWatchPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './VideoWatchPage.module.css';
import HLSPlayer from '../../components/HLSPlayer/HLSPlayer';
import { getVideoById } from '../../services/videoService';
import { formatDuration, getTimeAgo } from '../../utils/formatters';

const VideoWatchPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);
        const data = await getVideoById(id);
        
        console.log('Video data:', data);
        console.log('Playback URL:', data.playback_url);
        console.log('Status:', data.status);
        
        if (data.status !== 'ready') {
          setError('Video chưa sẵn sàng để phát');
          return;
        }
        
        if (!data.playback_url) {
          setError('Video không có URL phát');
          return;
        }
        
        setVideo(data);
      } catch (err) {
        console.error('Error fetching video:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [id]);

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Đang tải video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.errorContainer}>
          <h2>Không thể phát video</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className={styles.backButton}>
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.videoSection}>
        <HLSPlayer
          src={video?.playback_url}
          poster={video?.thumbnail_url}
          autoplay={false}
        />
      </div>

      <div className={styles.videoInfo}>
        <h1 className={styles.videoTitle}>{video?.title || 'Không có tiêu đề'}</h1>
        
        <div className={styles.videoMeta}>
          <span className={styles.duration}>
            {video?.duration_seconds ? formatDuration(video.duration_seconds) : ''}
          </span>
          <span className={styles.dot}>•</span>
          <span className={styles.uploadDate}>
            {video?.created_at ? getTimeAgo(video.created_at) : ''}
          </span>
        </div>

        {video?.description && (
          <div className={styles.descriptionSection}>
            <h3>Mô tả</h3>
            <p className={styles.description}>{video.description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoWatchPage;
