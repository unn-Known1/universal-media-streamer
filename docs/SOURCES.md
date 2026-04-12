# Supported Streaming Sources

This guide covers all supported streaming sources and how to use them.

## Supported Sources Overview

| Source | Extension/URL Pattern | Player Used |
|--------|---------------------|-------------|
| Direct Video | .mp4, .webm, .mkv, .avi, .mov | Native HTML5 |
| HLS | .m3u8 | HLS.js |
| DASH | .mpd | DASH.js |
| YouTube | youtube.com, youtu.be | Embed/YouTube IFrame |
| Vimeo | vimeo.com | Embed/Vimeo Player |
| Dailymotion | dailymotion.com | Embed/Dailymotion Player |
| Google Drive | drive.google.com | Direct Link Extraction |
| Dropbox | dropbox.com | Direct Link Extraction |

## Direct Video Files

### Supported Formats

- **MP4** - Most widely supported
- **WebM** - Modern web format
- **MKV** - Matroska container
- **AVI** - Older container format
- **MOV** - QuickTime format

### Usage

Simply paste the direct URL to the video file:

```
https://example.com/video.mp4
```

### Notes

- Direct links must be publicly accessible
- CORS headers may affect playback
- Large files may take time to buffer

## HLS Streaming (.m3u8)

### What is HLS?

HTTP Live Streaming (HLS) is a protocol developed by Apple for adaptive bitrate streaming.

### Usage

Paste the .m3u8 URL directly:

```
https://example.com/stream/playlist.m3u8
```

### Features

- **Adaptive Bitrate** - Quality automatically adjusts based on bandwidth
- **Quality Selection** - Manual quality control available
- **Seek Support** - Navigate to any point in the stream

### Example .m3u8 URL

```
https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8
```

## DASH Streaming (.mpd)

### What is DASH?

Dynamic Adaptive Streaming over HTTP (DASH) is an adaptive bitrate streaming protocol.

### Usage

Paste the .mpd URL:

```
https://example.com/stream/manifest.mpd
```

### Features

- **Multiple Bitrates** - Seamless quality switching
- **Periods** - Support for multiple content periods
- **DRM Support** - Content protection (future enhancement)

### Example .mpd URL

```
https://dash.akamaized.net/akamai/bbb_30fps/bbb.mpd
```

## YouTube

### Supported URL Formats

- `https://youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://youtube.com/embed/VIDEO_ID`
- `https://youtube.com/v/VIDEO_ID`

### Usage

Paste any YouTube URL - the player automatically detects and extracts the stream.

### Features

- **Playback Controls** - Full control over playback
- **Quality Selection** - Choose from available qualities
- **Subtitles** - Use YouTube's caption system

### Notes

- Some YouTube videos may have regional restrictions
- Embedding must be enabled for the video

## Vimeo

### Supported URL Formats

- `https://vimeo.com/VIDEO_ID`
- `https://player.vimeo.com/video/VIDEO_ID`

### Usage

Paste the Vimeo URL directly:

```
https://vimeo.com/123456789
```

### Features

- **HD Streaming** - High quality playback
- **Privacy Controls** - Respects privacy settings

## Dailymotion

### Supported URL Formats

- `https://dailymotion.com/video/VIDEO_ID`
- `https://dailymotion.com/embed/video/VIDEO_ID`

## Google Drive

### Usage

1. Open the video in Google Drive
2. Click "Share" -> "Copy link"
3. Paste the link in the player

The player will automatically extract the direct video URL.

### Notes

- Video must be publicly shared
- Only supports direct video playback
- Large files may have buffering issues

## Dropbox

### Usage

1. Open the video in Dropbox
2. Click "Share" -> "Copy link"
3. Paste the link in the player (change `?dl=0` to `?raw=1`)

### Notes

- Video must have link sharing enabled
- Direct links require `?raw=1` parameter

## URL Detection Feature

The player can scan webpages for embedded media sources:

1. Enter any webpage URL
2. The player will detect:
   - `<video>` elements
   - `<iframe>` embeds
   - `<source>` tags
   - Data attributes with media URLs

### Usage

```
https://example.com/page-with-videos.html
```

## Troubleshooting

### CORS Errors

If you see CORS errors:
- The server must send proper `Access-Control-Allow-Origin` headers
- Some CDNs provide CORS support
- Consider using a proxy service

### Invalid URL

- Check the URL is correct and complete
- Ensure the resource is publicly accessible
- Verify the file format is supported

### Playback Fails

- Check browser console for errors
- Try a different browser
- Verify internet connection

## Adding New Sources

To add support for a new streaming source:

1. Create a URL pattern matcher in `src/utils/`
2. Add stream extraction logic
3. Test with multiple URLs
4. Update this documentation

## Need Help?

- Check the [Issue Tracker](https://github.com/unn-Known1/universal-media-streamer/issues)
- Open a new issue for unsupported sources
- Review existing issues for workarounds