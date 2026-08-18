import React, { useState } from 'react';
import { X, Sun, Moon, Monitor, Palette, Keyboard, Info, Play, Subtitles, RotateCcw, Tv } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../contexts/SettingsContext';
import { usePlayer } from '../contexts/PlayerContext';
import { KEYBOARD_SHORTCUTS, PLAYBACK_RATES, DEFAULT_SETTINGS } from '../utils/constants';
import { TwitchChannel } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  showShortcuts: boolean;
  onShowShortcuts: () => void;
}

type TabType = 'appearance' | 'playback' | 'subtitles' | 'shortcuts' | 'streaming' | 'about';

const ACCENT_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
];

const CAPTION_BACKGROUNDS = [
  { label: 'Black', value: 'rgba(0, 0, 0, 0.75)' },
  { label: 'Darker', value: 'rgba(0, 0, 0, 0.95)' },
  { label: 'White', value: 'rgba(255, 255, 255, 0.75)' },
  { label: 'None', value: 'transparent' },
];

export function SettingsModal({ isOpen, onClose, showShortcuts, onShowShortcuts }: SettingsModalProps) {
  const { settings, setTheme, setAccentColor, updateSettings, resetSettings } = useSettings();
  const { loadMedia, showToast } = usePlayer();
  const [activeTab, setActiveTab] = useState<TabType>('appearance');
  const [newTwitchChannel, setNewTwitchChannel] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  React.useEffect(() => {
    if (showShortcuts) {
      setActiveTab('shortcuts');
      onShowShortcuts();
    }
  }, [showShortcuts, onShowShortcuts]);

  if (!isOpen) return null;

  const tabs = [
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
    { id: 'playback' as const, label: 'Playback', icon: Play },
    { id: 'subtitles' as const, label: 'Subtitles', icon: Subtitles },
    { id: 'shortcuts' as const, label: 'Shortcuts', icon: Keyboard },
    { id: 'streaming' as const, label: 'Streaming', icon: Tv },
    { id: 'about' as const, label: 'About', icon: Info },
  ];

  const shortcutLabels: Record<string, string> = {
    ' ': 'Play / Pause',
    k: 'Play / Pause',
    f: 'Toggle fullscreen',
    t: 'Theater mode',
    m: 'Mute / Unmute',
    p: 'Picture-in-Picture',
    c: 'Toggle captions',
    ArrowLeft: 'Seek -5s',
    ArrowRight: 'Seek +5s',
    ArrowUp: 'Volume +5%',
    ArrowDown: 'Volume -5%',
    j: 'Seek -10s',
    l: 'Seek +10s',
    '0': 'Seek to 0%',
    '1': 'Seek to 10%',
    '2': 'Seek to 20%',
    '3': 'Seek to 30%',
    '4': 'Seek to 40%',
    '5': 'Seek to 50%',
    '6': 'Seek to 60%',
    '7': 'Seek to 70%',
    '8': 'Seek to 80%',
    '9': 'Seek to 90%',
    '?': 'Show shortcuts',
  };

  const updateTwitchChannel = (index: number, patch: Partial<TwitchChannel>) => {
    const updated = [...settings.twitchChannels];
    updated[index] = { ...updated[index], ...patch };
    updateSettings({ twitchChannels: updated });
  };

  const addTwitchChannel = (name: string) => {
    const trimmed = name.trim().toLowerCase().replace(/^@/, '');
    if (!trimmed) return;
    if (settings.twitchChannels.some((ch) => ch.channelName === trimmed)) {
      showToast('Channel already added', 'info');
      return;
    }
    updateSettings({
      twitchChannels: [
        ...settings.twitchChannels,
        { channelName: trimmed, quality: 'source', enabled: true },
      ],
    });
    setNewTwitchChannel('');
  };

  const playTwitchChannel = (channel: TwitchChannel) => {
    if (!channel.enabled) return;
    loadMedia(`https://www.twitch.tv/${channel.channelName}`, `${channel.channelName} (Twitch)`);
    showToast(`Loading twitch.tv/${channel.channelName}`, 'info');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-2xl max-h-[80vh] bg-dark-800 rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <h2 className="text-lg font-semibold">Settings</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (confirmReset) {
                    resetSettings();
                    setConfirmReset(false);
                    showToast('Settings reset to defaults', 'success');
                  } else {
                    setConfirmReset(true);
                    setTimeout(() => setConfirmReset(false), 3000);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  confirmReset
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-dark-700/50 hover:bg-white/10 text-slate-400'
                }`}
                title="Reset settings"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {confirmReset ? 'Confirm?' : 'Reset'}
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close settings"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Tabs */}
            <div className="w-48 border-r border-white/5 p-2 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-500/10 text-primary-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  {/* Theme */}
                  <div>
                    <label className="block text-sm font-medium mb-3">Theme</label>
                    <div className="flex gap-2">
                      {[
                        { value: 'dark', icon: Moon, label: 'Dark' },
                        { value: 'light', icon: Sun, label: 'Light' },
                        { value: 'system', icon: Monitor, label: 'System' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setTheme(option.value as typeof settings.theme)}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
                            settings.theme === option.value
                              ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                              : 'border-white/10 hover:border-white/20'
                          }`}
                        >
                          <option.icon className="w-5 h-5" />
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div>
                    <label className="block text-sm font-medium mb-3">Accent Color</label>
                    <div className="flex flex-wrap gap-2">
                      {ACCENT_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setAccentColor(color)}
                          className={`w-10 h-10 rounded-xl transition-transform hover:scale-110 ${
                            settings.accentColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-800' : ''
                          }`}
                          style={{ backgroundColor: color }}
                          aria-label={`Set accent color ${color}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Layout Density */}
                  <div>
                    <label className="block text-sm font-medium mb-3">Layout Density</label>
                    <div className="flex gap-2">
                      {(['compact', 'default', 'comfortable'] as const).map((option) => (
                        <button
                          key={option}
                          onClick={() => updateSettings({ layoutDensity: option })}
                          className={`flex-1 px-4 py-2 rounded-lg border transition-colors text-sm capitalize ${
                            settings.layoutDensity === option
                              ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                              : 'border-white/10 hover:border-white/20 text-slate-400'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Accessibility */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Accessibility</h3>
                    <label className="flex items-center justify-between p-3 rounded-xl bg-dark-700/50 cursor-pointer">
                      <div>
                        <p className="font-medium">High Contrast</p>
                        <p className="text-xs text-slate-400">Increase contrast for better visibility</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.highContrast}
                        onChange={() => updateSettings({ highContrast: !settings.highContrast })}
                        className="w-5 h-5 rounded accent-primary-500"
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 rounded-xl bg-dark-700/50 cursor-pointer">
                      <div>
                        <p className="font-medium">Reduced Motion</p>
                        <p className="text-xs text-slate-400">Minimize animations</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.reducedMotion}
                        onChange={() => updateSettings({ reducedMotion: !settings.reducedMotion })}
                        className="w-5 h-5 rounded accent-primary-500"
                      />
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'playback' && (
                <div className="space-y-6">
                  {/* Default Speed */}
                  <div>
                    <label className="block text-sm font-medium mb-3">Default Playback Speed</label>
                    <div className="flex flex-wrap gap-2">
                      {PLAYBACK_RATES.map((rate) => (
                        <button
                          key={rate}
                          onClick={() => updateSettings({ defaultPlaybackSpeed: rate })}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            settings.defaultPlaybackSpeed === rate
                              ? 'bg-primary-500 text-white'
                              : 'bg-dark-700 hover:bg-white/10'
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Default Volume */}
                  <div>
                    <label className="block text-sm font-medium mb-3">
                      Default Volume: {Math.round(settings.defaultVolume * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.05"
                      value={settings.defaultVolume}
                      onChange={(e) => updateSettings({ defaultVolume: parseFloat(e.target.value) })}
                      className="w-full accent-primary-500"
                    />
                    <p className="text-xs text-slate-500 mt-1">Up to 200% volume boost</p>
                  </div>

                  {/* Auto-play */}
                  <label className="flex items-center justify-between p-4 rounded-xl bg-dark-700/50 cursor-pointer">
                    <div>
                      <p className="font-medium">Auto-play Next</p>
                      <p className="text-xs text-slate-400">Automatically play next item in playlist</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.autoPlayNext}
                      onChange={() => updateSettings({ autoPlayNext: !settings.autoPlayNext })}
                      className="w-5 h-5 rounded accent-primary-500"
                    />
                  </label>

                  {/* IPTV: remember last channel */}
                  <label className="flex items-center justify-between p-4 rounded-xl bg-dark-700/50 cursor-pointer">
                    <div>
                      <p className="font-medium">Remember Last IPTV Channel</p>
                      <p className="text-xs text-slate-400">Resume the last watched channel when opening a playlist</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.iptvRememberChannel}
                      onChange={() => updateSettings({ iptvRememberChannel: !settings.iptvRememberChannel })}
                      className="w-5 h-5 rounded accent-primary-500"
                    />
                  </label>
                </div>
              )}

              {activeTab === 'subtitles' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-3">Caption Font Size</label>
                    <div className="flex gap-2">
                      {(['small', 'medium', 'large'] as const).map((size) => (
                        <button
                          key={size}
                          onClick={() => updateSettings({ captionFontSize: size })}
                          className={`flex-1 px-4 py-2 rounded-lg border transition-colors text-sm capitalize ${
                            settings.captionFontSize === size
                              ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                              : 'border-white/10 hover:border-white/20 text-slate-400'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-3">Caption Background</label>
                    <div className="flex flex-wrap gap-2">
                      {CAPTION_BACKGROUNDS.map((bg) => (
                        <button
                          key={bg.label}
                          onClick={() => updateSettings({ captionBackground: bg.value })}
                          className={`px-4 py-2 rounded-lg border transition-colors text-sm ${
                            settings.captionBackground === bg.value
                              ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                              : 'border-white/10 hover:border-white/20 text-slate-400'
                          }`}
                        >
                          {bg.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-dark-700/50">
                    <p className="text-sm text-slate-400">
                      Captions are shown automatically when a stream provides subtitle or caption tracks.
                      Toggle them with the subtitles button in the player or the <kbd className="px-2 py-0.5 rounded bg-dark-600 text-xs">C</kbd> key.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'shortcuts' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-400">
                    Use these keyboard shortcuts to control playback:
                  </p>
                  <div className="space-y-2">
                    {Object.entries(KEYBOARD_SHORTCUTS).map(([key, _action]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between py-2 border-b border-white/5"
                      >
                        <span className="text-sm">
                          {shortcutLabels[key] || _action}
                        </span>
                        <kbd className="px-3 py-1.5 rounded-lg bg-dark-700 text-sm font-mono">
                          {key === ' ' ? 'Space' : key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'streaming' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Twitch Streaming</h3>
                    <p className="text-sm text-slate-400 mb-4">
                      Add Twitch channels to watch live streams directly in the player.
                    </p>
                  </div>

                  {/* Add Channel Form */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTwitchChannel}
                      onChange={(e) => setNewTwitchChannel(e.target.value)}
                      placeholder="Enter Twitch channel name"
                      className="flex-1 px-4 py-2 rounded-lg bg-dark-700 border border-white/10 focus:border-primary-500 outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newTwitchChannel.trim()) {
                          addTwitchChannel(newTwitchChannel);
                        }
                      }}
                    />
                    <button
                      onClick={() => addTwitchChannel(newTwitchChannel)}
                      disabled={!newTwitchChannel.trim()}
                      className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 rounded-lg transition-colors"
                    >
                      Add Channel
                    </button>
                  </div>

                  {/* Channel List */}
                  <div className="space-y-2">
                    {settings.twitchChannels.length === 0 ? (
                      <div className="p-4 rounded-xl bg-dark-700/50 text-center">
                        <p className="text-slate-400">No channels added yet</p>
                        <p className="text-sm text-slate-500 mt-1">Add a Twitch channel above to get started</p>
                      </div>
                    ) : (
                      settings.twitchChannels.map((channel, index) => (
                        <div
                          key={`${channel.channelName}-${index}`}
                          className="flex items-center justify-between p-3 rounded-lg bg-dark-700/50 border border-white/5"
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={channel.enabled}
                              onChange={() => updateTwitchChannel(index, { enabled: !channel.enabled })}
                              className="w-4 h-4 rounded accent-primary-500"
                            />
                            <div>
                              <p className="font-medium">{channel.channelName}</p>
                              <p className="text-xs text-slate-500">twitch.tv/{channel.channelName}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={channel.quality}
                              onChange={(e) => updateTwitchChannel(index, { quality: e.target.value as TwitchChannel['quality'] })}
                              className="px-2 py-1 rounded bg-dark-600 text-sm border border-white/10"
                            >
                              <option value="source">Source</option>
                              <option value="high">High</option>
                              <option value="medium">Medium</option>
                              <option value="low">Low</option>
                            </select>
                            <button
                              onClick={() => playTwitchChannel(channel)}
                              disabled={!channel.enabled}
                              className="p-2 rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 transition-colors disabled:opacity-30"
                              title={`Play ${channel.channelName}`}
                            >
                              <Play className="w-4 h-4 fill-current" />
                            </button>
                            <button
                              onClick={() => updateSettings({
                                twitchChannels: settings.twitchChannels.filter((_, i) => i !== index),
                              })}
                              className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Stream Info */}
                  <div className="p-4 rounded-xl bg-dark-700/50">
                    <h4 className="font-medium mb-2">How Twitch Streaming Works</h4>
                    <ul className="text-sm text-slate-400 space-y-2">
                      <li>• Channels are embedded in the player using Twitch's official player</li>
                      <li>• Enter a channel name to add it to your streaming list</li>
                      <li>• Click the play button on a channel to start watching</li>
                      <li>• Your channel list is saved in your browser settings</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'about' && (
                <div className="space-y-6 text-center py-8">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/25">
                    <Play className="w-10 h-10 text-white fill-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Universal Media Streamer</h3>
                    <p className="text-slate-400 mt-1">Version 1.0.0</p>
                  </div>
                  <p className="text-sm text-slate-400 max-w-md mx-auto">
                    A powerful, feature-rich media player that supports all video formats,
                    including HLS, DASH, YouTube, Vimeo, Twitch, and more.
                  </p>
                  <div className="flex justify-center gap-2 text-xs text-slate-500">
                    <span>Built with React</span>
                    <span>•</span>
                    <span>HLS.js</span>
                    <span>•</span>
                    <span>DASH.js</span>
                  </div>
                  <button
                    onClick={() => {
                      resetSettings();
                      showToast('Settings reset to defaults', 'success');
                    }}
                    className="mx-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-700/50 hover:bg-white/10 transition-colors text-sm text-slate-400"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset all settings
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}