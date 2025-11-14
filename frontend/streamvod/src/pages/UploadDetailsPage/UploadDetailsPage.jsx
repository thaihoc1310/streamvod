// src/pages/UploadDetailsPage/UploadDetailsPage.jsx
import React, { useState } from 'react';
import styles from './UploadDetailsPage.module.css';

import TextInputWithCounter from '../../components/TextInputWithCounter/TextInputWithCounter';
import VideoPreviewCard from '../../components/VideoPreviewCard/VideoPreviewCard';

import videoThumbnail from '../../assets/images/demoimg1.png';

const UploadDetailsPage = () => {
  const [title, setTitle] = useState('Thêm tiêu đề để mô tả cho video của bạn');
  const [description, setDescription] = useState('Giới thiệu về video của bạn cho người xem');

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formSection}>
        <TextInputWithCounter
          label="Tiêu đề (bắt buộc)"
          placeholder="Thêm tiêu đề để mô tả cho video của bạn"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={400}
        />
        <TextInputWithCounter
          label="Mô tả"
          placeholder="Giới thiệu về video của bạn cho người xem"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={4000}
          isTextarea={true}
        />
        <button className={styles.createButton}>Tạo video</button>
      </div>

      <div className={styles.previewSection}>
        <VideoPreviewCard
          thumbnail={videoThumbnail}
          duration="3:47"
          fileName="videodautien.mp4"
          fileSize="12.8GB"
        />
      </div>
    </div>
  );
};

export default UploadDetailsPage;