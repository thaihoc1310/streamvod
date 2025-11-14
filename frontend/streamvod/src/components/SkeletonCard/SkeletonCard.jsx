// src/components/SkeletonCard/SkeletonCard.jsx

import React from 'react';
import styles from './SkeletonCard.module.css';

const SkeletonCard = () => {
  return (
    <div className={styles.card}>
      <div className={styles.thumbnail}></div>
      <div className={styles.info}>
        <div className={styles.line} style={{ width: '90%' }}></div>
        <div className={styles.line} style={{ width: '60%' }}></div>
      </div>
    </div>
  );
};

export default SkeletonCard;