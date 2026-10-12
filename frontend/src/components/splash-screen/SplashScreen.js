import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

// Playback speed multiplier (e.g. 2.0x = 5s, 2.5x = 4s for a 10s video)
const PLAYBACK_SPEED = 2.5;

SplashScreen.propTypes = {
  onFinish: PropTypes.func.isRequired,
};

export default function SplashScreen({ onFinish }) {
  const [videoSrc] = useState(() => {
    const isPWA =
      (typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(display-mode: standalone)').matches) ||
      (typeof window !== 'undefined' && window.navigator && window.navigator.standalone === true);
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

    return isPWA || isMobile
      ? '/assets/Splash/Mobile-splash.mp4'
      : '/assets/Splash/Website-splash.mp4';
  });

  const [showUnmutePrompt, setShowUnmutePrompt] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const videoRef = useRef(null);

  const handleClose = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onFinish();
    }, 450);
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;

    // Apply speed-up
    video.playbackRate = PLAYBACK_SPEED;

    // Try unmuted playback first
    video.muted = false;
    video
      .play()
      .then(() => {
        setShowUnmutePrompt(false);
      })
      .catch((error) => {
        // If unmuted playback is blocked by browser policy, keep muted & show button
        console.warn('Autoplay audio policy blocked sound. Playing muted with unmute option.', error);
        video.muted = true;
        video.play().catch(() => {});
        setShowUnmutePrompt(true);
      });
  };

  const handleUnmute = (e) => {
    if (e) e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = false;
      setShowUnmutePrompt(false);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = PLAYBACK_SPEED;
      // In case loadedmetadata already fired or hasn't started yet
      video.play().catch(() => {});
    }

    // Safety timeout (e.g. 6 seconds) in case of slow network or decode error
    const fallbackTimer = setTimeout(() => {
      handleClose();
    }, 6000);

    return () => clearTimeout(fallbackTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      onClick={showUnmutePrompt ? handleUnmute : undefined}
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        // backgroundColor: '#8810A6', // Commented out to prevent purple flash before video
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isFadingOut ? 0 : 1,
        transition: 'opacity 0.45s ease-out',
        pointerEvents: isFadingOut ? 'none' : 'auto',
        overflow: 'hidden',
        cursor: showUnmutePrompt ? 'pointer' : 'default',
      }}
    >
      <video
        ref={videoRef}
        src={videoSrc}
        autoPlay
        muted
        playsInline
        preload="auto"
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleClose}
        onError={(e) => {
          console.error('Splash video error:', e);
          handleClose();
        }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />

      {/* Tap to Unmute Button (appears if browser policy blocked audio autoplay) */}
      {showUnmutePrompt && (
        <button
          type="button"
          onClick={handleUnmute}
          style={{
            position: 'absolute',
            bottom: 36,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 22px',
            background: 'rgba(0, 0, 0, 0.65)',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.35)',
            borderRadius: 30,
            backdropFilter: 'blur(8px)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
            userSelect: 'none',
          }}
        >
          🔊 Tap for Sound
        </button>
      )}


    </div>
  );
}
