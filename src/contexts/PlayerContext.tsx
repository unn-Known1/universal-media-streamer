import React, { createContext, useContext, useState, useCallback, useMemo, useRef, ReactNode } from 'react';
import { PlayerState, MediaItem, SubtitleTrack, Toast, IPTVChannel, IPTVPlaylist } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { detectMediaType } from '../utils/mediaDetector';
import { MAX_HISTORY_ITEMS, MAX_BOOKMARK_ITEMS } from '../utils/constants';

interface PlayerContextType {
  playerState: PlayerState;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  playlist: MediaItem[];
  history: MediaItem[];
  bookmarks: MediaItem[];
  toasts: Toast[];
  // IPTV specific
  iptvPlaylists: IPTVPlaylist[];
  currentPlaylist: IPTVPlaylist | null;
  // Methods
  loadMedia: (url: string, title?: string) => void;
  loadIPTVChannel: (channel: IPTVChannel, playlist?: IPTVPlaylist, index?: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  seekRelative: (delta: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
  toggleFullscreen: () => void;
  toggleTheaterMode: () => void;
  togglePiP: () => void;
  setQuality: (quality: string) => void;
  setSubtitle: (trackId: string | null) => void;
  toggleLoop: () => void;
  setABRepeat: (start: number | null, end: number | null) => void;
  clearABRepeat: () => void;
  addToPlaylist: (item: MediaItem) => void;
  removeFromPlaylist: (id: string) => void;
  clearPlaylist: () => void;
  playNext: () => void;
  playPrevious: () => void;
  addToHistory: (item: MediaItem) => void;
  clearHistory: () => void;
  addBookmark: (item: MediaItem) => void;
  removeBookmark: (id: string) => void;
  clearBookmarks: () => void;
  // IPTV methods
  addIPTVPlaylist: (playlist: IPTVPlaylist) => void;
  removeIPTVPlaylist: (id: string) => void;
  clearIPTVPlaylists: () => void;
  playNextChannel: () => void;
  playPreviousChannel: () => void;
  // Toast methods
  showToast: (message: string, type?: Toast['type'], duration?: number) => void;
  dismissToast: (id: string) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

const initialPlayerState: PlayerState = {
  currentMedia: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  playbackRate: 1,
  isFullscreen: false,
  isTheaterMode: false,
  isPiP: false,
  quality: 'auto',
  availableQualities: [],
  subtitles: [],
  activeSubtitle: null,
  buffered: 0,
  isLooping: false,
  abRepeat: { start: null, end: null },
  currentPlaylist: undefined,
  currentChannelIndex: 0,
  isIPTV: false,
};

export function PlayerProvider({ children }: { children: ReactNode }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>(initialPlayerState);
  const [playlist, setPlaylist] = useLocalStorage<MediaItem[]>('ums-playlist', []);
  const [history, setHistory] = useLocalStorage<MediaItem[]>('ums-history', []);
  const [bookmarks, setBookmarks] = useLocalStorage<MediaItem[]>('ums-bookmarks', []);
  const [iptvPlaylists, setIptvPlaylists] = useLocalStorage<IPTVPlaylist[]>('ums-iptv-playlists', []);
  const [currentPlaylist, setCurrentPlaylist] = useState<IPTVPlaylist | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const loadMedia = useCallback((url: string, title?: string) => {
    const mediaType = detectMediaType(url);
    const newMedia: MediaItem = {
      id: generateId(),
      url,
      title: title || url.split('/').pop()?.split('?')[0] || 'Untitled',
      type: mediaType,
      addedAt: Date.now(),
      lastPlayedAt: Date.now(),
    };

    setPlayerState((prev) => ({
      ...prev,
      currentMedia: newMedia,
      isPlaying: true,
      currentTime: 0,
      duration: 0,
      isIPTV: false,
      currentPlaylist: undefined,
      currentChannelIndex: 0,
    }));

    // Add to history
    addToHistory(newMedia);
  }, []);

  // IPTV specific: Load a channel
  const loadIPTVChannel = useCallback((channel: IPTVChannel, playlist?: IPTVPlaylist, index?: number) => {
    setCurrentPlaylist(playlist || null);
    
    setPlayerState((prev) => ({
      ...prev,
      currentMedia: {
        ...channel,
        lastPlayedAt: Date.now(),
      } as IPTVChannel,
      isPlaying: true,
      currentTime: 0,
      duration: 0,
      isIPTV: true,
      currentPlaylist: playlist,
      currentChannelIndex: index ?? 0,
    }));
  }, []);

  const play = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play();
      setPlayerState((prev) => ({ ...prev, isPlaying: true }));
    }
  }, []);

