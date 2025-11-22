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

import { uploadVideoMultipart } from '../../services/videoService';
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
      console.log('Đang upload video với multipart + Transfer Acceleration...');
      
      // Upload using multipart upload (hỗ trợ Transfer Acceleration)
      const video_id = await uploadVideoMultipart(file);
      
      console.log('Upload thành công! Video ID:', video_id);
      console.log('Chuyển sang trang upload-details');

      // Navigate sang upload-details với video_id
      navigate('/upload-details', { 
        state: { 
          videoId: video_id, 
          fileName: file.name, 
          fileSize: file.size 
        } 
      });
      
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
            Kích thước tối đa: 100GB (hỗ trợ multipart upload)
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