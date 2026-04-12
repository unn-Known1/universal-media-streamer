# Universal Media Streamer - Specification

## Project Overview
- **Project Name**: Universal Media Streamer
- **Type**: Web-based streaming platform / PWA
- **Core Functionality**: A versatile media player that accepts any media link (direct URLs, HLS, DASH, YouTube, IPTV, etc.) and plays them seamlessly with a modern, feature-rich interface
- **Target Users**: Content creators, streamers, educators, IPTV users, and anyone who needs to play various media formats from different sources

## Technology Stack
- **Frontend Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + custom CSS for player
- **Video Player**: Video.js with HLS.js and DASH.js plugins
- **State Management**: React Context + localStorage
- **Icons**: Lucide React
- **PWA**: Vite PWA Plugin
- **Animations**: Framer Motion

## Visual & Rendering Specification

### Theme & Colors
- **Primary Background**: #0a0a0f (deep space black)
- **Secondary Background**: #141420 (card backgrounds)
- **Accent Color**: #6366f1 (indigo) - customizable
- **IPTV Accent**: #8b5cf6 (violet) - for IPTV-specific elements
- **Success**: #22c55e
- **Warning**: #f59e0b
- **Error**: #ef4444
- **Text Primary**: #f8fafc
- **Text Secondary**: #94a3b8
- **Glass Effect**: rgba(255, 255, 255, 0.05) with backdrop-blur

### Typography
- **Font Family**: "Plus Jakarta Sans" (headings), system-ui (body)
- **Headings**: Bold, tracking tight
- **Body**: Regular, 1.6 line-height

### Layout
- **Main Container**: Full viewport, dark cinematic theme
- **Sidebar**: Collapsible, 320px width
- **Player Area**: Responsive, 16:9 aspect ratio maintained
- **Controls Bar**: Glass-morphism, auto-hide after 3s inactivity

## Feature List

### 1. Media Input System
- Universal URL paste with auto-detection of format
- Supported formats: MP4, WebM, MKV, HLS (.m3u8), DASH (.mpd), YouTube, Vimeo, Google Drive, Dropbox, IPTV M3U/M3U8
- URL validation with visual feedback
- Recent URLs history (localStorage, max 20 items)
- Bookmarks/favorites with custom names
- Drag-and-drop file support
- **Smart URL Detection**: Paste any webpage URL and click "Scan" to automatically find all playable video/audio sources embedded in that page
- **Direct Cast Option**: Cast media directly to Chromecast, AirPlay, or DLNA devices

### 2. IPTV Support (NEW)
- **M3U/M3U8 Playlist Loading**: Paste any IPTV playlist URL to load all channels
- **Channel Categorization**: Automatic grouping by category/group-title
- **Channel Logos**: Display logos when available in playlist metadata
- **Quick Navigation**: Previous/Next channel buttons in control bar
- **Channel List Modal**: Grid/List view of all channels with search
- **Playlist Persistence**: Recently used playlists saved in localStorage
- **Live Stream Support**: HLS-based live TV streaming with LIVE indicator
- **Channel Info Display**: Show current channel name in player overlay

### 3. Video Player Core
- Video.js-based player with custom skin
- HLS.js for .m3u8 streams (including IPTV)
- DASH.js for .mpd streams
- YouTube embed support via YouTube IFrame API
- Adaptive bitrate streaming

### 4. Player Controls
| Feature | Implementation |
|---------|----------------|
| Play/Pause | Click, Spacebar, K key |
| Seek | Click progress bar, Arrow keys (±5s), J/L (±10s) |
| Volume | Slider, Up/Down arrows, M to mute |
| Playback Speed | 0.25x, 0.5x, 0.75x, 1x, 1.25x, 1.5x, 1.75x, 2x, 3x |
| Quality | Auto + available quality levels |
| Subtitles | Toggle, language selection, styling options |
| Picture-in-Picture | Button + P key |
| Fullscreen | Button + F key + double-click |
| Theater Mode | Button + T key |
| Mini-player | Compact floating mode |
| Skip | ±10s buttons, 0-9 for % seek |
| Loop | Loop video, A-B repeat section |
| Screenshot | Capture frame to PNG |
| Volume Boost | Up to 200% |
| Chapter Markers | Visual markers on timeline |
| **IPTV Navigation** | Previous/Next channel buttons |
| **IPTV Channel List** | Modal with grid/list view |

