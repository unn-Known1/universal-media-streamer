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
} from 'lucide-react';
import { usePlayer } from '../contexts/PlayerContext';
import { validateUrl, detectMediaType, getMediaTypeLabel, getMediaTypeColor } from '../utils/mediaDetector';
import { PlayableSourcesModal } from './PlayableSourcesModal';

export function MediaInput() {
  const { loadMedia, addBookmark, addToPlaylist, showToast } = usePlayer();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validation, setValidation] = useState<{ valid: boolean; message?: string }>({ valid: true });
  const [isDragging, setIsDragging] = useState(false);
  const [showSourcesModal, setShowSourcesModal] = useState(false);
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

    // Check if URL is a direct playable source
    const mediaType = detectMediaType(url);

    // If it's not a direct playable source, show the sources modal
    if (mediaType === 'unknown' || (!url.includes('.mp4') && !url.includes('.webm') && !url.includes('.m3u8') && !url.includes('.mpd') && !url.includes('youtube') && !url.includes('youtu.be') && !url.includes('vimeo'))) {
      setShowSourcesModal(true);
      return;
    }

    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      loadMedia(url.trim(), title.trim() || undefined);
      setUrl('');
      setTitle('');
      setValidation({ valid: true });
    } catch (error) {
      showToast('Failed to load media', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanForSources = () => {
    if (!url.trim()) {
      showToast('Please enter a URL first', 'error');
      return;
    }
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
      if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
        const blobUrl = URL.createObjectURL(file);
        loadMedia(blobUrl, file.name);
        showToast(`Loaded: ${file.name}`, 'success');
      } else {
        showToast('Please drop a video or audio file', 'error');
      }
    }

    const text = e.dataTransfer.getData('text/plain');
    if (text) {
      const result = validateUrl(text);
      if (result.valid) {
        setUrl(text);
        handleSubmit(new Event('submit') as any);
      }
    }
  }, [loadMedia, showToast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
        const blobUrl = URL.createObjectURL(file);
        loadMedia(blobUrl, file.name);
        showToast(`Loaded: ${file.name}`, 'success');
      } else {
        showToast('Please select a video or audio file', 'error');
      }
    }
  };

  const mediaType = url.trim() ? detectMediaType(url) : null;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Sources Modal */}
      <PlayableSourcesModal
        isOpen={showSourcesModal}
        onClose={() => setShowSourcesModal(false)}
        url={url}
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
            placeholder="Paste video URL, HLS/DASH stream, YouTube, Vimeo, or any webpage..."
            className={`w-full h-14 pl-12 pr-36 rounded-2xl bg-dark-700/50 border-2 transition-all outline-none ${
              validation.valid
                ? 'border-white/10 focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/10'
                : 'border-red-500/50 focus:border-red-500'
            }`}
          />
          {url.trim() && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
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
            </div>
          )}
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
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading || !url.trim() || !validation.valid}
            className="flex-1 h-12 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary-500/25"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Play className="w-5 h-5 fill-white" />
                Play Media
              </>
            )}
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
            <span className="hidden sm:inline">Scan</span>
          </button>

          {/* Cast Button */}
          <button
            type="button"
            onClick={handleScanForSources}
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
            title="Upload File"
          >
            <Upload className="w-5 h-5" />
          </button>
        </div>
      </form>

      {/* File Input (hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,audio/*"
        onChange={handleFileSelect}
        className="hidden"
      />

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
              Supports MP4, WebM, MKV, HLS, DASH, YouTube, Vimeo, and more
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
            'Google Drive',
            'Dropbox',
            'Any webpage URL',
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

      {/* Info Banner */}
      <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
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
  );
}
