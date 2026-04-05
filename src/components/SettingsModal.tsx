import React, { useState } from 'react';
import { X, Sun, Moon, Monitor, Palette, Keyboard, Info, Play, Subtitles, Eye, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../contexts/SettingsContext';
import { KEYBOARD_SHORTCUTS, PLAYBACK_RATES } from '../utils/constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  showShortcuts: boolean;
  onShowShortcuts: () => void;
}

type TabType = 'appearance' | 'playback' | 'subtitles' | 'shortcuts' | 'about';

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

export function SettingsModal({ isOpen, onClose, showShortcuts, onShowShortcuts }: SettingsModalProps) {
  const { settings, setTheme, setAccentColor, updateSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<TabType>('appearance');

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
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
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
                        />
                      ))}
                    </div>
                  </div>

                  {/* Layout Density */}
                  <div>
                    <label className="block text-sm font-medium mb-3">Layout Density</label>
                    <div className="flex gap-2">
                      {['Compact', 'Default', 'Comfortable'].map((option, i) => (
                        <button
                          key={option}
                          onClick={() => updateSettings({})}
                          className="flex-1 px-4 py-2 rounded-lg border border-white/10 hover:border-white/20 transition-colors text-sm"
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
                      max="1"
                      step="0.1"
                      value={settings.defaultVolume}
                      onChange={(e) => updateSettings({ defaultVolume: parseFloat(e.target.value) })}
                      className="w-full accent-primary-500"
                    />
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
                </div>
              )}

              {activeTab === 'subtitles' && (
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-dark-700/50 text-center">
                    <Subtitles className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                    <p className="text-slate-400">Subtitle customization will appear here</p>
                    <p className="text-sm text-slate-500 mt-1">Coming in a future update</p>
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
                    including HLS, DASH, YouTube, Vimeo, and more.
                  </p>
                  <div className="flex justify-center gap-2 text-xs text-slate-500">
                    <span>Built with React</span>
                    <span>•</span>
                    <span>Video.js</span>
                    <span>•</span>
                    <span>HLS.js</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
