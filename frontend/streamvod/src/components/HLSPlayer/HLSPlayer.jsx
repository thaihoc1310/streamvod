// src/components/HLSPlayer/HLSPlayer.jsx
import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'videojs-contrib-quality-levels';
import 'video.js/dist/video-js.css';
import styles from './HLSPlayer.module.css';

const HLSPlayer = ({ src, poster, onReady, autoplay = false }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [qualities, setQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current && videoRef.current) {
      const videoElement = document.createElement('video-js');
      
      videoElement.classList.add('vjs-big-play-centered');
      videoRef.current.appendChild(videoElement);

      const player = (playerRef.current = videojs(videoElement, {
        controls: true,
        responsive: true,
        fluid: true,
        autoplay: autoplay,
        preload: 'auto',
        poster: poster,
        html5: {
          vhs: {
            overrideNative: true,
            bandwidth: 8000000, // 8Mbps - đủ bias lên HD
            enableLowInitialPlaylist: false, // Không bắt đầu từ quality thấp nhất
            smoothQualityChange: true,
            useBandwidthFromLocalStorage: false, // Tránh dính bandwidth cũ từ lần xem trước
            limitRenditionByPlayerDimensions: true, // Tự động cap theo kích thước player
            useDevicePixelRatio: true, // Tính cả pixel ratio (Retina displays)
          },
          nativeVideoTracks: false,
          nativeAudioTracks: false,
          nativeTextTracks: false,
        },
        controlBar: {
          volumePanel: {
            inline: false,
          },
        },
      }));

      // Set source
      if (src) {
        player.src({
          src: src,
          type: 'application/x-mpegURL', // HLS type
        });
      }

      // Callback when player is ready
      player.ready(() => {
        console.log('Player is ready');
        
        // Setup quality levels
        const qualityLevels = player.qualityLevels();
        
        qualityLevels.on('addqualitylevel', function(event) {
          console.log('Quality level added:', event.qualityLevel);
        });

        // Sau khi load xong playlist, chỉ setup UI - không force quality level
        player.one('loadedmetadata', () => {
          const levels = player.qualityLevels();
          
          // Tạo danh sách qualities để hiển thị UI
          const qualitiesArray = [];
          for (let i = 0; i < levels.length; i++) {
            const level = levels[i];
            qualitiesArray.push({
              index: i,
              height: level.height,
              width: level.width,
              bitrate: level.bitrate,
              label: `${level.height || '?'}p`
            });
          }
          
          // Sắp xếp từ cao xuống thấp để hiển thị
          qualitiesArray.sort((a, b) => (b.height || 0) - (a.height || 0));
          setQualities(qualitiesArray);
          
          
          console.log('Available quality levels:', qualitiesArray);
          console.log(`Player dimensions: ${player.currentWidth()}x${player.currentHeight()}`);
          
          // Disable 360p trên desktop ngay từ đầu
          const isDesktop = window.innerWidth >= 1024;
          if (isDesktop) {
            for (let i = 0; i < levels.length; i++) {
              const level = levels[i];
              if (level.height && level.height <= 360) {
                level.enabled = false;
                console.log(`Disabled ${level.height}p on desktop`);
              }
            }
          }
        });
        
        if (onReady) {
          onReady(player);
        }
      });

      // Handle errors
      player.on('error', () => {
        const error = player.error();
        console.error('Video.js error:', error);
      });
    } else if (playerRef.current) {
      // Update source if it changes
      const player = playerRef.current;
      if (src) {
        player.src({
          src: src,
          type: 'application/x-mpegURL',
        });
      }
      if (poster) {
        player.poster(poster);
      }
    }
  }, [src, poster, autoplay, onReady]);

  // Dispose the Video.js player when the component unmounts
  useEffect(() => {
    const player = playerRef.current;

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  // Handle quality change
  const handleQualityChange = (qualityIndex) => {
    const player = playerRef.current;
    if (!player) return;

    const levels = player.qualityLevels();
    
    if (qualityIndex === 'auto') {
      // Enable ABR (auto quality) nhưng thông minh:
      // - Desktop: chỉ cho 720p/1080p (disable 360p)
      // - Mobile: cho tất cả (kể cả 360p khi mạng yếu)
      const isDesktop = window.innerWidth >= 1024;

      for (let i = 0; i < levels.length; i++) {
        const level = levels[i];

        if (isDesktop) {
          // Desktop: disable các level <= 360p
          if (level.height && level.height <= 360) {
            level.enabled = false;
          } else {
            level.enabled = true;
          }
        } else {
          // Mobile: cho phép tất cả
          level.enabled = true;
        }
      }

      setCurrentQuality('auto');
      console.log(`Quality set to Auto (ABR). ${isDesktop ? 'Desktop: min 720p' : 'Mobile: all levels'}`);
    } else {
      // Set specific quality (manual)
      for (let i = 0; i < levels.length; i++) {
        levels[i].enabled = (i === qualityIndex);
      }
      const selectedQuality = qualities.find(q => q.index === qualityIndex);
      setCurrentQuality(selectedQuality?.label || 'auto');
      console.log(`Quality set to ${selectedQuality?.label}`);
    }
    
    setShowQualityMenu(false);
  };

  return (
    <div data-vjs-player className={styles.playerContainer}>
      <div ref={videoRef} className={styles.videoElement} />
      
      {/* Quality Selector */}
      {qualities.length > 0 && (
        <div className={styles.qualitySelector}>
          <button 
            className={styles.qualityButton}
            onClick={() => setShowQualityMenu(!showQualityMenu)}
            title="Chất lượng video"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className={styles.currentQuality}>{currentQuality}</span>
          </button>
          
          {showQualityMenu && (
            <div className={styles.qualityMenu}>
              <div className={styles.qualityMenuHeader}>Chất lượng</div>
              <button
                className={`${styles.qualityOption} ${currentQuality === 'auto' ? styles.active : ''}`}
                onClick={() => handleQualityChange('auto')}
              >
                <span>Auto</span>
                {currentQuality === 'auto' && <span className={styles.checkmark}>✓</span>}
              </button>
              {qualities.map(quality => (
                <button
                  key={quality.index}
                  className={`${styles.qualityOption} ${currentQuality === quality.label ? styles.active : ''}`}
                  onClick={() => handleQualityChange(quality.index)}
                >
                  <span>{quality.label}</span>
                  {currentQuality === quality.label && <span className={styles.checkmark}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HLSPlayer;
