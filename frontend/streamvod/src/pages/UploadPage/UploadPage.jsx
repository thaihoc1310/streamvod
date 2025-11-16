// src/pages/UploadPage/UploadPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './UploadPage.module.css';
import Dropzone from '../../components/Dropzone/Dropzone';
import UploadInfoItem from '../../components/UploadInfoItem/UploadInfoItem';

import sizeIcon from '../../assets/icons/camicon.svg';
import formatIcon from '../../assets/icons/fileicon.svg';
import resolutionIcon from '../../assets/icons/qualityicon.svg';
import ratioIcon from '../../assets/icons/bulbicon.svg';

import { initiateVideoUpload, uploadVideoToS3 } from '../../services/videoService';

const UploadPage = () => {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const handleSelectFile = async (file) => {
    if (!file) {
      alert('Vui lòng chọn một file video');
      return;
    }

    // Validate file type - chỉ cho phép MP4
    if (file.type !== 'video/mp4' && !file.name.toLowerCase().endsWith('.mp4')) {
      alert('Chỉ hỗ trợ file MP4. Vui lòng chọn file có định dạng .mp4');
      return;
    }

    // Validate file size (max 5GB = 5368709120 bytes)
    const maxSize = 5 * 1024 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File vượt quá kích thước tối đa 5GB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Step 1: Initiate upload - lấy presigned URL từ backend
      console.log('Đang khởi tạo upload...');
      const initResponse = await initiateVideoUpload();
      const { video_id, presigned } = initResponse;
      
      console.log('Đã nhận video_id:', video_id);
      console.log('Đang upload file lên S3...');

      // Step 2: Upload file lên S3 bằng presigned POST
      await uploadVideoToS3(file, presigned);
      
      console.log('Upload thành công! Chuyển sang trang upload-details');

      // Step 3: Navigate sang upload-details với video_id
      navigate('/upload-details', { state: { videoId: video_id, fileName: file.name, fileSize: file.size } });
      
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError(error.message);
      alert(`Lỗi upload: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };
  return (
    <div className={styles.pageContainer}>
      <div className={styles.uploadWrapper}>
        <Dropzone 
          onSelectFile={handleSelectFile} 
          isUploading={isUploading}
        />

        <div className={styles.infoGrid}>
          <UploadInfoItem icon={sizeIcon} title="Kích thước">
            Kích thước tối đa: 5GB
          </UploadInfoItem>
          <UploadInfoItem icon={formatIcon} title="Định dạng tệp">
            Chỉ hỗ trợ định dạng MP4 (.mp4)
          </UploadInfoItem>
          <UploadInfoItem icon={resolutionIcon} title="Độ phân giải video">
            Độ phân giải khuyến nghị: 480p, 720p, 1080p.
          </UploadInfoItem>
          <UploadInfoItem icon={ratioIcon} title="Tỉ lệ khung hình">
            Khuyến nghị: 16:9 cho chế độ ngang, 9:16 cho chế độ dọc.
          </UploadInfoItem>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;