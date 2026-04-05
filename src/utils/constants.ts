import { MediaType } from '../types';

export const MEDIA_EXTENSIONS: Record<string, MediaType> = {
  '.mp4': 'mp4',
  '.webm': 'webm',
  '.mkv': 'mp4',
  '.avi': 'mp4',
  '.mov': 'mp4',
  '.m3u8': 'hls',
  '.mpd': 'dash',
};

export const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
];

export const VIMEO_PATTERN = /vimeo\.com\/(?:video\/)?(\d+)/;

export const GOOGLE_DRIVE_PATTERN = /drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/;

export const DROPBOX_PATTERN = /dropbox\.com\/(?:s\/|share\/)([a-zA-Z0-9_-]+)/;

export const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 3];

export const VOLUME_BOOST_MAX = 2.0;

export const KEYBOARD_SHORTCUTS = {
  ' ': 'playPause',
  k: 'playPause',
  f: 'fullscreen',
  t: 'theater',
  m: 'mute',
  p: 'pip',
  c: 'captions',
  ArrowLeft: 'seekBack',
  ArrowRight: 'seekForward',
  ArrowUp: 'volumeUp',
  ArrowDown: 'volumeDown',
  j: 'seekBack10',
  l: 'seekForward10',
  '0': 'seek0',
  '1': 'seek10',
  '2': 'seek20',
  '3': 'seek30',
  '4': 'seek40',
  '5': 'seek50',
  '6': 'seek60',
  '7': 'seek70',
  '8': 'seek80',
  '9': 'seek90',
  '?': 'showShortcuts',
};

export const DEFAULT_SETTINGS = {
  theme: 'dark' as const,
  accentColor: '#6366f1',
  defaultPlaybackSpeed: 1,
  autoPlayNext: false,
  defaultVolume: 1,
  showCaptions: false,
  captionFontSize: 'medium' as const,
  captionBackground: 'rgba(0, 0, 0, 0.75)',
  reducedMotion: false,
  highContrast: false,
};

export const MAX_HISTORY_ITEMS = 20;
export const MAX_BOOKMARK_ITEMS = 100;

export const CONTROL_BAR_HIDE_DELAY = 3000;
