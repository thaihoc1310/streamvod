// src/pages/UploadPage/UploadPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './UploadPage.module.css';
import Dropzone from '../../components/Dropzone/Dropzone';
import UploadInfoItem from '../../components/UploadInfoItem/UploadInfoItem';

import sizeIcon from '../../assets/icons/camicon.svg';
import formatIcon from '../../assets/icons/fileicon.svg';
import resolutionIcon from '../../assets/icons/qualityicon.svg';
import ratioIcon from '../../assets/icons/bulbicon.svg';

const UploadPage = () => {

    const navigate = useNavigate();

    const handleSelectFile = () => {
    console.log('Nút chọn video đã được bấm, đang chuyển trang...');
    navigate('/upload-details');

  };
  return (
    <div className={styles.pageContainer}>
      <div className={styles.uploadWrapper}>
        <Dropzone onSelectFile={handleSelectFile} />

        <div className={styles.infoGrid}>
          <UploadInfoItem icon={sizeIcon} title="Kích thước">
            Kích thước tối đa: 30GB
          </UploadInfoItem>
          <UploadInfoItem icon={formatIcon} title="Định dạng tệp">
            Khuyến nghị: ".mp4". Các định dạng chính khác cũng được hỗ trợ.
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