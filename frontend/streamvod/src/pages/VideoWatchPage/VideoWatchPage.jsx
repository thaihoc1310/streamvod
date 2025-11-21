// src/pages/VideoWatchPage/VideoWatchPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './VideoWatchPage.module.css';
import HLSPlayer from '../../components/HLSPlayer/HLSPlayer';
import { getVideoById } from '../../services/videoService';
import { formatDuration, getTimeAgo, formatViews } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api';
import { getAuthHeaders } from '../../services/authService';
import { FiThumbsUp, FiClock, FiUser, FiEye } from 'react-icons/fi';

const VideoWatchPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isWatchLater, setIsWatchLater] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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
        setLikeCount(data.like_count || 0);
        setIsLiked(data.is_liked || false);
        setIsWatchLater(data.is_watch_later || false);
      } catch (err) {
        console.error('Error fetching video:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [id]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (actionLoading) return;

    try {
      setActionLoading(true);
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.VIDEO_TOGGLE_LIKE(id)}`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to toggle like');
      }

      const data = await response.json();
      setIsLiked(data.is_liked);
      setLikeCount(data.like_count);
    } catch (err) {
      console.error('Error toggling like:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleWatchLater = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (actionLoading) return;

    try {
      setActionLoading(true);
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.VIDEO_TOGGLE_WATCH_LATER(id)}`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to toggle watch later');
      }

      const data = await response.json();
      setIsWatchLater(data.is_watch_later);
    } catch (err) {
      console.error('Error toggling watch later:', err);
    } finally {
      setActionLoading(false);
    }
  };

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
          <span className={styles.views}>
            <FiEye size={18} />
            {video?.views !== undefined ? formatViews(video.views) : '0 lượt xem'}
          </span>
          <span className={styles.dot}>•</span>
          <span className={styles.duration}>
            {video?.duration_seconds ? formatDuration(video.duration_seconds) : ''}
          </span>
          <span className={styles.dot}>•</span>
          <span className={styles.uploadDate}>
            {video?.created_at ? getTimeAgo(video.created_at) : ''}
          </span>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          <button 
            className={`${styles.actionButton} ${isLiked ? styles.liked : ''}`}
            onClick={handleLike}
            disabled={actionLoading}
          >
            <FiThumbsUp size={20} />
            <span>{likeCount} {likeCount === 1 ? 'Like' : 'Likes'}</span>
          </button>

          <button 
            className={`${styles.actionButton} ${isWatchLater ? styles.saved : ''}`}
            onClick={handleWatchLater}
            disabled={actionLoading}
          >
            <FiClock size={20} />
            <span>{isWatchLater ? 'Saved' : 'Watch Later'}</span>
          </button>
        </div>

        {/* Uploader Info */}
        {video?.uploader && (
          <div className={styles.uploaderSection}>
            <div className={styles.uploaderAvatar}>
              {video.uploader.profile_picture ? (
                <img src={video.uploader.profile_picture} alt={video.uploader.username} />
              ) : (
                <FiUser size={24} />
              )}
            </div>
            <div className={styles.uploaderInfo}>
              <h3 className={styles.uploaderName}>{video.uploader.username}</h3>
              <p className={styles.uploadDate}>
                Uploaded {video?.created_at ? getTimeAgo(video.created_at) : ''}
              </p>
            </div>
          </div>
        )}

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
