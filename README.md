# Universal Media Streamer

A powerful, feature-rich web-based media player that supports streaming from any source - direct URLs, HLS (.m3u8), DASH (.mpd), YouTube, Vimeo, and more.

## Live Demo

**Test the app:** https://coxf9yb7v5eh.space.minimax.io

## Features

- **Universal URL Support** - Paste any media link:
  - Direct video URLs (MP4, WebM, MKV, AVI, MOV)
  - HLS streams (.m3u8)
  - DASH streams (.mpd)
  - YouTube/Vimeo/Dailymotion embeds
  - Google Drive/Dropbox direct links

- **YouTube Search** - Search YouTube videos directly and play them instantly (with multi-instance fallback)
- **Smart URL Detection** - Scan any webpage to find all playable video/audio sources

- **Player Features**:
  - Playback speed control (0.25x to 3x)
  - Quality selection (Auto + manual)
  - Picture-in-Picture mode
  - Fullscreen & Theater mode
  - Volume boost (up to 200%)
  - Screenshot capture
  - A-B repeat loop
  - Subtitles support

- **Casting**:
  - Chromecast support
  - AirPlay for iOS/Safari
  - DLNA/UPnP for Smart TVs

- **Accessibility**:
  - Full keyboard shortcuts
  - ARIA labels
  - High contrast mode
  - Reduced motion option

- **PWA Support**:
  - Offline capability
  - Installable on home screen
  - Background caching

## Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS
- HLS.js for .m3u8 streaming
- DASH.js for .mpd streaming
- Framer Motion (animations)
- Lucide React (icons)
- Vite PWA plugin

## Quick Start

```bash
# Clone the repository
git clone https://github.com/unn-Known1/universal-media-streamer.git
cd universal-media-streamer

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Build Script

```bash
# Run the build script
bash build.sh
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space / K | Play/Pause |
| F | Fullscreen |
| T | Theater mode |
| M | Mute/Unmute |
| P | Picture-in-Picture |
| C | Toggle captions |
| ← / → | Seek ±5s |
| ↑ / ↓ | Volume ±5% |
| J / L | Seek ±10s |
| 0-9 | Jump to 0%-90% |
| ? | Show shortcuts |

## Project Structure

```
universal-media-streamer/
├── public/
│   ├── favicon.svg
│   └── sw.js              # Service worker
├── src/
│   ├── components/         # React components
│   ├── contexts/           # React contexts (settings, player)
│   ├── hooks/              # Custom hooks
│   ├── utils/              # Utilities and constants
│   ├── types/              # TypeScript types
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── index.html
├── package.json
├── vite.config.ts         # Vite configuration
├── tailwind.config.js     # Tailwind configuration
├── tsconfig.json          # TypeScript configuration
├── build.sh               # Build script
└── README.md
```

## License

MIT License - feel free to use this project for any purpose.
