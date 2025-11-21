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
import { 
  isValidVideoFormat, 
  isValidFileSize, 
  getSupportedFormatsText,
  MAX_FILE_SIZE 
} from '../../utils/videoConstants';
import { formatFileSize } from '../../utils/formatters';

const UploadPage = () => {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const handleSelectFile = async (file) => {
    if (!file) {
      alert('Vui lòng chọn một file video');
      return;
    }

    // Validate file type
    if (!isValidVideoFormat(file)) {
      alert(`Định dạng video không được hỗ trợ. Vui lòng chọn file: ${getSupportedFormatsText()}`);
      return;
    }

    // Validate file size
    if (!isValidFileSize(file)) {
      alert(`File vượt quá kích thước tối đa ${formatFileSize(MAX_FILE_SIZE)}`);
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
            Hỗ trợ: MP4, MOV, AVI, MKV, WebM, FLV, MPEG, 3GP, WMV, M4V
          </UploadInfoItem>
          <UploadInfoItem icon={resolutionIcon} title="Độ phân giải video">
            Độ phân giải khuyến nghị: 480p, 720p, 1080p, 4K.
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