  const pause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      setPlayerState((prev) => ({ ...prev, isPlaying: false }));
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (playerState.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [playerState.isPlaying, play, pause]);

  const seek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(time, playerState.duration));
    }
  }, [playerState.duration]);

  const seekRelative = useCallback((delta: number) => {
    seek(playerState.currentTime + delta);
  }, [playerState.currentTime, seek]);

  const setVolume = useCallback((volume: number) => {
    if (videoRef.current) {
      const clampedVolume = Math.max(0, Math.min(volume, 2)); // Allow up to 200% boost
      videoRef.current.volume = Math.min(clampedVolume, 1); // Cap actual volume at 100%
      setPlayerState((prev) => ({ ...prev, volume: clampedVolume, isMuted: clampedVolume === 0 }));
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setPlayerState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
    }
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlayerState((prev) => ({ ...prev, playbackRate: rate }));
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = document.querySelector('.player-container') as HTMLElement;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen();
      setPlayerState((prev) => ({ ...prev, isFullscreen: true }));
    } else {
      document.exitFullscreen();
      setPlayerState((prev) => ({ ...prev, isFullscreen: false }));
    }
  }, []);

  const toggleTheaterMode = useCallback(() => {
    setPlayerState((prev) => ({ ...prev, isTheaterMode: !prev.isTheaterMode }));
  }, []);

  const togglePiP = useCallback(async () => {
    if (videoRef.current) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
          setPlayerState((prev) => ({ ...prev, isPiP: false }));
        } else if (document.pictureInPictureEnabled) {
          await videoRef.current.requestPictureInPicture();
          setPlayerState((prev) => ({ ...prev, isPiP: true }));
        }
      } catch (error) {
        console.error('PiP error:', error);
      }
    }
  }, []);

  const setQuality = useCallback((quality: string) => {
    setPlayerState((prev) => ({ ...prev, quality }));
    // Quality switching logic would be handled by the player component
  }, []);

  const setSubtitle = useCallback((trackId: string | null) => {
    setPlayerState((prev) => ({ ...prev, activeSubtitle: trackId }));
  }, []);

  const toggleLoop = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.loop = !videoRef.current.loop;
      setPlayerState((prev) => ({ ...prev, isLooping: !prev.isLooping }));
    }
  }, []);

  const setABRepeat = useCallback((start: number | null, end: number | null) => {
    setPlayerState((prev) => ({ ...prev, abRepeat: { start, end } }));
  }, []);

  const clearABRepeat = useCallback(() => {
    setPlayerState((prev) => ({ ...prev, abRepeat: { start: null, end: null } }));
  }, []);

  const addToPlaylist = useCallback((item: MediaItem) => {
    setPlaylist((prev) => [...prev, item]);
    showToast('Added to playlist', 'success');
  }, [setPlaylist]);

  const removeFromPlaylist = useCallback((id: string) => {
    setPlaylist((prev) => prev.filter((item) => item.id !== id));
  }, [setPlaylist]);

  const clearPlaylist = useCallback(() => {
    setPlaylist([]);
  }, [setPlaylist]);

  const playNext = useCallback(() => {
    if (playlist.length > 0 && playerState.currentMedia) {
      const currentIndex = playlist.findIndex((item) => item.id === playerState.currentMedia?.id);
      if (currentIndex < playlist.length - 1) {
        const nextItem = playlist[currentIndex + 1];
        loadMedia(nextItem.url, nextItem.title);
      }
    }
  }, [playlist, playerState.currentMedia, loadMedia]);

  const playPrevious = useCallback(() => {
    if (playlist.length > 0 && playerState.currentMedia) {
      const currentIndex = playlist.findIndex((item) => item.id === playerState.currentMedia?.id);
      if (currentIndex > 0) {
        const prevItem = playlist[currentIndex - 1];
        loadMedia(prevItem.url, prevItem.title);
      }
    }
  }, [playlist, playerState.currentMedia, loadMedia]);

  // IPTV: Play next channel in playlist
  const playNextChannel = useCallback(() => {
    if (playerState.isIPTV && currentPlaylist && playerState.currentChannelIndex < currentPlaylist.channels.length - 1) {
      const nextIndex = playerState.currentChannelIndex + 1;
      const nextChannel = currentPlaylist.channels[nextIndex];
      loadIPTVChannel(nextChannel, currentPlaylist, nextIndex);
    }
  }, [playerState.isIPTV, currentPlaylist, playerState.currentChannelIndex, loadIPTVChannel]);

  // IPTV: Play previous channel in playlist
  const playPreviousChannel = useCallback(() => {
    if (playerState.isIPTV && currentPlaylist && playerState.currentChannelIndex > 0) {
      const prevIndex = playerState.currentChannelIndex - 1;
      const prevChannel = currentPlaylist.channels[prevIndex];
      loadIPTVChannel(prevChannel, currentPlaylist, prevIndex);
    }
  }, [playerState.isIPTV, currentPlaylist, playerState.currentChannelIndex, loadIPTVChannel]);

  const addToHistory = useCallback((item: MediaItem) => {
    setHistory((prev) => {
      // Remove if already exists
      const filtered = prev.filter((h) => h.url !== item.url);
      // Add to beginning
      const updated = [item, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      return updated;
    });
  }, [setHistory]);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, [setHistory]);

  const addBookmark = useCallback((item: MediaItem) => {
    setBookmarks((prev) => {
      if (prev.some((b) => b.url === item.url)) {
        showToast('Already bookmarked', 'info');
        return prev;
      }
      const updated = [item, ...prev].slice(0, MAX_BOOKMARK_ITEMS);
      showToast('Added to bookmarks', 'success');
      return updated;
    });
  }, [setBookmarks]);

  const removeBookmark = useCallback((id: string) => {
    setBookmarks((prev) => prev.filter((item) => item.id !== id));
  }, [setBookmarks]);

  const clearBookmarks = useCallback(() => {
    setBookmarks([]);
  }, [setBookmarks]);

  // IPTV Playlist management
  const addIPTVPlaylist = useCallback((playlist: IPTVPlaylist) => {
    setIptvPlaylists((prev) => {
      // Update if exists, otherwise add
      const filtered = prev.filter((p) => p.url !== playlist.url);
      return [playlist, ...filtered].slice(0, 20); // Keep max 20 playlists
    });
  }, [setIptvPlaylists]);

  const removeIPTVPlaylist = useCallback((id: string) => {
    setIptvPlaylists((prev) => prev.filter((p) => p.id !== id));
  }, [setIptvPlaylists]);

  const clearIPTVPlaylists = useCallback(() => {
    setIptvPlaylists([]);
  }, [setIptvPlaylists]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info', duration: number = 3000) => {
    const id = generateId();
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const value = useMemo(() => ({
    playerState,
    videoRef,
    playlist,
    history,
    bookmarks,
    toasts,
    iptvPlaylists,
    currentPlaylist,
    loadMedia,
    loadIPTVChannel,
    play,
    pause,
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
    toggleLoop,
    setABRepeat,
    clearABRepeat,
    addToPlaylist,
    removeFromPlaylist,
    clearPlaylist,
    playNext,
    playPrevious,
    addToHistory,
    clearHistory,
    addBookmark,
    removeBookmark,
    clearBookmarks,
    addIPTVPlaylist,
    removeIPTVPlaylist,
    clearIPTVPlaylists,
    playNextChannel,
    playPreviousChannel,
    showToast,
    dismissToast,
  }), [
    playerState, playlist, history, bookmarks, toasts, iptvPlaylists, currentPlaylist,
    loadMedia, loadIPTVChannel, play, pause, togglePlay,
    seek, seekRelative, setVolume, toggleMute, setPlaybackRate, toggleFullscreen,
    toggleTheaterMode, togglePiP, setQuality, setSubtitle, toggleLoop, setABRepeat,
    clearABRepeat, addToPlaylist, removeFromPlaylist, clearPlaylist, playNext, playPrevious,
    addToHistory, clearHistory, addBookmark, removeBookmark, clearBookmarks,
    addIPTVPlaylist, removeIPTVPlaylist, clearIPTVPlaylists, playNextChannel, playPreviousChannel,
    showToast, dismissToast
  ]);

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}