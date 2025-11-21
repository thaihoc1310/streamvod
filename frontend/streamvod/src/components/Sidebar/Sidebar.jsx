import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Sidebar.module.css';
import { FiMenu, FiUpload, FiHome, FiClock, FiThumbsUp, FiVideo } from 'react-icons/fi';
import Logo from '../../assets/icons/logo.svg';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

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

  const handleWatchLaterClick = () => {
    if (isAuthenticated) {
      navigate('/watch-later');
    } else {
      navigate('/login');
    }
    onClose();
  };

  const handleLikedVideosClick = () => {
    if (isAuthenticated) {
      navigate('/liked-videos');
    } else {
      navigate('/login');
    }
    onClose();
  };

  const handleMyVideosClick = () => {
    if (isAuthenticated) {
      navigate('/my-videos');
    } else {
      navigate('/login');
    }
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

          {isAuthenticated && (
            <button className={styles.navItem} onClick={handleMyVideosClick}>
              <FiVideo size={24} />
              <span>Video của tôi</span>
            </button>
          )}

          <button className={styles.navItem} onClick={handleWatchLaterClick}>
            <FiClock size={24} />
            <span>Xem sau</span>
          </button>

          <button className={styles.navItem} onClick={handleLikedVideosClick}>
            <FiThumbsUp size={24} />
            <span>Video đã thích</span>
          </button>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
