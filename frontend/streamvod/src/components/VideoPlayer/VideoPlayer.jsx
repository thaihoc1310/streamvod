import React, { useState, useRef, useEffect } from 'react';
import styles from './VideoPlayer.module.css';
import { 
  IoPlay, 
  IoPause, 
  IoReload, 
  IoArrowForward, 
  IoEllipsisVertical, 
  IoExpand 
} from 'react-icons/io5';


const VIDEO_SRC = "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

const VideoPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('00:00');
  const [duration, setDuration] = useState('00:00');
  const [isControlsVisible, setIsControlsVisible] = useState(false);
  const videoRef = useRef(null);
  const progressRef = useRef(null);
  const playerWrapperRef = useRef(null);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // 
  const handleTimeUpdate = () => {
    const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setProgress(progress);
    setCurrentTime(formatTime(videoRef.current.currentTime));
  };
  
  const handleLoadedMetadata = () => {
    setDuration(formatTime(videoRef.current.duration));
  };
  
  //tới/lùi
  const handleSeek = (amount) => {
    videoRef.current.currentTime += amount;
  };

  //tua trên thanh progress
  const handleProgressClick = (e) => {
    const rect = progressRef.current.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const width = rect.width;
    const duration = videoRef.current.duration;
    videoRef.current.currentTime = (clickPosition / width) * duration;
  };
  
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      playerWrapperRef.current.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div 
      ref={playerWrapperRef}
      className={styles.playerWrapper}
      onMouseEnter={() => setIsControlsVisible(true)}
      onMouseLeave={() => setIsControlsVisible(false)}
    >
      <video
        ref={videoRef}
        className={styles.videoElement}
        src={VIDEO_SRC}
        onClick={togglePlayPause}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      />

      <div className={`${styles.controlsOverlay} ${isControlsVisible || !isPlaying ? styles.visible : ''}`}>
        <div className={styles.topControls}>
          <button className={styles.iconButton}>
            <IoEllipsisVertical size={24} />
          </button>
        </div>

        <div className={styles.centerControls}>
          <button className={styles.iconButton} onClick={() => handleSeek(-10)}>
            <IoReload size={35} style={{ transform: 'scaleX(-1)' }} />
            <span className={styles.seekAmount}>10</span>
          </button>
          <button className={`${styles.iconButton} ${styles.playPauseButton}`} onClick={togglePlayPause}>
            {isPlaying ? <IoPause size={40} /> : <IoPlay size={40} />}
          </button>
          <button className={styles.iconButton} onClick={() => handleSeek(10)}>
            <IoReload size={35} /> 
            <span className={styles.seekAmount}>10</span>
          </button>
        </div>

      
        <div className={styles.bottomControls}>
          <div 
            className={styles.progressBarContainer} 
            ref={progressRef}
            onClick={handleProgressClick}
          >
            <div className={styles.progressBar} style={{ width: `${progress}%` }} />
          </div>
          <div className={styles.controlsRow}>
            <span className={styles.timeDisplay}>{currentTime} / {duration}</span>
            <button className={styles.iconButton} onClick={toggleFullScreen}>
              <IoExpand size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;