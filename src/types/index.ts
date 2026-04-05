export type MediaType = 'mp4' | 'webm' | 'hls' | 'dash' | 'youtube' | 'vimeo' | 'google-drive' | 'dropbox' | 'unknown';

export interface MediaItem {
  id: string;
  url: string;
  title: string;
  type: MediaType;
  duration?: number;
  thumbnail?: string;
  addedAt: number;
  lastPlayedAt?: number;
}

export interface Bookmark extends MediaItem {}

export interface PlaylistItem extends MediaItem {
  position: number;
}

export interface PlayerState {
  currentMedia: MediaItem | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isFullscreen: boolean;
  isTheaterMode: boolean;
  isPiP: boolean;
  quality: string;
  availableQualities: string[];
  subtitles: SubtitleTrack[];
  activeSubtitle: string | null;
  buffered: number;
  isLooping: boolean;
  abRepeat: { start: number | null; end: number | null };
}

export interface SubtitleTrack {
  id: string;
  label: string;
  language: string;
  src?: string;
  default?: boolean;
}

export interface Settings {
  theme: 'dark' | 'light' | 'system';
  accentColor: string;
  defaultPlaybackSpeed: number;
  autoPlayNext: boolean;
  defaultVolume: number;
  showCaptions: boolean;
  captionFontSize: 'small' | 'medium' | 'large';
  captionBackground: string;
  reducedMotion: boolean;
  highContrast: boolean;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}