### 5. Casting & Sharing
- Chromecast support (castbutton)
- DLNA/UPnP local network casting
- WebRTC-based local streaming
- Share URL functionality

### 6. Sidebar Features
- Playlist/queue management
- Recent URLs list
- Bookmarks management
- IPTV playlists management
- Search/filter

### 7. Settings Panel
- Theme: Dark/Light/System
- Player accent color picker
- Default playback speed
- Subtitle preferences
- Keyboard shortcuts reference
- Auto-play next
- Layout density
- IPTV settings (remember last channel, etc.)

### 8. Accessibility
- Full keyboard navigation
- ARIA labels on all controls
- Focus indicators
- Screen reader announcements
- High contrast mode option
- Reduced motion option

### 9. PWA Features
- Installable app
- Offline local file playback
- Background downloads
- Service worker caching

## UI Components

### Header
- Logo with glow effect
- Search bar (filter history/bookmarks)
- Settings gear icon
- Theme toggle
- Install PWA button

### Sidebar
- Toggle button (hamburger icon)
- Tabs: Playlist, History, Bookmarks, IPTV
- Each item: thumbnail placeholder, title, duration, source badge
- Right-click context menu: Play, Add to playlist, Bookmark, Copy URL, Delete
- IPTV tab shows saved playlists with channel count

### Main Player
- Video display area (16:9)
- Loading spinner
- Big play button overlay
- Control bar (glass effect)
- Volume slider
- Progress bar with buffer indicator
- Time display
- Quality badge
- Subtitle display area
- **IPTV Channel Navigator** (when playing IPTV)
- **LIVE badge** (for live streams)
- **IPTV badge** (channel indicator)

### IPTV Channel List Modal
- Header with playlist name and channel count
- Search input for filtering
- Category filter dropdown
- Grid/List view toggle
- Sort options (A-Z, By Group)
- Expandable category sections
- Channel cards with logo, name, and play button
- Channel list items with channel info

### Control Bar Elements
- Play/Pause
- Skip back 10s (disabled for live IPTV)
- Skip forward 10s (disabled for live IPTV)
- Volume + mute
- Current time / Duration
- Progress bar
- Speed selector (disabled for live IPTV)
- Quality selector
- Subtitle toggle
- PiP toggle
- Theater toggle
- Fullscreen
- Cast button
- Screenshot
- Settings
- Loop toggle
- A-B repeat
- **Previous Channel** (IPTV only)
- **Next Channel** (IPTV only)

### Settings Modal
- Tabbed interface
- Appearance tab
- Playback tab
- Subtitles tab
- Keyboard shortcuts reference
- About section

## Interaction Specification

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| Space | Play/Pause |
| K | Play/Pause (alternative) |
| F | Toggle fullscreen |
| T | Theater mode |
| M | Mute/Unmute |
| P | Picture-in-Picture |
| C | Toggle subtitles |
| 0-9 | Seek to 0%-90% |
| ← | Seek -5s |
| → | Seek +5s |
| J | Seek -10s |
| L | Seek +10s |
| ↑ | Volume +5% |
| ↓ | Volume -5% |
| ? | Show shortcuts |

### Touch Gestures
- Single tap: Play/Pause
- Double tap left: Seek -10s
- Double tap right: Seek +10s
- Swipe horizontal: Seek
- Swipe vertical (left): Volume
- Swipe vertical (right): Brightness (if supported)
- Pinch: Zoom (if supported)
- Long press: Show options

### Animations
- Control bar: slide up/down, 200ms ease
- Sidebar: slide in/out, 300ms ease
- Settings modal: fade + scale, 200ms
- Volume/speed popups: fade in, 150ms
- Buffering spinner: continuous rotation
- Progress bar hover: expand height

## Acceptance Criteria

