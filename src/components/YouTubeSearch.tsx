import React, { useState, useCallback } from 'react';
import { Search, Play, Loader2, ExternalLink, Youtube, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { usePlayer } from '../contexts/PlayerContext';

interface VideoInfo {
  videoId: string;
  title: string;
  thumbnailUrl: string;
}

export function YouTubeSearch() {
  const { loadMedia, showToast } = usePlayer();
  const [query, setQuery] = useState('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Extract YouTube video ID from various URL formats
  const extractVideoId = (input: string): string | null => {
    // Direct video ID (11 characters)
    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
      return input;
    }

    // Standard watch URL: youtube.com/watch?v=VIDEO_ID
    const watchMatch = input.match(/youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) return watchMatch[1];

    // Short URL: youtu.be/VIDEO_ID
    const shortMatch = input.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) return shortMatch[1];

    // Embed URL: youtube.com/embed/VIDEO_ID
    const embedMatch = input.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch) return embedMatch[1];

    // Live URL: youtube.com/live/VIDEO_ID
    const liveMatch = input.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/);
    if (liveMatch) return liveMatch[1];

    // Shorts URL: youtube.com/shorts/VIDEO_ID
    const shortsMatch = input.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch) return shortsMatch[1];

    // Batch conversion URL
    const batchMatch = input.match(/youtube\.com\/batch\/([a-zA-Z0-9_-]{11})/);
    if (batchMatch) return batchMatch[1];

    return null;
  };

  // Fetch video info from YouTube oEmbed API (CORS friendly)
  const fetchVideoInfo = async (videoId: string): Promise<VideoInfo> => {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oembedUrl);

    if (!response.ok) {
      throw new Error('Failed to fetch video info');
    }

    const data = await response.json();
    return {
      videoId,
      title: data.title || 'YouTube Video',
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    };
  };

  // Search by parsing YouTube search results (no API needed)
  const searchYouTube = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    setVideoInfo(null);

    try {
      const videoId = extractVideoId(searchQuery);

      if (videoId) {
        // It's a YouTube URL or video ID
        const info = await fetchVideoInfo(videoId);
        setVideoInfo(info);
        setError(null);
      } else {
        // It's a search query - convert to YouTube search URL
        // Use YouTube's native search with no external API
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;

        // Since we can't fetch YouTube directly due to CORS,
        // we'll provide the URL and let the user copy it
        setError(`Search URL: ${searchUrl}`);
        showToast('Opening YouTube search...', 'success');

        // Open in new tab as fallback
        window.open(searchUrl, '_blank');
      }
    } catch (err) {
      console.error('YouTube error:', err);
      setError('Failed to load video. Please check the URL.');
      showToast('Failed to load YouTube video', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchYouTube(query);
  };

  const handlePlayVideo = () => {
    if (!videoInfo) return;

    setPlayingId(videoInfo.videoId);
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoInfo.videoId}`;
    loadMedia(youtubeUrl, videoInfo.title);
    showToast(`Playing: ${videoInfo.title}`, 'success');
    setTimeout(() => setPlayingId(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchYouTube(query);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Search Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
          <Youtube className="w-6 h-6 text-red-500" />
          <span className="font-semibold text-red-400">YouTube</span>
        </div>
        <span className="text-sm text-slate-500">Paste URL or video ID to play</span>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="relative mb-6">
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <LinkIcon className="w-5 h-5 text-slate-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste YouTube URL or video ID (e.g., dQw4w9WgXcQ)"
          className="w-full h-14 pl-12 pr-32 rounded-2xl bg-dark-700/50 border-2 border-white/10 focus:border-red-500/50 focus:ring-4 focus:ring-red-500/10 outline-none transition-all"
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-6 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold flex items-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Search className="w-5 h-5" />
              Load
            </>
          )}
        </button>
      </form>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          </div>
          <p className="text-slate-400">Loading YouTube video...</p>
        </div>
      )}

      {/* Error Message */}
      {error && !isLoading && !videoInfo && (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-red-400 mb-2">Invalid YouTube URL</p>
          <p className="text-slate-500 text-sm">Please paste a valid YouTube URL or 11-character video ID</p>
        </div>
      )}

      {/* Video Preview */}
      {videoInfo && !isLoading && (
        <div className="flex gap-4 p-4 rounded-2xl bg-dark-700/50 border border-white/10">
          {/* Thumbnail */}
          <div className="relative flex-shrink-0">
            <img
              src={videoInfo.thumbnailUrl}
              alt={videoInfo.title}
              className="w-48 h-28 object-cover rounded-xl"
            />
            {playingId === videoInfo.videoId && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white line-clamp-2 mb-2">
              {videoInfo.title}
            </h3>
            <p className="text-sm text-slate-400 mb-2">Video ID: {videoInfo.videoId}</p>
          </div>

          {/* Actions */}
          <div className="flex flex-col justify-center gap-2">
            <button
              onClick={handlePlayVideo}
              disabled={playingId === videoInfo.videoId}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
            >
              <Play className="w-5 h-5 fill-white" />
              Play Now
            </button>
            <a
              href={`https://youtube.com/watch?v=${videoInfo.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 px-4 py-2 rounded-lg bg-dark-600 hover:bg-white/10 transition-colors text-sm text-slate-400 hover:text-white"
            >
              <ExternalLink className="w-4 h-4" />
              YouTube
            </a>
          </div>
        </div>
      )}

      {/* Supported URL Formats */}
      <div className="mt-8 p-4 rounded-xl bg-dark-700/30 border border-white/5">
        <h4 className="font-medium text-slate-300 mb-3">Supported YouTube URL Formats:</h4>
        <div className="grid gap-2 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <span className="text-red-400">•</span>
            <code className="bg-dark-700 px-2 py-1 rounded text-xs">https://youtube.com/watch?v=VIDEO_ID</code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-400">•</span>
            <code className="bg-dark-700 px-2 py-1 rounded text-xs">https://youtu.be/VIDEO_ID</code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-400">•</span>
            <code className="bg-dark-700 px-2 py-1 rounded text-xs">https://youtube.com/embed/VIDEO_ID</code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-400">•</span>
            <code className="bg-dark-700 px-2 py-1 rounded text-xs">https://youtube.com/shorts/VIDEO_ID</code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-400">•</span>
            <span className="text-slate-400">Or just paste the 11-character video ID</span>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-6">
        <p className="text-sm text-slate-500 mb-3">Quick access:</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Rick Roll', id: 'dQw4w9WgXcQ' },
            { label: 'Big Buck Bunny', id: 'aqz-KE-bpKQ' },
            { label: 'Elephant Dream', id: 'tAGnKpE4NCI' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setQuery(`https://youtube.com/watch?v=${item.id}`);
                searchYouTube(`https://youtube.com/watch?v=${item.id}`);
              }}
              className="px-4 py-2 rounded-xl bg-dark-700/50 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all text-sm text-slate-400 hover:text-white"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
