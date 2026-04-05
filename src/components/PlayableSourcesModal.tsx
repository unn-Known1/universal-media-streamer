import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Play,
  Loader2,
  AlertCircle,
  Monitor,
  Smartphone,
  Tv,
  Copy,
  ExternalLink,
  CheckCircle,
  Globe,
  Film,
  Tv2,
} from 'lucide-react';
import { usePlayer } from '../contexts/PlayerContext';
import { extractPlayableSources, ExtractionResult, ExtractedSource } from '../utils/urlExtractor';
import { castService, CastDevice, initializeCastAPI } from '../utils/castUtils';
import { getMediaTypeLabel, getMediaTypeColor } from '../utils/mediaDetector';

interface PlayableSourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  onSelectSource: (url: string) => void;
}

export function PlayableSourcesModal({ isOpen, onClose, url, onSelectSource }: PlayableSourcesModalProps) {
  const { showToast } = usePlayer();
  const [isLoading, setIsLoading] = useState(false);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [devices, setDevices] = useState<CastDevice[]>([]);
  const [isSearchingDevices, setIsSearchingDevices] = useState(false);
  const [isCasting, setIsCasting] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<CastDevice | null>(null);
  const [activeTab, setActiveTab] = useState<'sources' | 'cast'>('sources');

  useEffect(() => {
    if (isOpen && url) {
      extractSources();
      initializeCast();
    }
  }, [isOpen, url]);

  const extractSources = async () => {
    setIsLoading(true);
    setExtractionResult(null);

    try {
      const result = await extractPlayableSources(url);
      setExtractionResult(result);
    } catch (error) {
      setExtractionResult({
        success: false,
        sources: [],
        error: 'Failed to extract sources',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const initializeCast = async () => {
    initializeCastAPI();
    setIsSearchingDevices(true);
    try {
      const foundDevices = await castService.searchForDevices();
      setDevices(foundDevices);
    } catch (error) {
      console.error('Failed to search for devices:', error);
    } finally {
      setIsSearchingDevices(false);
    }
  };

  const handleSourceSelect = (source: ExtractedSource) => {
    onSelectSource(source.url);
    onClose();
  };

  const handleCopyUrl = (urlToCopy: string) => {
    navigator.clipboard.writeText(urlToCopy);
    showToast('URL copied to clipboard', 'success');
  };

  const handleCastToDevice = async (device: CastDevice) => {
    if (!extractionResult?.sources.length) {
      showToast('No source available to cast', 'error');
      return;
    }

    setIsCasting(true);
    setSelectedDevice(device);

    try {
      // Try to cast the best quality source
      const source = extractionResult.sources[0];
      const success = await castService.castToDevice(device.id, source.url, extractionResult.title);

      if (success) {
        showToast(`Casting to ${device.name}`, 'success');
      } else {
        showToast('Failed to cast. Opening cast receiver...', 'info');
        // Open cast receiver page
        window.open(
          `https://www.google.com/cast/load?url=${encodeURIComponent(source.url)}`,
          '_blank'
        );
      }
    } catch (error) {
      showToast('Cast failed', 'error');
    } finally {
      setIsCasting(false);
      setSelectedDevice(null);
    }
  };

  const getDeviceIcon = (type: CastDevice['type']) => {
    switch (type) {
      case 'chromecast':
        return <Tv className="w-5 h-5" />;
      case 'dlna':
        return <Monitor className="w-5 h-5" />;
      case 'airplay':
        return <Smartphone className="w-5 h-5" />;
      default:
        return <Tv2 className="w-5 h-5" />;
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-3xl max-h-[85vh] bg-dark-800 rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div>
            <h2 className="text-lg font-semibold">Available Sources</h2>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-md">{url}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5">
          <button
            onClick={() => setActiveTab('sources')}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'sources' ? 'text-primary-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Film className="w-4 h-4" />
              Playback Sources
            </div>
            {activeTab === 'sources' && (
              <motion.div
                layoutId="sourceTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('cast')}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'cast' ? 'text-primary-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Monitor className="w-4 h-4" />
              Cast to Device
              {devices.length > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] bg-primary-500/20 rounded-full">
                  {devices.length}
                </span>
              )}
            </div>
            {activeTab === 'cast' && (
              <motion.div
                layoutId="sourceTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"
              />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'sources' && (
            <div className="space-y-4">
              {/* Loading State */}
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-10 h-10 text-primary-400 animate-spin mb-4" />
                  <p className="text-slate-400">Scanning for playable sources...</p>
                </div>
              )}

              {/* Error State */}
              {!isLoading && extractionResult?.error && (
                <div className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                  <p className="text-red-400 font-medium">{extractionResult.error}</p>
                  <button
                    onClick={extractSources}
                    className="mt-4 px-4 py-2 bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* No Sources Found */}
              {!isLoading && extractionResult?.success && extractionResult.sources.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Globe className="w-12 h-12 text-slate-400 mb-4" />
                  <p className="text-slate-400 font-medium">No playable sources found</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Try using a direct video URL instead
                  </p>
                </div>
              )}

              {/* Sources List */}
              {!isLoading && extractionResult?.sources && extractionResult.sources.length > 0 && (
                <>
                  {extractionResult.title && (
                    <div className="mb-4 p-3 rounded-xl bg-dark-700/50 border border-white/5">
                      <p className="text-sm text-slate-400">Title</p>
                      <p className="font-medium mt-0.5">{extractionResult.title}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    {extractionResult.sources.map((source, index) => (
                      <motion.div
                        key={`${source.url}-${index}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 rounded-xl bg-dark-700/50 border border-white/5 hover:border-primary-500/30 transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className="px-2 py-0.5 text-xs font-medium rounded"
                                style={{
                                  backgroundColor: `${getMediaTypeColor(source.type)}20`,
                                  color: getMediaTypeColor(source.type),
                                }}
                              >
                                {getMediaTypeLabel(source.type)}
                              </span>
                              {source.label && source.label !== getMediaTypeLabel(source.type) && (
                                <span className="text-xs text-slate-500">{source.label}</span>
                              )}
                            </div>
                            <p className="text-sm text-slate-300 truncate font-mono">
                              {source.url}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleCopyUrl(source.url)}
                              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                              title="Copy URL"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => window.open(source.url, '_blank')}
                              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                              title="Open in new tab"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleSourceSelect(source)}
                              className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 transition-colors flex items-center gap-2"
                            >
                              <Play className="w-4 h-4" />
                              Play
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'cast' && (
            <div className="space-y-4">
              {/* Searching */}
              {isSearchingDevices && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 text-primary-400 animate-spin mr-3" />
                  <span className="text-slate-400">Searching for devices...</span>
                </div>
              )}

              {/* Devices List */}
              {!isSearchingDevices && (
                <>
                  {devices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Tv className="w-12 h-12 text-slate-400 mb-4" />
                      <p className="text-slate-400 font-medium">No devices found</p>
                      <p className="text-sm text-slate-500 mt-1 text-center max-w-sm">
                        Make sure your casting device is on the same network as this device.
                        <br />
                        Chromecast, AirPlay, and DLNA devices will appear here.
                      </p>
                      <button
                        onClick={initializeCast}
                        className="mt-4 px-4 py-2 bg-dark-700 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        Search Again
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-slate-400 mb-4">
                        Select a device to cast your media
                      </p>
                      {devices.map((device) => (
                        <motion.button
                          key={device.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => handleCastToDevice(device)}
                          disabled={isCasting}
                          className="w-full p-4 rounded-xl bg-dark-700/50 border border-white/5 hover:border-primary-500/30 transition-colors flex items-center gap-4 disabled:opacity-50"
                        >
                          <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-400">
                            {getDeviceIcon(device.type)}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium">{device.name}</p>
                            <p className="text-xs text-slate-500 capitalize">{device.type}</p>
                          </div>
                          {isCasting && selectedDevice?.id === device.id ? (
                            <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />
                          ) : (
                            <div className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 transition-colors">
                              Cast
                            </div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Cast Info */}
              <div className="mt-6 p-4 rounded-xl bg-dark-700/30 border border-white/5">
                <h4 className="font-medium mb-2">Supported Devices</h4>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li className="flex items-center gap-2">
                    <Tv className="w-4 h-4" />
                    Google Chromecast, Android TV, Smart TVs
                  </li>
                  <li className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    Apple TV, iOS devices (AirPlay)
                  </li>
                  <li className="flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    DLNA/UPnP devices (Xbox, PS4, etc.)
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
