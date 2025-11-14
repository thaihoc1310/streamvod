
import React from 'react';
import styles from './Header.module.css';
import { FiMenu, FiSearch, FiMic, FiUser } from 'react-icons/fi';
import Logo from '../../assets/icons/logo.svg';



const Header = () => {
  return (
    <header className={styles.header}>
      {/* left */}
      <div className={styles.leftSection}>
        <button className={`${styles.iconButton} ${styles.menuButton}`}>
          <FiMenu size={24}/>     {/* */}
        </button>
        <div className={styles.logoContainer}>
          { <img src={Logo} alt="StreamVN Logo" className={styles.logoIcon} />}
          <span className={styles.logoText}>StreamVN</span>
        </div>
      </div>

      {/* giữa */}
      <div className={styles.centerSection}>
        <div className={styles.searchContainer}>
          <FiSearch className={styles.searchIcon} size={20} />
          <input 
            type="text" 
            placeholder="Tìm kiếm" 
            className={styles.searchInput}
          />
          <button className={`${styles.iconButton} ${styles.micButton}`}>
            <FiMic size={20} />
          </button>
        </div>
      </div>

      {/* phải */}
      <div className={styles.rightSection}>
        <button className={styles.loginButton}>
          <FiUser size={22} />
          <span>Đăng nhập</span>
        </button>
      </div>
    </header>
  );
};

export default Header;