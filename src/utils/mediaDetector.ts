import { MediaType } from '../types';
import {
  MEDIA_EXTENSIONS,
  YOUTUBE_PATTERNS,
  VIMEO_PATTERN,
  TWITCH_PATTERN,
  GOOGLE_DRIVE_PATTERN,
  DROPBOX_PATTERN,
} from './constants';
import { isIPTVPlaylistUrl } from './iptvParser';

export function detectMediaType(url: string): MediaType {
  // Check for YouTube
  for (const pattern of YOUTUBE_PATTERNS) {
    if (pattern.test(url)) {
      return 'youtube';
    }
  }

  // Check for Vimeo
  if (VIMEO_PATTERN.test(url)) {
    return 'vimeo';
  }

  // Check for Twitch
  if (TWITCH_PATTERN.test(url)) {
    return 'twitch';
  }

  // Check for Google Drive
  if (GOOGLE_DRIVE_PATTERN.test(url)) {
    return 'google-drive';
  }

  // Check for Dropbox
  if (DROPBOX_PATTERN.test(url)) {
    return 'dropbox';
  }

  // Check file extensions FIRST so direct media files (even those whose
  // path contains "live/", "stream/", "playlist/" etc.) are never
  // misclassified as IPTV playlists.
  const urlLower = url.toLowerCase();
  for (const [ext, type] of Object.entries(MEDIA_EXTENSIONS)) {
    if (urlLower.endsWith(ext)) {
      return type;
    }
  }

  // Check for HLS in query params or path
  if (urlLower.includes('m3u8')) {
    return 'hls';
  }

  // Check for DASH
  if (urlLower.includes('mpd')) {
    return 'dash';
  }

  // Check for IPTV playlist (only after we know it is not a direct stream)
  if (isIPTVPlaylistUrl(url)) {
    return 'iptv';
  }

  return 'unknown';
}

export function isPlayableUrl(url: string): boolean {
  const type = detectMediaType(url);
  return type !== 'unknown';
}

export function getMediaTypeLabel(type: MediaType): string {
  const labels: Record<MediaType, string> = {
    mp4: 'MP4',
    webm: 'WebM',
    hls: 'HLS Stream',
    dash: 'DASH Stream',
    youtube: 'YouTube',
    vimeo: 'Vimeo',
    'google-drive': 'Google Drive',
    dropbox: 'Dropbox',
    iptv: 'IPTV',
    twitch: 'Twitch',
    unknown: 'Unknown',
  };
  return labels[type];
}

export function getMediaTypeColor(type: MediaType): string {
  const colors: Record<MediaType, string> = {
    mp4: '#22c55e',
    webm: '#22c55e',
    hls: '#f59e0b',
    dash: '#f59e0b',
    youtube: '#ef4444',
    vimeo: '#06b6d4',
    'google-drive': '#3b82f6',
    dropbox: '#0061fe',
    iptv: '#8b5cf6',
    twitch: '#9146ff',
    unknown: '#94a3b8',
  };
  return colors[type];
}

export function extractYoutubeId(url: string): string | null {
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

export function extractVimeoId(url: string): string | null {
  const match = url.match(VIMEO_PATTERN);
  return match ? match[1] : null;
}

export function extractTwitchChannel(url: string): string | null {
  const match = url.match(TWITCH_PATTERN);
  return match ? match[1] : null;
}

export function extractGoogleDriveId(url: string): string | null {
  const match = url.match(GOOGLE_DRIVE_PATTERN);
  return match ? match[1] : null;
}

export function convertGoogleDriveUrl(url: string): string {
  const id = extractGoogleDriveId(url);
  if (id) {
    return `https://drive.google.com/uc?export=download&id=${id}`;
  }
  return url;
}

export function convertDropboxUrl(url: string): string {
  // Convert Dropbox share URL to direct download
  if (url.includes('dropbox.com')) {
    return url.replace('?dl=0', '?dl=1').replace('?dl=1&', '?dl=1&');
  }
  return url;
}

export function getEmbedUrl(url: string): string {
  const type = detectMediaType(url);

  switch (type) {
    case 'youtube': {
      const videoId = extractYoutubeId(url);
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&origin=${encodeURIComponent(origin)}`;
    }
    case 'vimeo': {
      const videoId = extractVimeoId(url);
      return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
    }
    case 'twitch': {
      const channel = extractTwitchChannel(url);
      if (channel) {
        const parent = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        return `https://player.twitch.tv/?channel=${channel}&parent=${parent}&autoplay=true`;
      }
      return url;
    }
    case 'google-drive':
      return convertGoogleDriveUrl(url);
    case 'dropbox':
      return convertDropboxUrl(url);
    case 'iptv':
    case 'hls':
    case 'dash':
    case 'mp4':
    case 'webm':
    default:
      return url;
  }
}

export function validateUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS URLs are supported' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}