import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  PictureInPicture2,
  Subtitles,
  Settings,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Camera,
  Cast,
  ChevronDown,
  Gauge,
  Clapperboard,
  Languages,
  Moon,
  Sun,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayer } from '../contexts/PlayerContext';
import { useSettings } from '../contexts/SettingsContext';
import { formatTime } from '../utils/formatTime';
import { PLAYBACK_RATES, VOLUME_BOOST_MAX } from '../utils/constants';

interface ControlBarProps {
  videoElement: HTMLVideoElement | null;
  onShowShortcuts: () => void;
}

export function ControlBar({ videoElement, onShowShortcuts }: ControlBarProps) {
  const {
    playerState,
    togglePlay,
    seek,
    seekRelative,
    setVolume,
    toggleMute,
    setPlaybackRate,
    toggleFullscreen,
    togglePiP,
    toggleLoop,
    setABRepeat,
    clearABRepeat,
    showToast,
  } = usePlayer();

  const { settings } = useSettings();

  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [isHoveringProgress, setIsHoveringProgress] = useState(false);
  const [hoverTime, setHoverTime] = useState(0);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);

  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);

  const { currentTime, duration, volume, isMuted, isFullscreen, isLooping, abRepeat, buffered, availableQualities, quality } = playerState;

  // Handle volume changes
  const handleVolumeChange = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (progressRef.current || true) {
      const rect = volumeRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const newVolume = Math.max(0, Math.min(x / rect.width, VOLUME_BOOST_MAX));
        setVolume(newVolume);
      }
    }
  }, [setVolume]);

  // Progress bar interactions
  const handleProgressClick = useCallback((e: React.MouseEvent) => {
    const rect = progressRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const percent = x / rect.width;
      seek(percent * duration);
    }
  }, [duration, seek]);

  const handleProgressHover = useCallback((e: React.MouseEvent) => {
    const rect = progressRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const percent = x / rect.width;
      setHoverTime(percent * duration);
      setHoverPosition(x);
    }
  }, [duration]);

  // Volume drag
  useEffect(() => {
    if (showVolumeSlider) {
      const handleMouseMove = (e: MouseEvent) => handleVolumeChange(e);
      const handleMouseUp = () => {
        setShowVolumeSlider(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [showVolumeSlider, handleVolumeChange]);

  // Screenshot
  const handleScreenshot = () => {
    if (!videoElement) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoElement, 0, 0);
      const link = document.createElement('a');
      link.download = `screenshot-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('Screenshot saved', 'success');
    }
  };

  // Volume icon
  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  // Progress percentage
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={controlsRef}
      className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300"
    >
      {/* Hover Time Tooltip */}
      <AnimatePresence>
        {isHoveringProgress && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full mb-2 px-3 py-1.5 bg-dark-700/90 backdrop-blur rounded-lg text-sm font-medium pointer-events-none transform -translate-x-1/2"
            style={{ left: hoverPosition }}
          >
            {formatTime(hoverTime, duration > 3600)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Bar */}
      <div
        ref={progressRef}
        className="group relative h-1.5 bg-white/20 rounded-full cursor-pointer mb-4 overflow-hidden"
        onClick={handleProgressClick}
        onMouseEnter={() => setIsHoveringProgress(true)}
        onMouseLeave={() => setIsHoveringProgress(false)}
        onMouseMove={handleProgressHover}
      >
        {/* Buffered */}
        <div
          className="absolute top-0 left-0 h-full bg-white/30 rounded-full"
          style={{ width: `${bufferedPercent}%` }}
        />

        {/* A-B Repeat Markers */}
        {abRepeat.start !== null && (
          <div
            className="absolute top-0 bottom-0 bg-primary-500/50"
            style={{
              left: `${(abRepeat.start / duration) * 100}%`,
              right: `${100 - (abRepeat.end! / duration) * 100}%`,
            }}
          />
        )}
        {abRepeat.start !== null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-primary-500 rounded-full"
            style={{ left: `${(abRepeat.start / duration) * 100}%` }}
          />
        )}
        {abRepeat.end !== null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-primary-500 rounded-full"
            style={{ left: `${(abRepeat.end / duration) * 100}%` }}
          />
        )}

        {/* Progress */}
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />

        {/* Scrubber */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${progressPercent}% - 8px)` }}
        />
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between gap-4">
        {/* Left Controls */}
        <div className="flex items-center gap-1">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="p-2.5 rounded-xl hover:bg-white/10 transition-colors"
            aria-label={playerState.isPlaying ? 'Pause' : 'Play'}
          >
            {playerState.isPlaying ? (
              <Pause className="w-6 h-6 fill-white" />
            ) : (
              <Play className="w-6 h-6 fill-white" />
            )}
          </button>

          {/* Skip Back */}
          <button
            onClick={() => seekRelative(-10)}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors group"
            aria-label="Skip back 10 seconds"
          >
            <SkipBack className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 text-[8px] font-bold">10</span>
          </button>

          {/* Skip Forward */}
          <button
            onClick={() => seekRelative(10)}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors group relative"
            aria-label="Skip forward 10 seconds"
          >
            <SkipForward className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 text-[8px] font-bold">10</span>
          </button>

          {/* Volume */}
          <div className="relative flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              <VolumeIcon className="w-5 h-5" />
            </button>

            <div
              className="relative w-24 h-1.5 bg-white/20 rounded-full cursor-pointer"
              onClick={handleVolumeChange}
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
              onMouseDown={() => setShowVolumeSlider(true)}
            >
              <div
                className="absolute top-0 left-0 h-full bg-white rounded-full"
                style={{ width: `${Math.min(volume, 1) * 100}%` }}
              />
            </div>

            {/* Volume Boost Indicator */}
            {volume > 1 && (
              <span className="text-xs text-primary-400 font-medium">
                {Math.round(volume * 100)}%
              </span>
            )}
          </div>

          {/* Time */}
          <div className="ml-2 text-sm font-mono tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span className="text-slate-500 mx-1">/</span>
            <span className="text-slate-400">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1">
          {/* A-B Repeat */}
          <button
            onClick={() => {
              if (abRepeat.start === null) {
                setABRepeat(currentTime, null);
                showToast('A point set', 'info');
              } else if (abRepeat.end === null) {
                setABRepeat(abRepeat.start, currentTime);
                showToast('B point set', 'info');
              } else {
                clearABRepeat();
                showToast('A-B repeat cleared', 'info');
              }
            }}
            className={`p-2 rounded-xl transition-colors ${
              abRepeat.start !== null ? 'bg-primary-500/20 text-primary-400' : 'hover:bg-white/10'
            }`}
            aria-label="A-B repeat"
          >
            <Repeat1 className="w-5 h-5" />
          </button>

          {/* Loop */}
          <button
            onClick={toggleLoop}
            className={`p-2 rounded-xl transition-colors ${
              isLooping ? 'bg-primary-500/20 text-primary-400' : 'hover:bg-white/10'
            }`}
            aria-label={isLooping ? 'Disable loop' : 'Enable loop'}
          >
            <Repeat className="w-5 h-5" />
          </button>

          {/* Speed */}
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium flex items-center gap-1"
            >
              <Gauge className="w-4 h-4" />
              {playerState.playbackRate}x
            </button>

            <AnimatePresence>
              {showSpeedMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full right-0 mb-2 p-2 bg-dark-700/95 backdrop-blur rounded-xl border border-white/10 shadow-2xl min-w-[120px]"
                >
                  {PLAYBACK_RATES.map((rate) => (
                    <button
                      key={rate}
                      onClick={() => {
                        setPlaybackRate(rate);
                        setShowSpeedMenu(false);
                      }}
                      className={`w-full px-3 py-2 rounded-lg text-sm text-left hover:bg-white/10 transition-colors ${
                        playerState.playbackRate === rate ? 'text-primary-400 bg-primary-500/10' : ''
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quality */}
          {availableQualities.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowQualityMenu(!showQualityMenu)}
                className="px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium flex items-center gap-1"
              >
                <Clapperboard className="w-4 h-4" />
                {quality === 'auto' ? 'Auto' : quality}
              </button>

              <AnimatePresence>
                {showQualityMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full right-0 mb-2 p-2 bg-dark-700/95 backdrop-blur rounded-xl border border-white/10 shadow-2xl min-w-[100px]"
                  >
                    <button
                      onClick={() => {
                        setPlaybackRate(1); // Trigger auto quality
                        setShowQualityMenu(false);
                      }}
                      className={`w-full px-3 py-2 rounded-lg text-sm text-left hover:bg-white/10 transition-colors ${
                        quality === 'auto' ? 'text-primary-400 bg-primary-500/10' : ''
                      }`}
                    >
                      Auto
                    </button>
                    {availableQualities.map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          setPlaybackRate(1); // Trigger quality change
                          setShowQualityMenu(false);
                        }}
                        className={`w-full px-3 py-2 rounded-lg text-sm text-left hover:bg-white/10 transition-colors ${
                          quality === q ? 'text-primary-400 bg-primary-500/10' : ''
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Subtitles */}
          <button
            onClick={() => showToast('Subtitles coming soon', 'info')}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            aria-label="Toggle subtitles"
          >
            <Subtitles className="w-5 h-5" />
          </button>

          {/* Screenshot */}
          <button
            onClick={handleScreenshot}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            aria-label="Take screenshot"
          >
            <Camera className="w-5 h-5" />
          </button>

          {/* Cast */}
          <button
            onClick={() => showToast('Casting available on supported devices', 'info')}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            aria-label="Cast to device"
          >
            <Cast className="w-5 h-5" />
          </button>

          {/* PiP */}
          <button
            onClick={togglePiP}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            aria-label="Picture in Picture"
          >
            <PictureInPicture2 className="w-5 h-5" />
          </button>

          {/* Theater */}
          <button
            onClick={() => {}}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            aria-label="Theater mode"
          >
            <Minimize className="w-5 h-5" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <Minimize className="w-5 h-5" />
            ) : (
              <Maximize className="w-5 h-5" />
            )}
          </button>

          {/* Settings */}
          <button
            onClick={onShowShortcuts}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
