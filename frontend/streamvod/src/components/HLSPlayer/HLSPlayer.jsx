// src/components/HLSPlayer/HLSPlayer.jsx
import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import styles from './HLSPlayer.module.css';

const HLSPlayer = ({ src, poster, onReady, autoplay = false }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);

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

  return (
    <div data-vjs-player className={styles.playerContainer}>
      <div ref={videoRef} className={styles.videoElement} />
    </div>
  );
};

export default HLSPlayer;
