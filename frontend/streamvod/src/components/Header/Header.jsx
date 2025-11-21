
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css';
import { FiMenu, FiSearch, FiMic, FiUser, FiLogOut, FiHeart, FiClock } from 'react-icons/fi';
import Logo from '../../assets/icons/logo.svg';
import Sidebar from '../Sidebar/Sidebar';
import { useAuth } from '../../context/AuthContext';



const Header = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

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
      setIsSearchExpanded(false);
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

  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
  };

  const closeSearch = () => {
    setIsSearchExpanded(false);
    setSearchQuery('');
  };

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    navigate('/');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <>
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      
      {/* Search Overlay for Mobile */}
      {isSearchExpanded && (
        <div className={styles.searchOverlay} onClick={closeSearch} />
      )}
      
      <header className={styles.header}>
        {/* left */}
        <div className={`${styles.leftSection} ${isSearchExpanded ? styles.hidden : ''}`}>
          <button className={`${styles.iconButton} ${styles.menuButton}`} onClick={toggleSidebar}>
            <FiMenu size={24}/>
          </button>
          {/* Search Icon for Mobile - next to hamburger */}
          <button 
            className={styles.mobileSearchButton}
            onClick={toggleSearch}
          >
            <FiSearch size={24} />
          </button>
          <div className={styles.logoContainer} onClick={handleLogoClick}>
            <img src={Logo} alt="StreamVN Logo" className={styles.logoIcon} />
            <span className={styles.logoText}>StreamVN</span>
          </div>
        </div>

      {/* giữa */}
      <div className={`${styles.centerSection} ${isSearchExpanded ? styles.expanded : ''}`}>
        {/* Logo for mobile - shown in center */}
        {!isSearchExpanded && (
          <div className={styles.mobileLogo} onClick={handleLogoClick}>
            <img src={Logo} alt="StreamVN Logo" className={styles.logoIcon} />
            <span className={styles.logoText}>StreamVN</span>
          </div>
        )}
        
        {/* Search form - shown on desktop or when expanded on mobile */}
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
            autoFocus={isSearchExpanded}
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
      <div className={`${styles.rightSection} ${isSearchExpanded ? styles.hidden : ''}`}>
        {isAuthenticated ? (
          <div className={styles.userMenuContainer}>
            <button 
              className={styles.userButton}
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <FiUser size={22} />
              <span>{user?.username || 'User'}</span>
            </button>
            
            {showUserMenu && (
              <>
                <div className={styles.menuOverlay} onClick={() => setShowUserMenu(false)} />
                <div className={styles.userMenu}>
                  <button 
                    className={styles.menuItem}
                    onClick={() => {
                      navigate('/liked-videos');
                      setShowUserMenu(false);
                    }}
                  >
                    <FiHeart size={18} />
                    <span>Liked Videos</span>
                  </button>
                  <button 
                    className={styles.menuItem}
                    onClick={() => {
                      navigate('/watch-later');
                      setShowUserMenu(false);
                    }}
                  >
                    <FiClock size={18} />
                    <span>Watch Later</span>
                  </button>
                  <div className={styles.menuDivider} />
                  <button 
                    className={styles.menuItem}
                    onClick={handleLogout}
                  >
                    <FiLogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button className={styles.loginButton} onClick={handleLogin}>
            <FiUser size={22} />
            <span>Đăng nhập</span>
          </button>
        )}
      </div>
    </header>
    </>
  );
};

export default Header;