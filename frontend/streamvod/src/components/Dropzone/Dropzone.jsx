// src/components/Dropzone/Dropzone.jsx
import React, { useRef, useState } from 'react';
import styles from './Dropzone.module.css';
import uploadIcon from '../../assets/images/uploadimg.png'; 

const Dropzone = ({ onSelectFile, isUploading })  => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelectFile(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onSelectFile(file);
    }
  };

  return (
    <div 
      className={`${styles.dropzone} ${isDragging ? styles.dragging : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,.mp4"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={isUploading}
      />
      
      <img src={uploadIcon} alt="Upload" className={styles.uploadIcon} />
      <h2>{isUploading ? 'Đang tải lên...' : 'Chọn video để tải lên'}</h2>
      <p>{isUploading ? 'Vui lòng đợi' : 'Hoặc kéo và thả video vào đây'}</p>
      <button 
        className={styles.uploadButton}
        onClick={handleClick}
        disabled={isUploading}
      >
        {isUploading ? 'Đang xử lý...' : 'Chọn video'}
      </button>
    </div>
  );
};

export default Dropzone;