import React, { useState, useRef, useCallback } from 'react';
import {
  Play,
  Link,
  FileVideo,
  Loader2,
  AlertCircle,
  CheckCircle,
  Upload,
  Bookmark,
  ListPlus,
  Search,
  Monitor,
  Clipboard,
  Tv,
  List,
} from 'lucide-react';
import { usePlayer } from '../contexts/PlayerContext';
import { useSettings } from '../contexts/SettingsContext';
import { validateUrl, detectMediaType, getMediaTypeLabel, getMediaTypeColor } from '../utils/mediaDetector';
import { PlayableSourcesModal } from './PlayableSourcesModal';
import { IPTVChannelList, IPTVChannelListLoading } from './IPTVChannelList';
import { loadIPTVPlaylist, parseM3U, looksLikeMediaPlaylist } from '../utils/iptvParser';
import { IPTVChannel, IPTVPlaylist } from '../types';

export function MediaInput() {
  const { loadMedia, loadIPTVChannel, addBookmark, addToPlaylist, showToast, iptvPlaylists, addIPTVPlaylist, removeIPTVPlaylist, playerState } = usePlayer();
  const { settings, updateSettings } = useSettings();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validation, setValidation] = useState<{ valid: boolean; message?: string }>({ valid: true });
  const [isDragging, setIsDragging] = useState(false);
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  const [sourcesModalTab, setSourcesModalTab] = useState<'sources' | 'cast'>('sources');

  // IPTV specific state
  const [showIPTVList, setShowIPTVList] = useState(false);
  const [currentPlaylist, setCurrentPlaylist] = useState<IPTVPlaylist | null>(null);
  const [isLoadingPlaylist, setIsLoadingPlaylist] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrl(value);

    if (value.trim()) {
      const result = validateUrl(value);
      if (result.valid) {
        const type = detectMediaType(value);
        setValidation({
          valid: true,
          message: `Detected: ${getMediaTypeLabel(type)}`,
        });
      } else {
        setValidation({ valid: false, message: result.error });
      }
    } else {
      setValidation({ valid: true });
    }
  };

  const playMediaUrl = (mediaUrl: string, mediaTitle?: string) => {
    setIsLoading(true);
    setTimeout(() => {
      loadMedia(mediaUrl.trim(), mediaTitle?.trim() || undefined);
      setUrl('');
      setTitle('');
      setValidation({ valid: true });
      setIsLoading(false);
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      showToast('Please enter a media URL', 'error');
      return;
    }

    const result = validateUrl(url);
    if (!result.valid) {
      showToast(result.error || 'Invalid URL', 'error');
      return;
    }

    const mediaType = detectMediaType(url);

    // IPTV playlists end in .m3u8, which is also the HLS extension.
    // Fetch the content to decide: media playlists play directly,
    // channel playlists open the IPTV channel list.
    if (mediaType === 'iptv' || mediaType === 'hls') {
      const handled = await handlePlaylistOrStream(url);
      if (handled) return;
    }

    // If it's not a direct playable source, show the sources modal
    if (mediaType === 'unknown' || (!url.includes('.mp4') && !url.includes('.webm') && !url.includes('.m3u8') && !url.includes('.mpd') && !url.includes('youtube') && !url.includes('youtu.be') && !url.includes('vimeo') && !url.includes('twitch'))) {
      setShowSourcesModal(true);
      return;
    }

    playMediaUrl(url, title);
  };

  const handlePlaylistOrStream = async (playlistUrl: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const playlist = await loadIPTVPlaylist(playlistUrl);
      if (playlist.isMediaPlaylist || playlist.channels.length === 0) {
        // It's a single media stream (HLS), not an IPTV channel list
        loadMedia(playlistUrl, title.trim() || undefined);
        setUrl('');
        setTitle('');
        setValidation({ valid: true });
        return true;
      }
      setCurrentPlaylist(playlist);
      addIPTVPlaylist(playlist);
      updateSettings({ iptvLastPlaylist: playlistUrl });
      setShowIPTVList(true);
      showToast(`Loaded ${playlist.channels.length} channels from ${playlist.name}`, 'success');
      return true;
    } catch (error) {
      // If it fails to parse as a playlist, try playing it directly as HLS
      showToast('Not an IPTV playlist, attempting direct playback', 'info');
      loadMedia(playlistUrl, title.trim() || undefined);
      setUrl('');
      setTitle('');
      setValidation({ valid: true });
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanForSources = () => {
    if (!url.trim()) {
      showToast('Please enter a URL first', 'error');
      return;
    }
    setSourcesModalTab('sources');
    setShowSourcesModal(true);
  };

  const handleCastDevices = () => {
    if (!url.trim()) {
      showToast('Please enter a URL first', 'error');
      return;
    }
    setSourcesModalTab('cast');
    setShowSourcesModal(true);
  };

  const handleSourceSelect = (sourceUrl: string) => {
    loadMedia(sourceUrl);
    setUrl('');
    setTitle('');
    setValidation({ valid: true });
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('video/') || file.type.startsWith('audio/') || file.name.match(/\.(m3u8?|mpd)$/i)) {
        if (file.name.match(/\.(m3u8?)$/i)) {
          // Local IPTV/HLS playlist
          const reader = new FileReader();
          reader.onload = () => {
            const content = reader.result as string;
            const channels = parseM3U(content);
            if (channels.length > 0 && !looksLikeMediaPlaylist(content)) {
              const playlist: IPTVPlaylist = {
                id: `local-${Date.now()}`,
                name: file.name.replace(/\.(m3u8?)$/i, ''),
                url: URL.createObjectURL(file),
                channels,
                addedAt: Date.now(),
              };
              setCurrentPlaylist(playlist);
              addIPTVPlaylist(playlist);
              setShowIPTVList(true);
              showToast(`Loaded ${channels.length} channels from ${file.name}`, 'success');
            } else {
              const blobUrl = URL.createObjectURL(file);
              loadMedia(blobUrl, file.name);
              showToast(`Playing HLS stream: ${file.name}`, 'success');
            }
          };
          reader.readAsText(file);
        } else {
          const blobUrl = URL.createObjectURL(file);
          loadMedia(blobUrl, file.name);
          showToast(`Loaded: ${file.name}`, 'success');
        }
      } else {
        showToast('Please drop a video or audio file', 'error');
      }
    }

    const text = e.dataTransfer.getData('text/plain');
    if (text) {
      const result = validateUrl(text);
      if (result.valid) {
        setUrl(text);
        setTitle('');
        setValidation({ valid: true, message: `Detected: ${getMediaTypeLabel(detectMediaType(text))}` });
        handleSubmitFromText(text);
      }
    }
  }, [addIPTVPlaylist, loadMedia, showToast]);

  const handleSubmitFromText = async (text: string) => {
    const mediaType = detectMediaType(text);
    if (mediaType === 'iptv' || mediaType === 'hls') {
      await handlePlaylistOrStream(text);
      return;
    }
    playMediaUrl(text);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.match(/\.(m3u8?)$/i)) {
        const reader = new FileReader();
        reader.onload = () => {
          const content = reader.result as string;
          const channels = parseM3U(content);
          if (channels.length > 0 && !looksLikeMediaPlaylist(content)) {
            const playlist: IPTVPlaylist = {
              id: `local-${Date.now()}`,
              name: file.name.replace(/\.(m3u8?)$/i, ''),
              url: URL.createObjectURL(file),
              channels,
              addedAt: Date.now(),
            };
            setCurrentPlaylist(playlist);
            addIPTVPlaylist(playlist);
            setShowIPTVList(true);
            showToast(`Loaded ${channels.length} channels from ${file.name}`, 'success');
          } else {
            const blobUrl = URL.createObjectURL(file);
            loadMedia(blobUrl, file.name);
            showToast(`Playing HLS stream: ${file.name}`, 'success');
          }
        };
        reader.readAsText(file);
      } else if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
        const blobUrl = URL.createObjectURL(file);
        loadMedia(blobUrl, file.name);
        showToast(`Loaded: ${file.name}`, 'success');
      } else {
        showToast('Please select a video, audio, or M3U/M3U8 file', 'error');
      }
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        const result = validateUrl(text);
        if (result.valid) {
          const type = detectMediaType(text);
          setValidation({
            valid: true,
            message: `Detected: ${getMediaTypeLabel(type)}`,
          });
        } else {
          setValidation({ valid: false, message: result.error });
        }
        inputRef.current?.focus();
      }
    } catch (error) {
      showToast('Unable to paste from clipboard', 'error');
    }
  };

  // IPTV Channel handlers
  const handleSelectIPTVChannel = (channel: IPTVChannel) => {
    if (currentPlaylist) {
      const index = currentPlaylist.channels.findIndex(ch => ch.id === channel.id);
      loadIPTVChannel(channel, currentPlaylist, index);
    }
  };

  const handlePlayIPTVChannel = (channel: IPTVChannel) => {
    if (currentPlaylist) {
      const index = currentPlaylist.channels.findIndex(ch => ch.id === channel.id);
      loadIPTVChannel(channel, currentPlaylist, index);
      setShowIPTVList(false);
    }
  };

  const loadSavedPlaylist = async (playlist: IPTVPlaylist) => {
    setIsLoading(true);
    try {
      if (playlist.url.startsWith('blob:')) {
        // Locally imported playlist - reuse cached content
        const refreshed = await loadIPTVPlaylist(playlist.url).catch(() => null);
        if (refreshed && !refreshed.isMediaPlaylist) {
          setCurrentPlaylist(refreshed);
          setShowIPTVList(true);
          showToast(`Loaded ${refreshed.channels.length} channels`, 'success');
          return;
        }
        // Fall back to the cached copy
        setCurrentPlaylist(playlist);
        setShowIPTVList(true);
        showToast(`Loaded ${playlist.channels.length} channels`, 'success');
        return;
      }
      const refreshed = await loadIPTVPlaylist(playlist.url);
      setCurrentPlaylist(refreshed);
      addIPTVPlaylist(refreshed);
      setShowIPTVList(true);
      showToast(`Loaded ${refreshed.channels.length} channels`, 'success');
    } catch (error) {
      showToast('Failed to load playlist', 'error');
      // Remove invalid playlist from saved playlists
      removeIPTVPlaylist(playlist.id);
    } finally {
      setIsLoading(false);
    }
  };

  const mediaType = url.trim() ? detectMediaType(url) : null;
  const isIPTV = mediaType === 'iptv';
  const currentChannel = playerState.isIPTV ? (playerState.currentMedia as IPTVChannel) : null;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* IPTV Channel List Modal */}
      {currentPlaylist && (
        <IPTVChannelList
          playlist={currentPlaylist}
          currentChannel={currentChannel}
          isOpen={showIPTVList}
          onClose={() => setShowIPTVList(false)}
          onSelectChannel={handleSelectIPTVChannel}
          onPlayChannel={handlePlayIPTVChannel}
        />
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <IPTVChannelListLoading />
      )}

      {/* Sources Modal */}
      <PlayableSourcesModal
        isOpen={showSourcesModal}
        onClose={() => setShowSourcesModal(false)}
        url={url}
        initialTab={sourcesModalTab}
        onSelectSource={handleSourceSelect}
      />

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* URL Input */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <Link className="w-5 h-5 text-slate-400" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={url}
            onChange={handleUrlChange}
            placeholder="Paste video URL, HLS/DASH stream, YouTube, Vimeo, Twitch, or M3U/M3U8 IPTV playlist..."
            className={`w-full h-14 pl-12 pr-48 rounded-2xl bg-dark-700/50 border-2 transition-all outline-none ${
              validation.valid
                ? 'border-white/10 focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/10'
                : 'border-red-500/50 focus:border-red-500'
            }`}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {/* Paste Button */}
            <button
              type="button"
              onClick={handlePaste}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
              title="Paste from clipboard"
            >
              <Clipboard className="w-5 h-5" />
            </button>
            {url.trim() && (
              <>
                {validation.valid && mediaType ? (
                  <span
                    className="px-2 py-1 text-xs font-medium rounded-lg"
                    style={{
                      backgroundColor: `${getMediaTypeColor(mediaType)}20`,
                      color: getMediaTypeColor(mediaType),
                    }}
                  >
                    {getMediaTypeLabel(mediaType)}
                  </span>
                ) : !validation.valid ? (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                ) : null}
              </>
            )}
          </div>
        </div>

        {/* Validation Message */}
        {validation.message && (
          <div
            className={`flex items-center gap-2 px-4 text-sm ${
              validation.valid ? 'text-slate-400' : 'text-red-400'
            }`}
          >
            {validation.valid ? (
              <CheckCircle className="w-4 h-4 text-primary-400" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {validation.message}
          </div>
        )}

        {/* Title Input (optional) */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <FileVideo className="w-5 h-5 text-slate-400" />
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="w-full h-12 pl-12 pr-4 rounded-xl bg-dark-700/30 border border-white/5 focus:border-primary-500/50 outline-none transition-all text-sm"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 flex-wrap">
          <button
            type="submit"
            disabled={isLoading || !url.trim() || !validation.valid}
            className="flex-1 h-12 min-w-[120px] rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary-500/25"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Play className="w-5 h-5 fill-white" />
                {isIPTV ? 'Load IPTV' : 'Play Media'}
              </>
            )}
          </button>

          {/* IPTV Button */}
          <button
            type="button"
            onClick={() => isIPTV ? setShowIPTVList(true) : handleScanForSources()}
            disabled={!url.trim() || !isIPTV}
            className="h-12 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-lg shadow-violet-500/25"
            title={isIPTV ? 'Open IPTV Channels' : 'Scan for playable sources'}
          >
            <Tv className="w-5 h-5" />
            {isIPTV && <List className="w-4 h-4" />}
          </button>

          {/* Scan for Sources Button */}
          <button
            type="button"
            onClick={handleScanForSources}
            disabled={!url.trim()}
            className="h-12 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-lg shadow-amber-500/25"
            title="Scan for playable sources"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Cast Button */}
          <button
            type="button"
            onClick={handleCastDevices}
            disabled={!url.trim()}
            className="h-12 px-4 rounded-xl bg-dark-700/50 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Cast to Device"
          >
            <Monitor className="w-5 h-5" />
          </button>

          {url.trim() && validation.valid && (
            <>
              <button
                type="button"
                onClick={() => {
                  const type = detectMediaType(url);
                  const mediaItem = {
                    id: `${Date.now()}`,
                    url: url.trim(),
                    title: title.trim() || url.split('/').pop()?.split('?')[0] || 'Untitled',
                    type,
                    addedAt: Date.now(),
                  };
                  addBookmark(mediaItem);
                }}
                className="h-12 px-4 rounded-xl bg-dark-700/50 hover:bg-white/10 transition-colors"
                title="Add to Bookmarks"
              >
                <Bookmark className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const type = detectMediaType(url);
                  const mediaItem = {
                    id: `${Date.now()}`,
                    url: url.trim(),
                    title: title.trim() || url.split('/').pop()?.split('?')[0] || 'Untitled',
                    type,
                    addedAt: Date.now(),
                  };
                  addToPlaylist(mediaItem);
                }}
                className="h-12 px-4 rounded-xl bg-dark-700/50 hover:bg-white/10 transition-colors"
                title="Add to Playlist"
              >
                <ListPlus className="w-5 h-5" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-12 px-4 rounded-xl bg-dark-700/50 hover:bg-white/10 transition-colors"
            title="Upload File or Playlist"
          >
            <Upload className="w-5 h-5" />
          </button>
        </div>
      </form>

      {/* File Input (hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,audio/*,.m3u,.m3u8"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Saved IPTV Playlists */}
      {iptvPlaylists.length > 0 && (
        <div className="mt-6">
          <p className="text-sm text-slate-500 mb-3 flex items-center gap-2">
            <Tv className="w-4 h-4" />
            Recent IPTV Playlists
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {iptvPlaylists.slice(0, 5).map((playlist) => (
              <button
                key={playlist.id}
                onClick={() => loadSavedPlaylist(playlist)}
                className="flex-shrink-0 px-4 py-2 rounded-xl bg-dark-700/50 hover:bg-white/10 border border-white/5 hover:border-violet-500/30 transition-colors text-sm"
              >
                <span className="font-medium">{playlist.name}</span>
                <span className="text-xs text-slate-500 ml-2">{playlist.channels.length} ch</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`mt-6 border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
          isDragging
            ? 'border-primary-500 bg-primary-500/10'
            : 'border-white/10 hover:border-white/20'
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
            isDragging ? 'bg-primary-500/20' : 'bg-dark-700'
          }`}>
            <Upload className={`w-7 h-7 ${isDragging ? 'text-primary-400' : 'text-slate-400'}`} />
          </div>
          <div>
            <p className="font-medium">
              {isDragging ? 'Drop your file here' : 'Drag & drop a file or URL'}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Supports MP4, WebM, MKV, HLS, DASH, YouTube, Vimeo, Twitch, and IPTV M3U/M3U8 playlists
            </p>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-8">
        <p className="text-sm text-slate-500 mb-3">Supported sources:</p>
        <div className="flex flex-wrap gap-2">
          {[
            'MP4/WebM direct URLs',
            'HLS streams (.m3u8)',
            'DASH streams (.mpd)',
            'YouTube',
            'Vimeo',
            'Twitch',
            'Google Drive',
            'Dropbox',
            'IPTV M3U/M3U8',
          ].map((source) => (
            <button
              key={source}
              onClick={() => {
                setUrl('');
                inputRef.current?.focus();
              }}
              className="px-3 py-1.5 rounded-lg bg-dark-700/50 text-xs text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
            >
              {source}
            </button>
          ))}
        </div>
      </div>

      {/* Info Banners */}
      <div className="mt-6 space-y-3">
        {/* IPTV Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20">
          <div className="flex items-start gap-3">
            <Tv className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-violet-300">IPTV Support</p>
              <p className="text-sm text-slate-400 mt-1">
                Paste an M3U or M3U8 playlist URL to load all TV channels. Supports group titles, channel logos, and EPG data.
              </p>
            </div>
          </div>
        </div>

        {/* URL Detection Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
          <div className="flex items-start gap-3">
            <Search className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-300">Smart URL Detection</p>
              <p className="text-sm text-slate-400 mt-1">
                Paste any webpage URL and click <span className="text-amber-400 font-medium">Scan</span> to automatically find all playable video/audio sources embedded in that page, including HLS streams, DASH manifests, and direct video files.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}