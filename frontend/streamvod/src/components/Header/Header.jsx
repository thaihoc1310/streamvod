
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css';
import { FiMenu, FiSearch, FiMic, FiUser } from 'react-icons/fi';
import Logo from '../../assets/icons/logo.svg';
import Sidebar from '../Sidebar/Sidebar';



const Header = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogoClick = () => {
    navigate('/');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit(e);
    }
  };

  return (
    <>
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      
      <header className={styles.header}>
        {/* left */}
        <div className={styles.leftSection}>
          <button className={`${styles.iconButton} ${styles.menuButton}`} onClick={toggleSidebar}>
            <FiMenu size={24}/>
          </button>
          <div className={styles.logoContainer} onClick={handleLogoClick}>
            <img src={Logo} alt="StreamVN Logo" className={styles.logoIcon} />
            <span className={styles.logoText}>StreamVN</span>
          </div>
        </div>

      {/* giữa */}
      <div className={styles.centerSection}>
        <form className={styles.searchContainer} onSubmit={handleSearchSubmit}>
          <button 
            type="submit" 
            className={styles.searchButton}
            aria-label="Tìm kiếm"
          >
            <FiSearch className={styles.searchIcon} size={20} />
          </button>
          <input 
            type="text" 
            placeholder="Tìm kiếm" 
            className={styles.searchInput}
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyPress={handleSearchKeyPress}
          />
          <button 
            type="button"
            className={`${styles.iconButton} ${styles.micButton}`}
            aria-label="Voice search"
          >
            <FiMic size={20} />
          </button>
        </form>
      </div>

      {/* phải */}
      <div className={styles.rightSection}>
        <button className={styles.loginButton}>
          <FiUser size={22} />
          <span>Đăng nhập</span>
        </button>
      </div>
    </header>
    </>
  );
};

export default Header;