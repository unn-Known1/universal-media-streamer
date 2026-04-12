import { IPTVChannel, IPTVPlaylist } from '../types';

/**
 * Parse M3U/M3U8 playlist content and extract IPTV channels
 * Supports standard M3U format and extended M3U (with #EXTINF)
 */
export function parseM3U(content: string): IPTVChannel[] {
  const channels: IPTVChannel[] = [];
  const lines = content.split(/\r?\n/);
  let currentInfo: Partial<ExtInfInfo> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line || line.startsWith('#')) {
      // Skip empty lines and comments
      if (line.startsWith('#EXTINF:')) {
        currentInfo = parseExtInf(line);
      } else if (line.startsWith('#EXTGRP:')) {
        // Extended group info
        if (currentInfo) {
          currentInfo.group = line.replace('#EXTGRP:', '').trim();
        }
      } else if (line.startsWith('#EXTVLCOPT:')) {
        // VLC options - could be used for additional metadata
        // Currently not parsing this
      }
      continue;
    }

    // This is a URL line
    const url = line;

    // Skip if no info or no valid URL
    if (!currentInfo && !url) continue;

    // Validate URL
    if (!isValidUrl(url)) continue;

    // Skip known non-stream URLs
    if (isNonStreamUrl(url)) continue;

    const channel: IPTVChannel = {
      id: generateChannelId(url, currentInfo?.tvgId),
      name: currentInfo?.name || extractNameFromUrl(url),
      logo: currentInfo?.logo || currentInfo?.tvgLogo || undefined,
      group: currentInfo?.group || currentInfo?.category || undefined,
      tvgId: currentInfo?.tvgId,
      tvgName: currentInfo?.tvgName,
      tvgLogo: currentInfo?.tvgLogo,
      url: url,
      type: 'iptv',
      category: currentInfo?.category,
      addedAt: Date.now(),
    };

    channels.push(channel);
    currentInfo = null; // Reset for next channel
  }

  return channels;
}

interface ExtInfInfo {
  name: string;
  tvgId?: string;
  tvgName?: string;
  tvgLogo?: string;
  group?: string;
  category?: string;
  aspectRatio?: string;
  startTime?: string;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  [key: string]: any;
}

/**
 * Parse #EXTINF line to extract channel metadata
 * Format: #EXTINF:[duration],[attributes]<space>[channel name]
 * or: #EXTINF:-1 tvg-id="..." tvg-name="..." tvg-logo="..." group-title="...",[name]
 */
function parseExtInf(line: string): Partial<ExtInfInfo> {
  const info: Partial<ExtInfInfo> = {};

  // Remove #EXTINF:
  const afterExtinf = line.substring(8);

  // Split by comma to separate attributes from name
  const commaIndex = afterExtinf.indexOf(',');

  if (commaIndex === -1) {
    // No comma - just duration or just name
    const trimmed = afterExtinf.trim();
    if (trimmed && !trimmed.includes('=')) {
      info.name = trimmed;
    }
    return info;
  }

  // Get the part before the comma (attributes)
  const attributesPart = afterExtinf.substring(0, commaIndex);
  // Get the part after the comma (name)
  let namePart = afterExtinf.substring(commaIndex + 1).trim();

  // Parse attributes (before comma)
  if (attributesPart.includes('=')) {
    // Extended format with key=value pairs
    const attrRegex = /(\w+)-(\w+)="([^"]*)"|(\w+)="([^"]*)"/g;
    let match;
    while ((match = attrRegex.exec(attributesPart)) !== null) {
      if (match[1] && match[2]) {
        // Composite key like tvg-id
        const key = `${match[1]}-${match[2]}`;
        const value = match[3];
        (info as any)[key] = value;
      } else if (match[4]) {
        (info as any)[match[4]] = match[5];
      }
    }

    // Also support group-title= syntax
    const groupMatch = attributesPart.match(/group-title="([^"]*)"/);
    if (groupMatch) {
      info.group = groupMatch[1];
    }

    // Support category as custom attribute
    const catMatch = attributesPart.match(/category="([^"]*)"/);
    if (catMatch) {
      info.category = catMatch[1];
    }
  }

  // Parse name (after comma)
  // Handle quoted names
  if (namePart.startsWith('"') && namePart.endsWith('"')) {
    info.name = namePart.slice(1, -1);
  } else if (namePart.startsWith('"') && namePart.endsWith('"') && namePart.length > 1) {
    // Find the ending quote
    const endQuote = namePart.lastIndexOf('"');
    if (endQuote > 0) {
      info.name = namePart.slice(1, endQuote);
    } else {
      info.name = namePart;
    }
  } else {
    info.name = namePart;
  }

  return info;
}

/**
 * Generate a unique ID for a channel based on URL and optional tvg-id
 */
function generateChannelId(url: string, tvgId?: string): string {
  const base = tvgId || url;
  // Simple hash for consistent IDs
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    const char = base.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `iptv-${Math.abs(hash).toString(36)}`;
}

