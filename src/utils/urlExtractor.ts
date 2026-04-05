import { MediaType } from '../types';

export interface ExtractedSource {
  url: string;
  type: MediaType;
  quality?: string;
  label?: string;
  source?: string;
}

export interface ExtractionResult {
  success: boolean;
  sources: ExtractedSource[];
  title?: string;
  thumbnail?: string;
  error?: string;
}

// Pattern matchers for different media sources
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mkv', '.avi', '.mov', '.m3u8', '.mpd', '.ogv', '.3gp'];
const PLAYLIST_EXTENSIONS = ['.m3u8', '.m3u', '.mpd'];

const M3U8_MASTER_PATTERN = /#EXTM3U[\s\S]*?#EXT-X-STREAM-INF/gi;
const M3U8_VARIANT_PATTERN = /#EXT-X-STREAM-INF:[\s\S]*?(?=#EXT|$)[\s\S]*?(https?:\/\/[^\s"']+\.m3u8[^\s"']*)/gi;
const DASH_PATTERN = /mpd["']?\s*:\s*["']([^"']+\.mpd[^"']*)["']/gi;
const HLS_SRC_PATTERN = /src\s*[=:]\s*["']([^"']+\.m3u8[^"']*)["']/gi;
const VIDEO_SRC_PATTERN = /<video[^>]*>[\s\S]*?src\s*[=:]\s*["']([^"']+\.(?:mp4|webm|mkv|ogg)[^"']*)["']/gi;
const SOURCE_TAG_PATTERN = /<source[^>]*src\s*[=:]\s*["']([^"']+\.(?:mp4|webm|mkv|ogg|m3u8|mpd)[^"']*)["'][^>]*>/gi;
const EMBED_SRC_PATTERN = /embed[_\-]?src\s*[=:]\s*["']([^"']*)["']/gi;
const DATA_SRC_PATTERN = /data-src\s*[=:]\s*["']([^"']+\.(?:mp4|webm|m3u8|mpd)[^"']*)["']/gi;
const JSON_MEDIA_PATTERN = /(?:media|video|source)[^}]*"src"\s*:\s*"([^"]+\.(?:mp4|webm|m3u8|mpd)[^"]*)"/gi;
const JWPLAYER_PATTERN = /file\s*:\s*["']([^"']+\.(?:mp4|webm|m3u8|mpd)[^"']*)["']/gi;
const VIDEOJS_PATTERN = /src\s*[=:]\s*["']([^"']+\.(?:mp4|webm|m3u8|mpd)[^"']*)["']/gi;
const PLAYER_CONFIG_PATTERN = /(?:sources|tracks)\s*:\s*\[\s*\{[^}]*(?:src|file)[^}]*\}/gi;