### Must Work
1. ✓ Paste any valid video URL and it plays
2. ✓ HLS (.m3u8) streams play smoothly
3. ✓ DASH (.mpd) streams play smoothly
4. ✓ YouTube URLs embed and play
5. ✓ All player controls function (play, pause, seek, volume, speed, quality, fullscreen, PiP)
6. ✓ Subtitles display when available
7. ✓ Recent history saves and loads from localStorage
8. ✓ Bookmarks save and loads from localStorage
9. ✓ Settings persist across sessions
10. ✓ Responsive on mobile, tablet, desktop
11. ✓ PWA installable
12. ✓ All keyboard shortcuts work
13. ✓ Theme toggle works (dark/light)
14. ✓ **IPTV M3U/M3U8 playlists load correctly**
15. ✓ **IPTV channels display with names and logos**
16. ✓ **IPTV channel switching works**
17. ✓ **IPTV playlists persist in localStorage**

### Should Work
1. ✓ Chromecast button visible and functional
2. ✓ Screenshot captures current frame
3. ✓ Volume boost up to 200%
4. ✓ A-B repeat section
5. ✓ DLNA casting to local devices
6. ✓ **IPTV channel list modal opens and displays**
7. ✓ **IPTV category filtering works**
8. ✓ **IPTV search functionality works**

### Nice to Have
1. Auto-generated captions
2. Watch party mode
3. Remote control companion

### New Features (URL Extraction & Casting)
1. ✓ Scan button appears next to URL input
2. ✓ Clicking Scan opens PlayableSourcesModal with two tabs
3. ✓ Sources tab shows all extracted playable URLs from page
4. ✓ Cast tab shows available casting devices
5. ✓ Each source can be played, copied, or opened
6. ✓ DLNA/UPnP device discovery implemented
7. ✓ Chromecast and AirPlay detection supported

## File Structure
```
universal-media-streamer/
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── package.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Player.tsx
│   │   ├── ControlBar.tsx
│   │   ├── SettingsModal.tsx
│   │   ├── MediaInput.tsx
│   │   ├── PlayableSourcesModal.tsx
│   │   ├── IPTVChannelList.tsx        # NEW
│   │   └── Toast.tsx
│   ├── hooks/
│   │   ├── useLocalStorage.ts
│   │   ├── useMediaSession.ts
│   │   └── useKeyboardShortcuts.ts
│   ├── contexts/
│   │   ├── PlayerContext.tsx           # Updated for IPTV
│   │   └── SettingsContext.tsx
│   ├── utils/
│   │   ├── mediaDetector.ts           # Updated for IPTV
│   │   ├── formatTime.ts
│   │   ├── constants.ts
│   │   ├── urlExtractor.ts
│   │   ├── castUtils.ts
│   │   └── iptvParser.ts               # NEW
│   └── types/
│       └── index.ts                   # Updated for IPTV
└── public/
    └── favicon.ico
```

## IPTV Implementation Details

### M3U Parser
The IPTV parser (`src/utils/iptvParser.ts`) handles:
- Standard M3U format parsing
- Extended M3U (#EXTINF) parsing with attributes:
  - `tvg-id`: Channel ID for EPG
  - `tvg-name`: Channel display name
  - `tvg-logo`: Channel logo URL
  - `group-title`: Channel category
  - `category`: Custom category
- URL validation and filtering
- Playlist name extraction
- Channel grouping by category
- Search functionality

### State Management
IPTV state is managed through:
- `playerState.isIPTV`: Boolean flag for IPTV mode
- `playerState.currentPlaylist`: Current IPTVPlaylist
- `playerState.currentChannelIndex`: Current channel position
- localStorage for persistent playlists

### Player Integration
- IPTV streams use HLS.js like regular HLS
- Control bar adapts for IPTV (disabled seeking, channel navigation)
- LIVE indicator shows for duration-less streams
- Channel name displayed in player overlay

## Design System

### Color Palette
- **Primary**: #6366f1 (indigo)
- **IPTV Accent**: #8b5cf6 (violet)
- **Success**: #22c55e (green)
- **Warning**: #f59e0b (amber)
- **Error**: #ef4444 (red)
- **Background**: #0a0a0f (dark)
- **Surface**: #141420 (card)
- **Text Primary**: #f8fafc
- **Text Secondary**: #94a3b8

### IPTV Specific Colors
- **IPTV Badge**: Violet background (#8b5cf6)
- **LIVE Indicator**: Red (#ef4444)
- **Channel Navigator**: Violet gradient
- **IPTV Tab**: Violet accent in sidebar

### Responsive Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px