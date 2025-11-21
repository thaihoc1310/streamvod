// src/pages/UploadDetailsPage/UploadDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './UploadDetailsPage.module.css';

import TextInputWithCounter from '../../components/TextInputWithCounter/TextInputWithCounter';
import VideoPreviewCard from '../../components/VideoPreviewCard/VideoPreviewCard';

import { getVideoById, updateVideo } from '../../services/videoService';
import { formatDuration, formatFileSize, getStatusText } from '../../utils/formatters';

const UploadDetailsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { videoId, fileName, fileSize } = location.state || {};
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoData, setVideoData] = useState(null);
  const [isPolling, setIsPolling] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Poll video data every 5 seconds
  useEffect(() => {
    if (!videoId) {
      navigate('/upload');
      return;
    }

    const fetchVideoData = async () => {
      try {
        const data = await getVideoById(videoId);
        setVideoData(data);
        
        // Stop polling if status is ready or failed
        if (data.status === 'ready' || data.status === 'failed') {
          setIsPolling(false);
        }
      } catch (error) {
        console.error('Error fetching video data:', error);
      }
    };

    // Fetch immediately
    fetchVideoData();

    // Set up polling interval
    let intervalId;
    if (isPolling) {
      intervalId = setInterval(fetchVideoData, 5000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [videoId, isPolling, navigate]);

  const handleCreateVideo = async () => {
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề video');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateVideo(videoId, {
        title: title.trim(),
        description: description.trim(),
      });
      
      // alert('Tạo video thành công!');
      navigate('/');
    } catch (error) {
      console.error('Error updating video:', error);
      alert(`Lỗi cập nhật video: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const isReady = videoData?.status === 'ready';
  const isFailed = videoData?.status === 'failed';
  const showForm = !isFailed;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formSection}>
        {showForm ? (
          <>
            <TextInputWithCounter
              label="Tiêu đề (bắt buộc)"
              placeholder="Thêm tiêu đề để mô tả cho video của bạn"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={400}
              disabled={false}
            />
            <TextInputWithCounter
              label="Mô tả"
              placeholder="Giới thiệu về video của bạn cho người xem"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={4000}
              isTextarea={true}
              disabled={false}
            />
            <button 
              className={`${styles.createButton} ${!isReady ? styles.disabled : ''}`}
              onClick={handleCreateVideo}
              disabled={!isReady || isSubmitting}
            >
              {isSubmitting ? 'Đang xử lý...' : 'Tạo video'}
            </button>
          </>
        ) : (
          <div className={styles.failedContainer}>
            <h2>Upload thất bại</h2>
            <p>Video của bạn không thể được xử lý. Vui lòng thử lại.</p>
            <button 
              className={styles.backButton}
              onClick={handleBackToHome}
            >
              Về trang chủ
            </button>
          </div>
        )}
      </div>

      <div className={styles.previewSection}>
        <VideoPreviewCard
          thumbnail={videoData?.thumbnail_url}
          duration={videoData?.duration_seconds ? formatDuration(videoData.duration_seconds) : null}
          fileName={fileName || 'video.mp4'}
          fileSize={fileSize ? formatFileSize(fileSize) : null}
          status={videoData?.status}
        />
      </div>
    </div>
  );
};

export default UploadDetailsPage;