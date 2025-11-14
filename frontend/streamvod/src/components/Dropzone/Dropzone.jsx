// src/components/Dropzone/Dropzone.jsx
import React from 'react';
import styles from './Dropzone.module.css';
import uploadIcon from '../../assets/images/uploadimg.png'; 

const Dropzone = ({ onSelectFile })  => {
  return (
    <div className={styles.dropzone}>
      <img src={uploadIcon} alt="Upload" className={styles.uploadIcon} />
      <h2>Chọn video để tải lên</h2>
      <p>Hoặc kéo và thả video vào đây</p>
      <button 
      className={styles.uploadButton}
      onClick={onSelectFile}
      >Chọn video</button>
    </div>
  );
};
export default Dropzone;