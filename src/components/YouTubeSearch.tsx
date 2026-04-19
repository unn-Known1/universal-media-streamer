import React, { useState, useCallback } from 'react';
import { Search, Play, Loader2, ExternalLink, Youtube, AlertCircle, Clock, Eye } from 'lucide-react';
import { usePlayer } from '../contexts/PlayerContext';

interface VideoResult {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  duration: string;
  viewCount: string;
  publishedTime: string;
}

export function YouTubeSearch() {
  const { loadMedia, showToast } = usePlayer();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<VideoResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Extract YouTube video ID from various URL formats
  const extractVideoId = (input: string): string | null => {
    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
    const patterns = [
      /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // Fetch video info from YouTube oEmbed API
  const fetchVideoInfo = async (videoId: string): Promise<VideoResult> => {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oembedUrl);
    if (!response.ok) throw new Error('Failed to fetch');
    const data = await response.json();
    return {
      videoId,
      title: data.title || 'YouTube Video',
      channelTitle: data.author_name || 'Unknown',
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      duration: '',
      viewCount: '',
      publishedTime: '',
    };
  };

  // Search using YouTube's autocomplete/suggest API with JSONP
  const searchYouTube = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      // Check if it's a URL first
      const videoId = extractVideoId(searchQuery);
      if (videoId) {
        const info = await fetchVideoInfo(videoId);
        setResults([info]);
        return;
      }

      // Search using Google search API (no CORS issues)
      const response = await fetch(
        `https://www.google.com/search?q=${encodeURIComponent(searchQuery + ' site:youtube.com')}&num=10&format=json`
      ).catch(() => null);

      // Fallback: Use YouTube's suggestions JSONP endpoint
      const suggestionUrl = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(searchQuery)}&callback=?`;

      // Create a JSONP request manually
      const jsonpResults = await new Promise<any>((resolve, reject) => {
        const callbackName = 'ytSearchCallback';
        const script = document.createElement('script');
        script.src = suggestionUrl.replace('callback=?', `callback=${callbackName}`);

        (window as any)[callbackName] = (data: any) => {
          delete (window as any)[callbackName];
          document.body.removeChild(script);
          resolve(data);
        };

        script.onerror = () => {
          delete (window as any)[callbackName];
          document.body.removeChild(script);
          reject(new Error('JSONP failed'));
        };

        document.body.appendChild(script);

        // Timeout after 5 seconds
        setTimeout(() => {
          if ((window as any)[callbackName]) {
            delete (window as any)[callbackName];
            document.body.removeChild(script);
            reject(new Error('Timeout'));
          }
        }, 5000);
      });

      // Parse JSONP results and get suggestions
      const suggestions: string[] = jsonpResults[1] || [];

      if (suggestions.length > 0) {
        // For each suggestion, we'll show it as a clickable option
        // The user can then use the URL tab to paste the actual YouTube link
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;

        // Create mock results for display (actual search happens externally)
        setResults([{
          videoId: `search:${searchQuery}`,
          title: `Search results for "${searchQuery}"`,
          channelTitle: 'Click "Open YouTube Search" below',
          thumbnailUrl: '',
          duration: '',
          viewCount: '',
          publishedTime: '',
        }]);

        showToast('Click "Open YouTube Search" to see results', 'success');
      }
    } catch (err) {
      console.error('Search error:', err);

      // Final fallback: Open YouTube search directly
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
      window.open(searchUrl, '_blank');
      showToast('Opening YouTube search in new tab', 'info');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchYouTube(query);
  };

  const handlePlayVideo = (video: VideoResult) => {
    // Check if it's a search result or actual video
    if (video.videoId.startsWith('search:')) {
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
      window.open(searchUrl, '_blank');
      return;
    }

    setPlayingId(video.videoId);
    const youtubeUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
    loadMedia(youtubeUrl, video.title);
    showToast(`Playing: ${video.title}`, 'success');
    setTimeout(() => setPlayingId(null), 2000);
  };

  const handleOpenYouTubeSearch = () => {
    if (query.trim()) {
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
      window.open(searchUrl, '_blank');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') searchYouTube(query);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Search Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
          <Youtube className="w-6 h-6 text-red-500" />
          <span className="font-semibold text-red-400">YouTube Search</span>
        </div>
        <span className="text-sm text-slate-500">Search or paste URL to play</span>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="relative mb-6">
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <Search className="w-5 h-5 text-slate-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search videos or paste YouTube URL..."
          className="w-full h-14 pl-12 pr-36 rounded-2xl bg-dark-700/50 border-2 border-white/10 focus:border-red-500/50 focus:ring-4 focus:ring-red-500/10 outline-none transition-all"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="h-10 px-4 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </button>
        </div>
      </form>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-red-500 mb-4" />
          <p className="text-slate-400">Searching...</p>
        </div>
      )}

      {/* Search Results */}
      {!isLoading && results.length > 0 && (
        <div className="space-y-3">
          {results.map((video, index) => (
            <div
              key={`${video.videoId}-${index}`}
              className="flex gap-4 p-4 rounded-2xl bg-dark-700/50 border border-white/10 hover:border-red-500/30 transition-all group"
            >
              {video.thumbnailUrl ? (
                <div className="relative flex-shrink-0">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-48 h-28 object-cover rounded-xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="w-48 h-28 flex-shrink-0 rounded-xl bg-dark-700 flex items-center justify-center">
                  <Youtube className="w-10 h-10 text-slate-500" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white line-clamp-2 mb-1 group-hover:text-red-400 transition-colors">
                  {video.title}
                </h3>
                <p className="text-sm text-slate-400 mb-1">{video.channelTitle}</p>
                {video.duration && (
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {video.viewCount || '0 views'}
                    </span>
                    {video.publishedTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {video.publishedTime}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-center gap-2">
                {video.videoId.startsWith('search:') ? (
                  <button
                    onClick={handleOpenYouTubeSearch}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 transition-all font-semibold text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open YouTube Search
                  </button>
                ) : (
                  <button
                    onClick={() => handlePlayVideo(video)}
                    disabled={playingId === video.videoId}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:opacity-50 transition-all font-semibold text-sm"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Play
                  </button>
                )}
                <a
                  href={`https://youtube.com/watch?v=${video.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-dark-600 hover:bg-white/10 transition-colors text-xs text-slate-400 hover:text-white"
                >
                  <ExternalLink className="w-3 h-3" />
                  YouTube
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && results.length === 0 && (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-dark-700 flex items-center justify-center">
            <Search className="w-10 h-10 text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-300 mb-2">Search YouTube</h3>
          <p className="text-slate-500 mb-4">Enter a search term or paste a YouTube URL</p>

          {/* Popular Categories */}
          <div className="mt-6">
            <p className="text-sm text-slate-500 mb-3">Popular searches:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['Music', 'Gaming', 'News', 'Tech', 'Sports', 'Movies'].map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    setQuery(term);
                    searchYouTube(term);
                  }}
                  className="px-4 py-2 rounded-xl bg-dark-700/50 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all text-sm text-slate-400 hover:text-white"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Supported Formats Help */}
      <div className="mt-8 p-4 rounded-xl bg-dark-700/30 border border-white/5">
        <h4 className="font-medium text-slate-300 mb-3">Quick access:</h4>
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