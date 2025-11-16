import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Sidebar.module.css';
import { FiMenu, FiUpload, FiHome, FiClock, FiThumbsUp, FiFolder } from 'react-icons/fi';
import Logo from '../../assets/icons/logo.svg';

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate('/');
    onClose();
  };

  const handleUploadClick = () => {
    navigate('/upload');
    onClose();
  };

  const handleHomeClick = () => {
    navigate('/');
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && <div className={styles.overlay} onClick={onClose} />}
      
      {/* Sidebar */}
      <div className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        {/* Top Section - Logo giống Header */}
        <div className={styles.topSection}>
          <button className={`${styles.iconButton} ${styles.menuButton}`} onClick={onClose}>
            <FiMenu size={24} />
          </button>
          <div className={styles.logoContainer} onClick={handleLogoClick}>
            <img src={Logo} alt="StreamVN Logo" className={styles.logoIcon} />
            <span className={styles.logoText}>StreamVN</span>
          </div>
        </div>

        {/* Divider */}
        <div className={styles.divider} />

        {/* Navigation Items */}
        <nav className={styles.navContainer}>
          {/* Upload Video Button - First Item */}
          <button className={`${styles.navItem} ${styles.uploadButton}`} onClick={handleUploadClick}>
            <FiUpload size={24} />
            <span>Tải video lên</span>
          </button>

          <button className={styles.navItem} onClick={handleHomeClick}>
            <FiHome size={24} />
            <span>Trang chủ</span>
          </button>

          <button className={styles.navItem}>
            <FiClock size={24} />
            <span>Xem sau</span>
          </button>

          <button className={styles.navItem}>
            <FiThumbsUp size={24} />
            <span>Video đã thích</span>
          </button>

          <button className={styles.navItem}>
            <FiFolder size={24} />
            <span>Bộ sưu tập</span>
          </button>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
