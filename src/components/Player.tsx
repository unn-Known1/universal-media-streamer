import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Loader2, AlertCircle, Volume2, VolumeX, Tv, ChevronLeft, ChevronRight, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Hls from 'hls.js';
import dash from 'dashjs';
import { usePlayer } from '../contexts/PlayerContext';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { ControlBar } from './ControlBar';
import { IPTVChannelNavigator } from './IPTVChannelList';
import { detectMediaType, extractYoutubeId, extractVimeoId, getEmbedUrl } from '../utils/mediaDetector';
import { CONTROL_BAR_HIDE_DELAY } from '../utils/constants';
import { IPTVChannel } from '../types';

interface PlayerProps {
  onShowShortcuts: () => void;
}

export function Player({ onShowShortcuts }: PlayerProps) {
  const {
    playerState,
    videoRef,
    togglePlay,
    seek,
    seekRelative,
    setVolume,
    toggleMute,
    setPlaybackRate,
    toggleFullscreen,
    togglePiP,
    showToast,
    playNextChannel,
    playPreviousChannel,
    currentPlaylist,
  } = usePlayer();

  const containerRef = useRef<HTMLDivElement>(null);
  const hlsInstanceRef = useRef<Hls | null>(null);
  const dashPlayerRef = useRef<any>(null);
  const youtubePlayerRef = useRef<any>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBigPlay, setShowBigPlay] = useState(true);
  const [volumeLevel, setVolumeLevel] = useState(1);
  const [showChannelList, setShowChannelList] = useState(false);

  const { currentMedia, url: _url } = { 
    currentMedia: playerState.currentMedia, 
    url: playerState.currentMedia?.url || '' 
  };

  // Check if current media is IPTV
  const isIPTV = playerState.isIPTV && (playerState.currentMedia as IPTVChannel)?.type === 'iptv';
  const currentIPTVChannel = isIPTV ? currentMedia as IPTVChannel : null;

  // Keyboard shortcuts
  useKeyboardShortcuts({
    playPause: togglePlay,
    fullscreen: toggleFullscreen,
    mute: toggleMute,
    pip: togglePiP,
    seekBack: () => seekRelative(-5),
    seekForward: () => seekRelative(5),
    seekBack10: () => seekRelative(-10),
    seekForward10: () => seekRelative(10),
    volumeUp: () => setVolume(Math.min(volumeLevel + 0.1, 2)),
    volumeDown: () => setVolume(Math.max(volumeLevel - 0.1, 0)),
    showShortcuts: onShowShortcuts,
  });

  // Update video ref when element is available
  const setVideoRef = useCallback((element: HTMLVideoElement | null) => {
    (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = element;
  }, [videoRef]);

  // Auto-hide controls
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (playerState.isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, CONTROL_BAR_HIDE_DELAY);
    }
  }, [playerState.isPlaying]);

  useEffect(() => {
    showControlsTemporarily();
  }, [playerState.isPlaying, showControlsTemporarily]);

  // Handle mouse movement
  const handleMouseMove = useCallback(() => {
    showControlsTemporarily();
  }, [showControlsTemporarily]);

  // Initialize player based on media type
  useEffect(() => {
    if (!currentMedia || !videoRef.current) return;

    const video = videoRef.current;
    const mediaType = detectMediaType(currentMedia.url);

    // Cleanup previous instances
    if (hlsInstanceRef.current) {
      hlsInstanceRef.current.destroy();
      hlsInstanceRef.current = null;
    }
    if (dashPlayerRef.current) {
      dashPlayerRef.current.destroy();
      dashPlayerRef.current = null;
    }
    if (youtubePlayerRef.current) {
      youtubePlayerRef.current = null;
    }

    setError(null);
    setIsLoading(true);

    const initVideo = () => {
      video.src = currentMedia.url;
      video.load();
    };

    switch (mediaType) {
      case 'hls':
      case 'iptv': // IPTV streams are usually HLS
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
          });
          hls.loadSource(currentMedia.url);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setIsLoading(false);
            video.play().catch(() => {});
          });
          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
              setError('Failed to load stream');
              setIsLoading(false);
            }
          });
          hlsInstanceRef.current = hls;
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Native HLS support (Safari)
          initVideo();
        } else {
          setError('HLS is not supported in this browser');
        }
        break;

      case 'dash':
        const dashPlayer = dash.MediaPlayer().create();
        dashPlayer.initialize(video, currentMedia.url, false);
        dashPlayer.on(dash.Events.MANIFEST_LOADED, () => {
          setIsLoading(false);
        });
        dashPlayer.on(dash.Events.ERROR, (e: any) => {
          setError('Failed to load DASH stream');
          setIsLoading(false);
        });
        dashPlayerRef.current = dashPlayer;
        break;

      case 'youtube':
        // YouTube will be handled separately
        setIsLoading(false);
        break;

      case 'vimeo':
        // Vimeo will be handled separately
        setIsLoading(false);
        break;

      case 'mp4':
      case 'webm':
      default:
        initVideo();
        break;
    }

    return () => {
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
      }
      if (dashPlayerRef.current) {
        dashPlayerRef.current.destroy();
      }
    };
  }, [currentMedia, videoRef]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      // Handle A-B repeat for IPTV
      if (playerState.abRepeat.start !== null && playerState.abRepeat.end !== null) {
        if (video.currentTime >= playerState.abRepeat.end) {
          video.currentTime = playerState.abRepeat.start;
        }
      }
    };

    const handleLoadedMetadata = () => {
      setIsLoading(false);
      setShowBigPlay(false);
    };

    const handleEnded = () => {
      if (!playerState.isLooping) {
        // For IPTV, try to play next channel
        if (isIPTV) {
          playNextChannel();
        }
      }
    };

    const handleError = () => {
      setError('Failed to load media');
      setIsLoading(false);
    };

    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [videoRef, playerState.isLooping, playerState.abRepeat, isIPTV, playNextChannel]);

  // Sync video state with context
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (playerState.isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [playerState.isPlaying, videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = Math.min(playerState.volume, 1);
    setVolumeLevel(playerState.volume);
  }, [playerState.volume, videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Math.abs(video.currentTime - playerState.currentTime) > 1) {
      video.currentTime = playerState.currentTime;
    }
  }, [playerState.currentTime, videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = playerState.playbackRate;
  }, [playerState.playbackRate, videoRef]);

  // Render YouTube/Vimeo iframe if needed
  if (currentMedia && (detectMediaType(currentMedia.url) === 'youtube' || detectMediaType(currentMedia.url) === 'vimeo')) {
    const embedUrl = getEmbedUrl(currentMedia.url);
    return (
      <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden">
        <iframe
          src={embedUrl}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={currentMedia.title}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden group cursor-pointer"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => playerState.isPlaying && setShowControls(false)}
      onClick={(e) => {
        // Don't toggle play if clicking on controls
        if ((e.target as HTMLElement).closest('.control-bar')) return;
        togglePlay();
        showControlsTemporarily();
      }}
    >
      {/* Video Element */}
      <video
        ref={setVideoRef}
        className="w-full h-full object-contain"
        playsInline
        onClick={(e) => e.stopPropagation()}
      />

      {/* YouTube/Vimeo placeholder when no media */}
      {!currentMedia && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-dark-800 to-dark-900">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500/20 to-primary-700/20 flex items-center justify-center mb-6">
            <Play className="w-12 h-12 text-primary-400" />
          </div>
          <p className="text-lg text-slate-400">Paste a URL to start playing</p>
          <p className="text-sm text-slate-500 mt-2">or load an IPTV M3U/M3U8 playlist</p>
        </div>
      )}

      {/* Loading Spinner */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50"
          >
            <Loader2 className="w-12 h-12 text-primary-400 animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/80"
          >
            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
            <p className="text-lg text-red-400">{error}</p>
            <button
              onClick={() => {
                setError(null);
                if (currentMedia && videoRef.current) {
                  videoRef.current.load();
                }
              }}
              className="mt-4 px-4 py-2 bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
            >
              Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Big Play Button */}
      <AnimatePresence>
        {showBigPlay && currentMedia && !isLoading && !error && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-primary-500/90 hover:bg-primary-500 flex items-center justify-center transition-all hover:scale-110 shadow-lg shadow-primary-500/50"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
          >
            <Play className="w-10 h-10 text-white fill-white ml-1" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* IPTV Channel Navigator (shown when playing IPTV) */}
      {isIPTV && currentIPTVChannel && currentPlaylist && (
        <div className="absolute top-4 left-4 right-4 z-30">
          <IPTVChannelNavigator
            playlist={currentPlaylist}
            currentChannel={currentIPTVChannel}
            onPrevious={playPreviousChannel}
            onNext={playNextChannel}
            onOpenList={() => setShowChannelList(true)}
          />
        </div>
      )}

      {/* Channel List Toggle Button (IPTV) */}
      {isIPTV && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowChannelList(!showChannelList);
          }}
          className="absolute bottom-20 left-4 z-30 p-3 rounded-xl bg-violet-500/80 hover:bg-violet-500 transition-colors shadow-lg"
          title="Open Channel List"
        >
          <List className="w-5 h-5" />
        </button>
      )}

      {/* Control Bar */}
      <AnimatePresence>
        {showControls && currentMedia && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0"
          >
            <ControlBar
              videoElement={videoRef.current}
              onShowShortcuts={onShowShortcuts}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Volume Indicator */}
      <AnimatePresence>
        {playerState.isMuted && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute top-4 left-4 px-3 py-1.5 bg-dark-700/90 backdrop-blur rounded-lg flex items-center gap-2"
          >
            <VolumeX className="w-4 h-4" />
            <span className="text-sm">Muted</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quality Badge */}
      {playerState.quality !== 'auto' && (
        <div className="absolute top-4 right-4 px-2 py-1 bg-dark-700/90 backdrop-blur rounded text-xs font-medium">
          {playerState.quality}
        </div>
      )}

      {/* IPTV Badge */}
      {isIPTV && (
        <div className="absolute top-4 right-4 px-2 py-1 bg-violet-500/90 backdrop-blur rounded text-xs font-medium flex items-center gap-1">
          <Tv className="w-3 h-3" />
          IPTV
        </div>
      )}

      {/* A-B Repeat Indicator */}
      {playerState.abRepeat.start !== null && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary-500/90 backdrop-blur rounded-full text-xs font-medium">
          A-B Repeat {playerState.abRepeat.end ? 'Active' : 'A set...'}
        </div>
      )}
    </div>
  );
}