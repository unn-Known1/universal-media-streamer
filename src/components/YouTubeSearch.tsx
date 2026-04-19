import React, { useState, useCallback } from 'react';
import { Search, Play, Loader2, Clock, Eye, ExternalLink, Youtube } from 'lucide-react';
import { usePlayer } from '../contexts/PlayerContext';

interface VideoResult {
  videoId: string;
  title: string;
  channelTitle: string;
  description: string;
  thumbnailUrl: string;
  duration: string;
  viewCount: string;
  publishedAt: string;
}

export function YouTubeSearch() {
  const { loadMedia, showToast } = usePlayer();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<VideoResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const formatDuration = (isoDuration: string): string => {
    if (!isoDuration) return '0:00';
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '0:00';
    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const seconds = match[3] ? parseInt(match[3]) : 0;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatViewCount = (views: string): string => {
    if (!views) return '0';
    const num = parseInt(views);
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B views`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M views`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K views`;
    return `${num} views`;
  };

  const formatTimeAgo = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const intervals = [
      { label: 'year', seconds: 31536000 },
      { label: 'month', seconds: 2592000 },
      { label: 'week', seconds: 604800 },
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 },
    ];
    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count >= 1) {
        return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
      }
    }
    return 'Just now';
  };

  const searchYouTube = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://inv.nadeko.net/api/v1/search?q=${encodeURIComponent(searchQuery)}&type=video&filter=video`
      );

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        setResults([]);
        setError('No results found. Try a different search term.');
        return;
      }

      const videos: VideoResult[] = data.slice(0, 20).map((item: any) => ({
        videoId: item.videoId,
        title: item.title || 'Untitled',
        channelTitle: item.author || 'Unknown Channel',
        description: item.description || '',
        thumbnailUrl: item.thumbnailUrls?.[0] || item.thumbnail || `https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`,
        duration: formatDuration(item.duration),
        viewCount: item.viewCount || '0',
        publishedAt: item.published || '',
      }));

      setResults(videos);
    } catch (err) {
      console.error('YouTube search error:', err);
      setError('Search failed. Please try again.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchYouTube(query);
  };

  const handlePlayVideo = (video: VideoResult) => {
    setPlayingId(video.videoId);
    const youtubeUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
    loadMedia(youtubeUrl, video.title);
    showToast(`Playing: ${video.title}`, 'success');
    setTimeout(() => setPlayingId(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchYouTube(query);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
          <Youtube className="w-6 h-6 text-red-500" />
          <span className="font-semibold text-red-400">YouTube Search</span>
        </div>
        <span className="text-sm text-slate-500">Search and play directly</span>
      </div>

      <form onSubmit={handleSearch} className="relative mb-6">
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <Search className="w-5 h-5 text-slate-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search YouTube videos..."
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
              Search
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="text-center py-8">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500 mb-4">{results.length} results found</p>
          {results.map((video) => (
            <div
              key={video.videoId}
              className="flex gap-4 p-4 rounded-2xl bg-dark-700/30 hover:bg-dark-700/50 border border-white/5 hover:border-red-500/20 transition-all group"
            >
              <div className="relative flex-shrink-0">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-48 h-28 object-cover rounded-xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`;
                  }}
                />
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-white text-xs font-medium">
                  {video.duration}
                </div>
                {playingId === video.videoId && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl">
                    <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white line-clamp-2 mb-2 group-hover:text-red-400 transition-colors">
                  {video.title}
                </h3>
                <p className="text-sm text-slate-400 mb-1">{video.channelTitle}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {formatViewCount(video.viewCount)}
                  </span>
                  {video.publishedAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(video.publishedAt)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col justify-center gap-2">
                <button
                  onClick={() => handlePlayVideo(video)}
                  disabled={playingId === video.videoId}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-sm"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Play
                </button>
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

      {!isLoading && results.length === 0 && !error && (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-dark-700 flex items-center justify-center">
            <Youtube className="w-10 h-10 text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-300 mb-2">Search YouTube</h3>
          <p className="text-slate-500">Enter a search term to find videos</p>
        </div>
      )}

      {!isLoading && results.length === 0 && !error && (
        <div className="mt-8">
          <p className="text-sm text-slate-500 mb-3">Popular searches:</p>
          <div className="flex flex-wrap gap-2">
            {['Music videos', 'Documentary', 'Tutorial', 'Gaming', 'News', 'Podcast'].map((term) => (
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
      )}
    </div>
  );
}
