import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api';
import { getAuthHeaders } from '../../services/authService';
import { formatDuration, getTimeAgo, formatViews } from '../../utils/formatters';
import { FiEdit2, FiSave, FiX, FiHeart, FiEye } from 'react-icons/fi';
import styles from './MyVideosPage.module.css';

const MyVideosPage = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchMyVideos();
  }, []);

  const fetchMyVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.USER_VIDEOS(user.id)}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }

      const data = await response.json();
      setVideos(data.videos || []);
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (video) => {
    setEditingId(video.id);
    setEditForm({
      title: video.title,
      description: video.description || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ title: '', description: '' });
  };

  const handleSave = async (videoId) => {
    if (!editForm.title.trim()) {
      alert('Title cannot be empty');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.VIDEO_BY_ID(videoId)}`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(editForm),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update video');
      }

      // Update local state
      setVideos(videos.map(v => 
        v.id === videoId 
          ? { ...v, title: editForm.title, description: editForm.description }
          : v
      ));

      setEditingId(null);
      setEditForm({ title: '', description: '' });
    } catch (err) {
      console.error('Error updating video:', err);
      alert('Failed to update video');
    } finally {
      setSaving(false);
    }
  };

  const handleVideoClick = (videoId) => {
    if (editingId !== videoId) {
      navigate(`/watch/${videoId}`);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>My Videos</h1>
        <div className={styles.loading}>Loading your videos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>My Videos</h1>
        <div className={styles.error}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Videos</h1>
        <p className={styles.subtitle}>
          {videos.length} {videos.length === 1 ? 'video' : 'videos'}
        </p>
      </div>

      {videos.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>You haven't uploaded any videos yet</p>
          <button 
            className={styles.uploadButton}
            onClick={() => navigate('/upload')}
          >
            Upload Your First Video
          </button>
        </div>
      ) : (
        <div className={styles.videoList}>
          {videos.map((video) => (
            <div key={video.id} className={styles.videoItem}>
              {/* Thumbnail */}
              <div 
                className={styles.thumbnail}
                onClick={() => handleVideoClick(video.id)}
              >
                {video.thumbnail_url ? (
                  <img src={video.thumbnail_url} alt={video.title} />
                ) : (
                  <div className={styles.noThumbnail}>No thumbnail</div>
                )}
                {video.duration_seconds && (
                  <span className={styles.duration}>
                    {formatDuration(video.duration_seconds)}
                  </span>
                )}
              </div>

              {/* Video Info */}
              <div className={styles.videoInfo}>
                {editingId === video.id ? (
                  // Edit Mode
                  <div className={styles.editForm}>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className={styles.editInput}
                      placeholder="Video title"
                      maxLength={255}
                    />
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className={styles.editTextarea}
                      placeholder="Video description"
                      rows={3}
                    />
                  </div>
                ) : (
                  // View Mode
                  <div className={styles.videoDetails}>
                    <h3 
                      className={styles.videoTitle}
                      onClick={() => handleVideoClick(video.id)}
                    >
                      {video.title || 'Untitled Video'}
                    </h3>
                    {video.description && (
                      <p className={styles.videoDescription}>
                        {video.description}
                      </p>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className={styles.videoStats}>
                  <span className={styles.statItem}>
                    <FiEye size={16} />
                    {formatViews(video.views)}
                  </span>
                  <span className={styles.statItem}>
                    <FiHeart size={16} />
                    {video.like_count || 0} likes
                  </span>
                  <span className={styles.uploadDate}>
                    Uploaded {getTimeAgo(video.created_at)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className={styles.actions}>
                {editingId === video.id ? (
                  <>
                    <button
                      className={`${styles.actionButton} ${styles.saveButton}`}
                      onClick={() => handleSave(video.id)}
                      disabled={saving}
                    >
                      <FiSave size={20} />
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      className={`${styles.actionButton} ${styles.cancelButton}`}
                      onClick={handleCancelEdit}
                      disabled={saving}
                    >
                      <FiX size={20} />
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    className={`${styles.actionButton} ${styles.editButton}`}
                    onClick={() => handleEdit(video)}
                  >
                    <FiEdit2 size={20} />
                    Edit
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyVideosPage;


