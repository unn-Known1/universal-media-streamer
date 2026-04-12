# API Reference

This document describes the internal API patterns and utilities used in the Universal Media Streamer.

## Table of Contents

- [Player API](#player-api)
- [URL Parser](#url-parser)
- [Settings API](#settings-api)
- [Types](#types)

## Player API

### PlayerContext

The player state is managed through React Context.

```typescript
import { usePlayer } from './src/contexts/PlayerContext';

function MyComponent() {
  const {
    // State
    src,
    isPlaying,
    currentTime,
    duration,
    volume,
    muted,
    playbackRate,
    quality,
    isFullscreen,
    isTheaterMode,
    isPiP,
    error,
    
    // Actions
    play,
    pause,
    seek,
    setVolume,
    setPlaybackRate,
    setQuality,
    toggleFullscreen,
    toggleTheaterMode,
    togglePiP,
  } = usePlayer();
}
```

### Player State

| Property | Type | Description |
|----------|------|-------------|
| `src` | `string \| null` | Current media source URL |
| `isPlaying` | `boolean` | Whether media is playing |
| `currentTime` | `number` | Current playback position in seconds |
| `duration` | `number` | Total media duration in seconds |
| `volume` | `number` | Volume level (0-1) |
| `muted` | `boolean` | Whether audio is muted |
| `playbackRate` | `number` | Playback speed (0.25-3) |
| `quality` | `string` | Current quality level |
| `availableQualities` | `string[]` | Available quality levels |
| `isFullscreen` | `boolean` | Fullscreen mode status |
| `isTheaterMode` | `boolean` | Theater mode status |
| `isPiP` | `boolean` | Picture-in-Picture status |
| `error` | `string \| null` | Error message if any |

### Player Actions

```typescript
// Play media
play(): void

// Pause media  
pause(): void

// Seek to position
seek(time: number): void

// Set volume (0-1)
setVolume(level: number): void

// Toggle mute
toggleMute(): void

// Set playback rate
setPlaybackRate(rate: number): void

// Set quality level
setQuality(level: string): void

// Toggle fullscreen
toggleFullscreen(): void

// Toggle theater mode
toggleTheaterMode(): void

// Toggle picture-in-picture
togglePiP(): void

// Toggle captions
toggleCaptions(): void
```

## URL Parser

### URL Detection

The URL parser automatically detects the type of media source.

```typescript
import { detectMediaType, MediaType } from './src/utils/urlParser';

const type = detectMediaType('https://example.com/video.m3u8');
// Returns: 'hls'

const type = detectMediaType('https://youtube.com/watch?v=abc');
// Returns: 'youtube'
```

### Supported Media Types

```typescript
enum MediaType {
  DIRECT = 'direct',      // Direct video files (.mp4, .webm, etc.)
  HLS = 'hls',           // HLS streams (.m3u8)
  DASH = 'dash',         // DASH streams (.mpd)
  YOUTUBE = 'youtube',   // YouTube videos
  VIMEO = 'vimeo',       // Vimeo videos
  DAILYMOTION = 'dailymotion',
  GOOGLE_DRIVE = 'google-drive',
  DROPBOX = 'dropbox',
  EMBED = 'embed',       // Generic iframe embeds
  UNKNOWN = 'unknown'
}
```

### URL Parser Functions

```typescript
// Detect media type from URL
detectMediaType(url: string): MediaType

// Extract video ID from URL
extractYouTubeId(url: string): string | null
extractVimeoId(url: string): string | null
extractDailymotionId(url: string): string | null

// Extract direct video URL from various services
extractGoogleDriveUrl(url: string): string | null
extractDropboxUrl(url: string): string | null
```

## Settings API

### SettingsContext

User preferences and settings are managed through SettingsContext.

```typescript
import { useSettings } from './src/contexts/SettingsContext';

function MyComponent() {
  const {
    theme,
    showCaptions,
    reducedMotion,
    highContrast,
    keyboardShortcutsEnabled,
    setTheme,
    toggleCaptions,
  } = useSettings();
}
```

### Settings Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `theme` | `'light' \| 'dark' \| 'system'` | `'system'` | Color theme |
| `showCaptions` | `boolean` | `true` | Show closed captions |
| `reducedMotion` | `boolean` | `false` | Reduce animations |
| `highContrast` | `boolean` | `false` | High contrast mode |
| `keyboardShortcutsEnabled` | `boolean` | `true` | Enable keyboard shortcuts |

## Types

### Core Types

```typescript
// Media source configuration
interface MediaSource {
  url: string;
  type: MediaType;
  quality?: string;
  captions?: CaptionTrack[];
}

// Caption/subtitle track
interface CaptionTrack {
  url: string;
  label: string;
  language: string;
  default?: boolean;
}

// Player error
interface PlayerError {
  code: string;
  message: string;
  recoverable: boolean;
}
```

### Hook Types

```typescript
// usePlayer return type
interface UsePlayerReturn {
  state: PlayerState;
  actions: PlayerActions;
  videoRef: RefObject<HTMLVideoElement>;
}

// useSettings return type
interface UseSettingsReturn {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}
```

## Constants

### Playback Rates

```typescript
const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3] as const;
```

### Keyboard Shortcuts

```typescript
const KEYBOARD_SHORTCUTS = {
  PLAY_PAUSE: ['Space', 'k'],
  FULLSCREEN: ['f'],
  THEATER: ['t'],
  MUTE: ['m'],
  PIP: ['p'],
  CAPTIONS: ['c'],
  SEEK_BACK: ['ArrowLeft', 'j'],
  SEEK_FORWARD: ['ArrowRight', 'l'],
  VOLUME_UP: ['ArrowUp'],
  VOLUME_DOWN: ['ArrowDown'],
  SEEK_PERCENT: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
} as const;
```

## Error Codes

| Code | Description | Recoverable |
|------|-------------|--------------|
| `NETWORK_ERROR` | Network connection failed | Yes |
| `PARSE_ERROR` | Failed to parse media | No |
| `NOT_SUPPORTED` | Format not supported | No |
| `CORS_ERROR` | Cross-origin blocked | Sometimes |
| `TIMEOUT` | Request timed out | Yes |

## Need Help?

For API-related questions, open an issue on GitHub.