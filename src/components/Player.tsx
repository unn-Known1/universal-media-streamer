import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Loader2, AlertCircle, Volume2, VolumeX, Tv, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Hls, { Level as HlsLevel } from 'hls.js';
import dashjs from 'dashjs';
import { usePlayer } from '../contexts/PlayerContext';
import { useSettings } from '../contexts/SettingsContext';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { ControlBar } from './ControlBar';
import { IPTVChannelNavigator, IPTVChannelList } from './IPTVChannelList';
import { detectMediaType, getEmbedUrl } from '../utils/mediaDetector';
import { CONTROL_BAR_HIDE_DELAY } from '../utils/constants';
import { IPTVChannel, SubtitleTrack, MediaItem } from '../types';

interface PlayerProps {
  onShowShortcuts: () => void;
}

const EMBED_TYPES = ['youtube', 'vimeo', 'twitch'];

type DashPlayer = dashjs.MediaPlayerClass;

function hlsLevelLabel(level: HlsLevel): string {
  if (level.height) return `${level.height}p`;
  if (level.bitrate) return `${Math.round(level.bitrate / 1000)}k`;
  return `Level ${level.id}`;
}

function getMediaTitle(media: MediaItem | IPTVChannel): string {
  return 'title' in media ? media.title : media.name;
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
    toggleTheaterMode,
    togglePiP,
    setQuality,
    setSubtitle,
    syncStateFromVideo,
    updatePlayerState,
    playNext,
    showToast,
    playNextChannel,
    playPreviousChannel,
    loadIPTVChannel,
    currentPlaylist,
    playlist,
  } = usePlayer();

  const { settings } = useSettings();

  const containerRef = useRef<HTMLDivElement>(null);
  const hlsInstanceRef = useRef<Hls | null>(null);
  const dashPlayerRef = useRef<DashPlayer | null>(null);
  const embedFrameRef = useRef<HTMLIFrameElement | null>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showChannelList, setShowChannelList] = useState(false);

  const currentMedia = playerState.currentMedia;
  const mediaType = currentMedia ? detectMediaType(currentMedia.url) : null;
  const isEmbed = mediaType !== null && EMBED_TYPES.includes(mediaType);

  const playIPTVChannelFromList = useCallback((channel: IPTVChannel, index: number) => {
    if (!currentPlaylist) return;
    loadIPTVChannel(channel, currentPlaylist, index);
  }, [currentPlaylist, loadIPTVChannel]);

  // Check if current media is IPTV
  const isIPTV = playerState.isIPTV && (playerState.currentMedia as IPTVChannel)?.type === 'iptv';
  const currentIPTVChannel = isIPTV ? (currentMedia as IPTVChannel) : null;

  // Keyboard shortcuts
  useKeyboardShortcuts({
    playPause: togglePlay,
    fullscreen: toggleFullscreen,
    theater: toggleTheaterMode,
    mute: toggleMute,
    pip: togglePiP,
    captions: () => {
      if (playerState.subtitles.length === 0) {
        showToast('No subtitles available', 'info');
        return;
      }
      if (playerState.activeSubtitle) {
        setSubtitle(null);
      } else {
        setSubtitle(playerState.subtitles[0].id);
      }
    },
    seekBack: () => seekRelative(-5),
    seekForward: () => seekRelative(5),
    seekBack10: () => seekRelative(-10),
    seekForward10: () => seekRelative(10),
    volumeUp: () => setVolume(Math.min((videoRef.current?.volume ?? playerState.volume) + 0.1, 2)),
    volumeDown: () => setVolume(Math.max((videoRef.current?.volume ?? playerState.volume) - 0.1, 0)),
    seek0: () => seek(0),
    seek10: () => seek(playerState.duration * 0.1),
    seek20: () => seek(playerState.duration * 0.2),
    seek30: () => seek(playerState.duration * 0.3),
    seek40: () => seek(playerState.duration * 0.4),
    seek50: () => seek(playerState.duration * 0.5),
    seek60: () => seek(playerState.duration * 0.6),
    seek70: () => seek(playerState.duration * 0.7),
    seek80: () => seek(playerState.duration * 0.8),
    seek90: () => seek(playerState.duration * 0.9),
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

  // Reset transient state whenever a new media item is loaded
  useEffect(() => {
    setError(null);
    setIsLoading(true);
    setShowChannelList(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMedia?.url]);

  // Apply persisted playback defaults when a new media item is loaded
  useEffect(() => {
    if (!currentMedia) return;
    const video = videoRef.current;
    if (!video) return;
    if (settings.defaultVolume !== undefined) {
      video.volume = Math.min(settings.defaultVolume, 1);
      updatePlayerState({ volume: settings.defaultVolume, isMuted: settings.defaultVolume === 0 });
    }
    if (settings.defaultPlaybackSpeed !== undefined) {
      video.playbackRate = settings.defaultPlaybackSpeed;
      updatePlayerState({ playbackRate: settings.defaultPlaybackSpeed });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMedia?.url]);

  // Initialize player based on media type (video-backed sources only)
  useEffect(() => {
    // For embeds the iframe render path is used instead
    if (!currentMedia || isEmbed || !videoRef.current) {
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
      if (dashPlayerRef.current) {
        dashPlayerRef.current.reset();
        dashPlayerRef.current = null;
      }
      setIsLoading(false);
      return;
    }

    const video = videoRef.current;

    // Cleanup previous instances
    if (hlsInstanceRef.current) {
      hlsInstanceRef.current.destroy();
      hlsInstanceRef.current = null;
    }
    if (dashPlayerRef.current) {
      dashPlayerRef.current.reset();
      dashPlayerRef.current = null;
    }

    setIsLoading(true);

    const initVideo = () => {
      video.src = getEmbedUrl(currentMedia.url);
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
          hls.loadSource(getEmbedUrl(currentMedia.url));
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setIsLoading(false);
            if (hls.levels.length > 0) {
              const qualities = ['auto', ...hls.levels.map(hlsLevelLabel).filter((label, i, arr) => arr.indexOf(label) === i)];
              updatePlayerState({ availableQualities: qualities, quality: 'auto' });
            }
            video.play().catch(() => {});
          });
          hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, () => {
            syncSubtitlesFromTracks();
          });
          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
              if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                hls.startLoad();
              } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                hls.recoverMediaError();
              } else {
                setError('Failed to load stream');
                setIsLoading(false);
              }
            }
          });
          hlsInstanceRef.current = hls;
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Native HLS support (Safari)
          initVideo();
        } else {
          setError('HLS is not supported in this browser');
          setIsLoading(false);
        }
        break;

      case 'dash': {
        const dashPlayer = dashjs.MediaPlayer().create();
        dashPlayer.initialize(video, getEmbedUrl(currentMedia.url), false);
        dashPlayer.on(dashjs.MediaPlayer.events.MANIFEST_LOADED, () => {
          setIsLoading(false);
          try {
            const infos = dashPlayer.getBitrateInfoListFor('video');
            if (infos && infos.length > 0) {
              const qualities = ['auto', ...infos.map((info) =>
                info.height ? `${info.height}p` : `${Math.round(info.bitrate / 1000)}k`
              ).filter((label, i, arr) => arr.indexOf(label) === i)];
              updatePlayerState({ availableQualities: qualities, quality: 'auto' });
            }
          } catch {
            // Quality list unavailable for this stream
          }
        });
        dashPlayer.on(dashjs.MediaPlayer.events.ERROR, () => {
          setError('Failed to load DASH stream');
          setIsLoading(false);
        });
        dashPlayerRef.current = dashPlayer;
        break;
      }

      case 'google-drive':
      case 'dropbox':
      case 'mp4':
      case 'webm':
      default:
        initVideo();
        break;
    }

    return () => {
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
      if (dashPlayerRef.current) {
        dashPlayerRef.current.reset();
        dashPlayerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMedia, isEmbed, videoRef]);

  // Build subtitle track list from the video element's text tracks
  const syncSubtitlesFromTracks = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const tracks: SubtitleTrack[] = [];
    for (let i = 0; i < video.textTracks.length; i++) {
      const track = video.textTracks[i];
      if (!track || track.kind !== 'subtitles' && track.kind !== 'captions') continue;
      if (track.label || track.language) {
        tracks.push({
          id: `${i}-${track.label || track.language}`,
          label: track.label || track.language,
          language: track.language || 'unknown',
        });
      }
    }
    updatePlayerState({ subtitles: tracks });
  }, [videoRef, updatePlayerState]);

  // Watch text track additions (native + HLS.js captions)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isEmbed) return;
    syncSubtitlesFromTracks();
    const handleAddTrack = () => syncSubtitlesFromTracks();
    video.textTracks.addEventListener('addtrack', handleAddTrack);
    return () => video.textTracks.removeEventListener('addtrack', handleAddTrack);
  }, [currentMedia, isEmbed, videoRef, syncSubtitlesFromTracks]);

  // Apply the active subtitle selection to the underlying text tracks
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isEmbed) return;
    for (let i = 0; i < video.textTracks.length; i++) {
      const track = video.textTracks[i];
      if (!track) continue;
      const id = `${i}-${track.label || track.language}`;
      track.mode = playerState.activeSubtitle === id ? 'showing' : 'disabled';
    }
  }, [playerState.activeSubtitle, isEmbed, videoRef]);

  // Apply selected quality to HLS/DASH players
  useEffect(() => {
    if (playerState.quality === 'auto') {
      const hls = hlsInstanceRef.current;
      if (hls) {
        hls.currentLevel = -1;
        hls.loadLevel = -1;
      }
      const dashPlayer = dashPlayerRef.current;
      if (dashPlayer) {
        try { dashPlayer.setQualityFor('video', -1, true); } catch { /* ignore */ }
        try { dashPlayer.setQualityFor('audio', -1, true); } catch { /* ignore */ }
      }
      return;
    }

    const hls = hlsInstanceRef.current;
    if (hls) {
      const idx = hls.levels.findIndex((l) => hlsLevelLabel(l) === playerState.quality);
      if (idx >= 0) {
        hls.currentLevel = idx;
        hls.loadLevel = idx;
      }
    }

    const dashPlayer = dashPlayerRef.current;
    if (dashPlayer) {
      try {
        const infos = dashPlayer.getBitrateInfoListFor('video');
        const idx = infos.findIndex((i) =>
          (i.height ? `${i.height}p` : `${Math.round(i.bitrate / 1000)}k`) === playerState.quality
        );
        if (idx >= 0) dashPlayer.setQualityFor('video', idx, true);
      } catch { /* ignore */ }
    }
  }, [playerState.quality]);

  // Video event handlers -> context state sync
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isEmbed) return;

    const handleTimeUpdate = () => {
      // Handle A-B repeat
      const ab = playerState.abRepeat;
      if (ab.start !== null && ab.end !== null && video.currentTime >= ab.end) {
        video.currentTime = ab.start;
      }
      syncStateFromVideo();
    };

    const handleEnded = () => {
      syncStateFromVideo();
      if (playerState.isLooping) return;
      if (isIPTV) {
        playNextChannel();
      } else if (settings.autoPlayNext && playlist.length > 0) {
        playNext();
      }
    };

    const handleError = () => {
      setError('Failed to load media');
      setIsLoading(false);
    };

    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => {
      setIsLoading(false);
      syncStateFromVideo();
    };
    const handlePlaying = () => {
      setIsLoading(false);
      syncStateFromVideo();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', syncStateFromVideo);
    video.addEventListener('progress', syncStateFromVideo);
    video.addEventListener('play', syncStateFromVideo);
    video.addEventListener('pause', syncStateFromVideo);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('playing', handlePlaying);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', syncStateFromVideo);
      video.removeEventListener('progress', syncStateFromVideo);
      video.removeEventListener('play', syncStateFromVideo);
      video.removeEventListener('pause', syncStateFromVideo);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('playing', handlePlaying);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoRef, playerState.abRepeat, playerState.isLooping, isIPTV, isEmbed, settings.autoPlayNext]);

  // Sync video state with context (volume / rate / time pushes)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isEmbed) return;

    if (playerState.isPlaying && video.paused) {
      video.play().catch(() => {});
    } else if (!playerState.isPlaying && !video.paused) {
      video.pause();
    }
  }, [playerState.isPlaying, videoRef, isEmbed]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || isEmbed) return;
    video.volume = Math.min(playerState.volume, 1);
    video.muted = playerState.isMuted;
  }, [playerState.volume, playerState.isMuted, videoRef, isEmbed]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || isEmbed) return;
    if (Math.abs(video.currentTime - playerState.currentTime) > 1) {
      video.currentTime = playerState.currentTime;
    }
  }, [playerState.currentTime, videoRef, isEmbed]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || isEmbed) return;
    video.playbackRate = playerState.playbackRate;
  }, [playerState.playbackRate, videoRef, isEmbed]);

  // --- Embedded players (YouTube / Vimeo / Twitch) ---
  // YouTube: bidirectional sync via the IFrame API postMessage protocol.
  useEffect(() => {
    if (!isEmbed || !currentMedia) return;
    if (mediaType !== 'youtube') {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const handleMessage = (e: MessageEvent) => {
      if (e.origin !== 'https://www.youtube.com') return;
      let data: any;
      try {
        data = JSON.parse(e.data);
      } catch {
        return;
      }
      if (!data || data.event !== 'infoDelivery' || !data.info) return;

      const info = data.info;
      const patch: any = {};
      if (typeof info.currentTime === 'number' && !Number.isNaN(info.currentTime)) {
        patch.currentTime = info.currentTime;
      }
      if (typeof info.duration === 'number' && !Number.isNaN(info.duration) && info.duration > 0) {
        patch.duration = info.duration;
      }
      if (typeof info.state === 'number') {
        patch.isPlaying = info.state === 1;
        if (info.state === 3) setIsLoading(true);
        if (info.state === 1 || info.state === 2) setIsLoading(false);
      }
      if (Object.keys(patch).length > 0) {
        updatePlayerState(patch);
      }
    };

    const handleLoad = () => {
      setIsLoading(false);
      // Handshake with the YouTube player so it starts reporting state
      embedFrameRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'listening', id: 'ums-player', channel: 'widget' }),
        'https://www.youtube.com'
      );
    };

    window.addEventListener('message', handleMessage);
    embedFrameRef.current?.addEventListener?.('load', handleLoad);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMedia, isEmbed]);

  // Control the embedded player when the user uses our control bar
  useEffect(() => {
    if (!isEmbed || mediaType !== 'youtube') return;
    const frame = embedFrameRef.current;
    if (!frame?.contentWindow) return;

    if (playerState.isPlaying) {
      frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), 'https://www.youtube.com');
    } else if (playerState.currentTime >= 0) {
      frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), 'https://www.youtube.com');
    }
  }, [isEmbed, mediaType, playerState.isPlaying, currentMedia]);

  useEffect(() => {
    if (!isEmbed || mediaType !== 'youtube') return;
    const frame = embedFrameRef.current;
    if (!frame?.contentWindow) return;
    frame.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func: 'seekTo', args: [playerState.currentTime, true] }),
      'https://www.youtube.com'
    );
  }, [isEmbed, mediaType, playerState.currentTime, currentMedia]);

  // Subtitles / cue styling for the embedded player region
  const subtitleStyle = {
    '--cue-font-size': settings.captionFontSize === 'small' ? '14px' : settings.captionFontSize === 'large' ? '22px' : '18px',
    '--cue-background': settings.captionBackground,
  } as React.CSSProperties;

  const showBigPlay = !!currentMedia && !isLoading && !error && !playerState.isPlaying;

  return (
    <div
      ref={containerRef}
      className={`player-container relative w-full aspect-video bg-black rounded-2xl overflow-hidden group cursor-pointer ${
        settings.reducedMotion ? '' : 'transition-all'
      } ${playerState.isTheaterMode ? 'theater-mode' : ''}`}
      style={subtitleStyle}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => playerState.isPlaying && setShowControls(false)}
      onClick={(e) => {
        // Don't toggle play when clicking on controls
        if ((e.target as HTMLElement).closest('.control-bar')) return;
        if (isEmbed && e.target === containerRef.current) return;
        togglePlay();
        showControlsTemporarily();
      }}
    >
      {/* Video Element (native/HLS/DASH) */}
      {!isEmbed && (
        <video
          ref={setVideoRef}
          className="w-full h-full object-contain"
          playsInline
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {/* Embedded player (YouTube / Vimeo / Twitch) */}
      {isEmbed && currentMedia && (
        <iframe
          ref={embedFrameRef}
          src={getEmbedUrl(currentMedia.url)}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          title={getMediaTitle(currentMedia)}
          onLoad={() => {
            if (mediaType === 'youtube') {
              embedFrameRef.current?.contentWindow?.postMessage(
                JSON.stringify({ event: 'listening', id: 'ums-player', channel: 'widget' }),
                'https://www.youtube.com'
              );
            }
          }}
        />
      )}

      {/* Empty state */}
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
        {isLoading && currentMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none"
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
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-40"
          >
            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
            <p className="text-lg text-red-400">{error}</p>
            <button
              onClick={() => {
                setError(null);
                const video = videoRef.current;
                if (video && currentMedia) {
                  video.load();
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
        {showBigPlay && currentMedia && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-primary-500/90 hover:bg-primary-500 flex items-center justify-center transition-all hover:scale-110 shadow-lg shadow-primary-500/50 z-30"
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
              isEmbed={isEmbed}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Volume Indicator */}
      <AnimatePresence>
        {playerState.isMuted && !isEmbed && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute top-4 left-4 px-3 py-1.5 bg-dark-700/90 backdrop-blur rounded-lg flex items-center gap-2 z-20"
          >
            <VolumeX className="w-4 h-4" />
            <span className="text-sm">Muted</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quality Badge */}
      {playerState.quality !== 'auto' && !isEmbed && (
        <div className="absolute top-4 right-4 px-2 py-1 bg-dark-700/90 backdrop-blur rounded text-xs font-medium z-20">
          {playerState.quality}
        </div>
      )}

      {/* IPTV Badge */}
      {isIPTV && (
        <div className="absolute top-4 right-4 px-2 py-1 bg-violet-500/90 backdrop-blur rounded text-xs font-medium flex items-center gap-1 z-20">
          <Tv className="w-3 h-3" />
          IPTV
        </div>
      )}

      {/* A-B Repeat Indicator */}
      {playerState.abRepeat.start !== null && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary-500/90 backdrop-blur rounded-full text-xs font-medium z-20">
          A-B Repeat {playerState.abRepeat.end ? 'Active' : 'A set...'}
        </div>
      )}

      {/* Channel list modal for IPTV */}
      {isIPTV && currentPlaylist && (
        <IPTVChannelList
          playlist={currentPlaylist}
          currentChannel={currentIPTVChannel}
          isOpen={showChannelList}
          onClose={() => setShowChannelList(false)}
          onSelectChannel={() => {}}
          onPlayChannel={(channel) => {
            const index = currentPlaylist.channels.findIndex((ch) => ch.id === channel.id);
            playIPTVChannelFromList(channel, index);
            setShowChannelList(false);
          }}
        />
      )}
    </div>
  );
}