// src/components/UploadInfoItem/UploadInfoItem.jsx
import React from 'react';
import styles from './UploadInfoItem.module.css';

const UploadInfoItem = ({ icon, title, children }) => {
  return (
    <div className={styles.infoItem}>
      <img src={icon} alt={title} className={styles.icon} />
      <div className={styles.textContainer}>
        <h4>{title}</h4>
        <p>{children}</p>
      </div>
    </div>
  );
};

export default UploadInfoItem;