export async function extractPlayableSources(url: string): Promise<ExtractionResult> {
  const sources: ExtractedSource[] = [];

  try {
    // First check if URL itself is a direct playable source
    if (isDirectPlayable(url)) {
      const type = detectMediaType(url);
      sources.push({
        url,
        type,
        label: 'Direct URL',
      });
      return {
        success: true,
        sources,
        title: url.split('/').pop() || 'Untitled',
      };
    }

    // Fetch the page
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : undefined;

    // Extract thumbnail
    const ogImageMatch = html.match(/<meta[^>]*property\s*=\s*["']og:image["'][^>]*content\s*=\s*["']([^"']*)["']/i);
    const thumbnail = ogImageMatch ? ogImageMatch[1] : undefined;

    // Extract all potential sources
    const foundUrls = new Set<string>();

    // 1. Look for master HLS playlists
    const masterMatches = html.match(M3U8_MASTER_PATTERN);
    if (masterMatches) {
      masterMatches.forEach(match => {
        const variantMatch = match.match(/(https?:\/\/[^\s"']+\.m3u8[^\s"']*)/);
        if (variantMatch) {
          foundUrls.add(variantMatch[1]);
        }
      });
    }

    // 2. Look for direct HLS/DASH sources
    const hlsMatches = html.match(HLS_SRC_PATTERN);
    if (hlsMatches) {
      hlsMatches.forEach(match => {
        const urlMatch = match.match(/["']([^"']+\.m3u8[^"']*)["']/);
        if (urlMatch) foundUrls.add(urlMatch[1]);
      });
    }

    // 3. Look for DASH manifests
    const dashMatches = html.match(DASH_PATTERN);
    if (dashMatches) {
      dashMatches.forEach(match => {
        const urlMatch = match.match(/["']([^"']+\.mpd[^"']*)["']/);
        if (urlMatch) foundUrls.add(urlMatch[1]);
      });
    }

    // 4. Look for video/source tags
    const sourceMatches = html.match(SOURCE_TAG_PATTERN);
    if (sourceMatches) {
      sourceMatches.forEach(tag => {
        const srcMatch = tag.match(/src\s*[=:]\s*["']([^"']+)["']/);
        const typeMatch = tag.match(/type\s*[=:]\s*["']([^"']*)["']/);
        const labelMatch = tag.match(/label\s*[=:]\s*["']([^"']*)["']/);
        if (srcMatch) {
          foundUrls.add(srcMatch[1]);
        }
      });
    }

    // 5. Look for embedded iframes (YouTube, Vimeo, etc.)
    const iframeMatches = html.match(/<iframe[^>]*>/gi);
    if (iframeMatches) {
      iframeMatches.forEach(iframe => {
        const srcMatch = iframe.match(/src\s*[=:]\s*["']([^"']*)["']/);
        if (srcMatch) {
          const src = srcMatch[1];
          if (src.includes('youtube') || src.includes('youtu.be') || src.includes('vimeo')) {
            foundUrls.add(src);
          }
        }
      });
    }

    // 6. Look for data-src attributes
    const dataSrcMatches = html.match(DATA_SRC_PATTERN);
    if (dataSrcMatches) {
      dataSrcMatches.forEach(match => {
        const urlMatch = match.match(/["']([^"']+)["']/);
        if (urlMatch) foundUrls.add(urlMatch[1]);
      });
    }

    // 7. Look for JSON player configs
    const jsonMatches = html.match(JSON_MEDIA_PATTERN);
    if (jsonMatches) {
      jsonMatches.forEach(match => {
        const urlMatch = match.match(/"([^"]+\.(?:mp4|webm|m3u8|mpd)[^"]*)"/);
        if (urlMatch) foundUrls.add(urlMatch[1]);
      });
    }

    // 8. Look for JWPlayer
    const jwMatches = html.match(JWPLAYER_PATTERN);
    if (jwMatches) {
      jwMatches.forEach(match => {
        const urlMatch = match.match(/["']([^"']+)["']/);
        if (urlMatch) foundUrls.add(urlMatch[1]);
      });
    }

    // 9. Look for video.js
    const vjsMatches = html.match(VIDEOJS_PATTERN);
    if (vjsMatches) {
      vjsMatches.forEach(match => {
        const urlMatch = match.match(/["']([^"']+)["']/);
        if (urlMatch) foundUrls.add(urlMatch[1]);
      });
    }

    // 10. Look for any URLs with video extensions in text
    const urlPattern = /https?:\/\/[^\s"'<>]+\.(?:mp4|webm|mkv|avi|mov|m3u8|mpd)(?:[^\s"'<>]*)?/gi;
    const urlMatches = html.match(urlPattern);
    if (urlMatches) {
      urlMatches.forEach(url => {
        // Clean up the URL
        const cleanUrl = url.split('"')[0].split("'")[0].split('&')[0];
        if (cleanUrl.startsWith('http')) {
          foundUrls.add(cleanUrl);
        }
      });
    }

    // Convert found URLs to sources
    sources.push(...Array.from(foundUrls).map(url => ({
      url: cleanUrl(url),
      type: detectMediaType(url),
      label: getLabelForUrl(url),
    })));

    // Deduplicate by URL
    const uniqueSources = sources.reduce((acc, source) => {
      if (!acc.find(s => s.url === source.url)) {
        acc.push(source);
      }
      return acc;
    }, [] as ExtractedSource[]);

    return {
      success: uniqueSources.length > 0,
      sources: uniqueSources,
      title,
      thumbnail,
      error: uniqueSources.length === 0 ? 'No playable sources found' : undefined,
    };

  } catch (error) {
    return {
      success: false,
      sources: [],
      error: error instanceof Error ? error.message : 'Failed to extract sources',
    };
  }
}

function isDirectPlayable(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return VIDEO_EXTENSIONS.some(ext => lowerUrl.endsWith(ext)) ||
         VIDEO_EXTENSIONS.some(ext => lowerUrl.includes(ext));
}

function detectMediaType(url: string): MediaType {
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    return 'youtube';
  }
  if (lowerUrl.includes('vimeo.com')) {
    return 'vimeo';
  }
  if (lowerUrl.includes('drive.google.com')) {
    return 'google-drive';
  }
  if (lowerUrl.includes('dropbox.com')) {
    return 'dropbox';
  }
  if (lowerUrl.endsWith('.m3u8') || lowerUrl.includes('.m3u8')) {
    return 'hls';
  }
  if (lowerUrl.endsWith('.mpd') || lowerUrl.includes('.mpd')) {
    return 'dash';
  }
  if (lowerUrl.endsWith('.mp4') || lowerUrl.endsWith('.webm') || lowerUrl.endsWith('.mkv')) {
    return 'mp4';
  }
  return 'unknown';
}

function cleanUrl(url: string): string {
  // Remove tracking parameters and clean up URL
  try {
    const urlObj = new URL(url);
    // Keep only essential parameters
    urlObj.search = '';
    return urlObj.toString();
  } catch {
    return url;
  }
}

function getLabelForUrl(url: string): string {
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes('youtube') || lowerUrl.includes('youtu.be')) {
    return 'YouTube';
  }
  if (lowerUrl.includes('vimeo')) {
    return 'Vimeo';
  }
  if (lowerUrl.includes('720p') || lowerUrl.includes('720')) {
    return '720p';
  }
  if (lowerUrl.includes('1080p') || lowerUrl.includes('1080')) {
    return '1080p';
  }
  if (lowerUrl.includes('480p') || lowerUrl.includes('480')) {
    return '480p';
  }
  if (lowerUrl.includes('360p') || lowerUrl.includes('360')) {
    return '360p';
  }
  if (lowerUrl.includes('240p') || lowerUrl.includes('240')) {
    return '240p';
  }
  if (lowerUrl.includes('4k') || lowerUrl.includes('2160p')) {
    return '4K';
  }
  if (lowerUrl.includes('.m3u8')) {
    return 'HLS Stream';
  }
  if (lowerUrl.includes('.mpd')) {
    return 'DASH Stream';
  }
  return 'Direct';
}

export function getMediaTypeIcon(type: MediaType): string {
  const icons: Record<MediaType, string> = {
    mp4: '📹',
    webm: '🎬',
    hls: '📡',
    dash: '🌊',
    youtube: '▶️',
    vimeo: '🎥',
    'google-drive': '📁',
    dropbox: '☁️',
    unknown: '❓',
  };
  return icons[type];
}