/**
 * Extract a readable name from a URL
 */
function extractNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1] || urlObj.hostname;
    // Remove common extensions
    const name = lastPart.replace(/\.(m3u8?|ts|mkv|mp4|avi|mov)$/i, '');
    // Replace underscores and dashes with spaces
    return name.replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim() || 'Unknown Channel';
  } catch {
    return 'Unknown Channel';
  }
}

/**
 * Basic URL validation
 */
function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

/**
 * Check if URL is likely not a media stream
 */
function isNonStreamUrl(url: string): boolean {
  const skipPatterns = [
    /\.(jpg|jpeg|png|gif|webp|svg|ico|css|js|html|htm|xml|json|txt|php|asp|jsp)\s*$/i,
    /\/(playlist|m3u|m3u8|index)\s*$/i,
  ];
  return skipPatterns.some(pattern => pattern.test(url));
}

/**
 * Load and parse IPTV playlist from URL
 */
export async function loadIPTVPlaylist(url: string): Promise<IPTVPlaylist> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch playlist: ${response.statusText}`);
    }

    const content = await response.text();
    const channels = parseM3U(content);

    // Extract playlist name from content
    let playlistName = 'IPTV Playlist';
    const nameMatch = content.match(/#PLAYLIST:([^\r\n]+)/);
    if (nameMatch) {
      playlistName = nameMatch[1].trim();
    }

    // Try to get name from URL
    if (playlistName === 'IPTV Playlist') {
      try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        const lastPart = pathParts[pathParts.length - 1] || urlObj.hostname;
        playlistName = lastPart.replace(/\.(m3u8?|m3u)$/i, '').replace(/[_-]/g, ' ');
      } catch {
        // Use default name
      }
    }

    return {
      id: generatePlaylistId(url),
      name: playlistName,
      url: url,
      channels: channels,
      addedAt: Date.now(),
    };
  } catch (error) {
    throw new Error(`Failed to load IPTV playlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a unique ID for a playlist
 */
function generatePlaylistId(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `playlist-${Math.abs(hash).toString(36)}`;
}

/**
 * Group channels by category/group
 */
export function groupChannelsByCategory(channels: IPTVChannel[]): Map<string, IPTVChannel[]> {
  const grouped = new Map<string, IPTVChannel[]>();

  for (const channel of channels) {
    const category = channel.group || channel.category || 'Uncategorized';
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push(channel);
  }

  return grouped;
}

/**
 * Search channels by name
 */
export function searchChannels(channels: IPTVChannel[], query: string): IPTVChannel[] {
  const lowerQuery = query.toLowerCase();
  return channels.filter(channel =>
    channel.name.toLowerCase().includes(lowerQuery) ||
    channel.group?.toLowerCase().includes(lowerQuery) ||
    channel.tvgName?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Check if URL is likely an IPTV playlist
 */
export function isIPTVPlaylistUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  // Check file extension
  if (lowerUrl.endsWith('.m3u') || lowerUrl.endsWith('.m3u8')) {
    return true;
  }
  // Check for common IPTV hosting patterns
  const iptvPatterns = [
    /\/tv\//i,
    /\/iptv\//i,
    /\/live\//i,
    /\/stream\//i,
    /playlist/i,
    /channels/i,
  ];
  return iptvPatterns.some(pattern => pattern.test(url));
}

/**
 * Get unique categories from channels
 */
export function getUniqueCategories(channels: IPTVChannel[]): string[] {
  const categories = new Set<string>();
  for (const channel of channels) {
    if (channel.group) {
      categories.add(channel.group);
    }
    if (channel.category && !categories.has(channel.category)) {
      categories.add(channel.category);
    }
  }
  return Array.from(categories).sort();
}

/**
 * Sort channels alphabetically with optional category grouping
 */
export function sortChannels(channels: IPTVChannel[], sortBy: 'name' | 'group' = 'name'): IPTVChannel[] {
  return [...channels].sort((a, b) => {
    if (sortBy === 'group' && a.group && b.group) {
      const groupCompare = a.group.localeCompare(b.group);
      if (groupCompare !== 0) return groupCompare;
    }
    return a.name.localeCompare(b.name);
  });
}

/**
 * Validate channel URLs (basic check)
 */
export function validateChannel(channel: IPTVChannel): { valid: boolean; error?: string } {
  if (!channel.url) {
    return { valid: false, error: 'No URL provided' };
  }

  if (!isValidUrl(channel.url)) {
    return { valid: false, error: 'Invalid URL format' };
  }

  // Check for common streaming protocols
  const validProtocols = ['http:', 'https:', 'rtmp:', 'rtsp:'];
  try {
    const urlObj = new URL(channel.url);
    if (!validProtocols.includes(urlObj.protocol)) {
      return { valid: false, error: 'Unsupported protocol' };
    }
  } catch {
    return { valid: false, error: 'Invalid URL' };
  }

  return { valid: true };
}