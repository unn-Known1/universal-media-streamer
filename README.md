# Universal Media Streamer

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Stars](https://img.shields.io/github/stars/unn-Known1/universal-media-streamer?style=social)](https://github.com/unn-Known1/universal-media-streamer/stargazers)
[![Pull Requests Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/unn-Known1/universal-media-streamer/pulls)
[![Last Commit](https://img.shields.io/github/last-commit/unn-Known1/universal-media-streamer)](https://github.com/unn-Known1/universal-media-streamer/commits/main)
[![Contributors](https://img.shields.io/github/contributors/unn-Known1/universal-media-streamer)](https://github.com/unn-Known1/universal-media-streamer/graphs/contributors)

A powerful, feature-rich web-based media player that supports streaming from any source.

</div>

## Live Demo

**Test the app:** [https://2yiw37rebufv.space.minimax.io](https://2yiw37rebufv.space.minimax.io)

## Supported Sources

| Source Type | Extensions/Platforms | Support |
|-------------|---------------------|--------|
| **Direct Video** | MP4, WebM, MKV, AVI, MOV, WMV, FLV, WEBM | ✅ Full |
| **HLS Streaming** | .m3u8 | ✅ Full |
| **DASH Streaming** | .mpd | ✅ Full |
| **IPTV** | M3U/M3U8 Playlists | ✅ Full |
| **YouTube** | youtube.com, youtu.be | ✅ Full |
| **Vimeo** | vimeo.com | ✅ Full |
| **Dailymotion** | dailymotion.com | ✅ Full |
| **Google Drive** | drive.google.com | ✅ Full |
| **Dropbox** | dropbox.com | ✅ Full |

## IPTV Support

The Universal Media Streamer now includes full IPTV support! Load your M3U/M3U8 playlists and watch TV channels directly in the browser.

### Features
- **Load M3U/M3U8 Playlists**: Paste any IPTV playlist URL to load all channels
- **Channel Categorization**: Automatic grouping by category/group
- **Channel Logos**: Display channel logos when available
- **Channel Navigation**: Quick switching between channels
- **Playlist History**: Recently used playlists saved
- **Grid/List View**: Choose your preferred channel display
- **Search**: Find channels quickly by name
- **Live Streaming**: HLS-based live TV support

### Supported IPTV Formats
- Standard M3U playlists
- Extended M3U with #EXTINF metadata
- Group titles (group-title)
- TVG information (tvg-id, tvg-name, tvg-logo)
- Channel logos

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface                          │
│   (React + Tailwind CSS + Framer Motion)                   │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                    URL Processing Layer                      │
│   ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌────────┐ │
│   │ URL Parser│  │ YouTube  │  │  IPTV      │  │ Direct │ │
│   │           │  │ Extractor│  │  Parser    │  │  URLs  │ │
│   └─────┬─────┘  └────┬─────┘  └──────┬─────┘  └───┬────┘ │
└─────────┼────────────┼──────────────┼────────────┼───────┘
          │            │              │            │
┌─────────▼────────────▼──────────────▼────────────▼───────┐
│                      Player Engine                          │
│   ┌──────────┐  ┌──────────┐  ┌────────────┐              │
│   │  HLS.js  │  │ DASH.js  │  │  Native    │              │
│   │          │  │          │  │  HTML5     │              │
│   └──────────┘  └──────────┘  └────────────┘              │
└─────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                      Output Layer                            │
│   ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌────────┐  │
│   │Chromecast│  │ AirPlay  │  │ DLNA/UPnP  │  │  PiP   │  │
│   └──────────┘  └──────────┘  └────────────┘  └────────┘  │
└─────────────────────────────────────────────────────────────┘
```

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

## Features

### Playback
- **Universal URL Support** - Paste any media link from 20+ sources
- **Smart URL Detection** - Scan any webpage to find all playable sources
- **Playback Speed** - 0.25x to 3x speed control
- **Quality Selection** - Auto + manual quality switching
- **Volume Boost** - Up to 200% volume enhancement

### IPTV Features
- **M3U/M3U8 Playlists** - Load and watch IPTV channels
- **Channel Categories** - Browse by category/group
- **Channel Logos** - Visual channel identification
- **Quick Navigation** - Previous/Next channel buttons
- **Live Indicators** - Show live stream status
- **Playlist History** - Quick access to recent playlists

### Advanced
- **Picture-in-Picture** - Floating mini player
- **Theater Mode** - Immersive full-width view
- **Screenshot Capture** - Save current frame as image
- **A-B Repeat Loop** - Loop specific segments

### Casting & Streaming
- **Chromecast** - Cast to TV
- **AirPlay** - iOS/Safari streaming
- **DLNA/UPnP** - Smart TV compatibility

### Accessibility
- **Keyboard Shortcuts** - Full control without mouse
- **ARIA Labels** - Screen reader support
- **High Contrast** - Visibility options
- **Reduced Motion** - Animation control

### PWA
- **Offline Support** - Work without internet
- **Installable** - Add to home screen
- **Background Caching** - Seamless playback

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

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build**: Vite
- **Styling**: Tailwind CSS
- **Streaming**: HLS.js, DASH.js
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **PWA**: Vite PWA Plugin

## Project Structure

```
universal-media-streamer/
├── public/
│   ├── favicon.svg
│   └── sw.js              # Service worker
├── src/
│   ├── components/         # React components
│   │   ├── IPTVChannelList.tsx  # IPTV channel list modal
│   │   └── ...
│   ├── contexts/           # React contexts (settings, player)
│   ├── hooks/              # Custom hooks
│   ├── utils/
│   │   ├── iptvParser.ts   # IPTV M3U parser
│   │   └── ...
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

## Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to get started.

### Ways to Contribute

- 🐛 Report bugs and issues
- 💡 Suggest new features
- 📝 Improve documentation
- 🎨 Add new themes or UI components
- 🔧 Fix bugs and submit PRs

## License

MIT License - feel free to use this project for any purpose.

---

<div align="center">

⭐ Star us on GitHub if you find this useful!

</div>
