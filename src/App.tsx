import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Player } from './components/Player';
import { MediaInput } from './components/MediaInput';
import { YouTubeSearch } from './components/YouTubeSearch';
import { SettingsModal } from './components/SettingsModal';
import { ToastContainer } from './components/Toast';
import { SettingsProvider, initializeTheme, useSettings } from './contexts/SettingsContext';
import { PlayerProvider, usePlayer } from './contexts/PlayerContext';
import { Link, Youtube } from 'lucide-react';

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [inputTab, setInputTab] = useState<'url' | 'youtube'>('url');
  const { settings } = useSettings();
  const { playerState } = usePlayer();

  useEffect(() => {
    const cleanup = initializeTheme(settings.theme);
    return cleanup;
  }, [settings.theme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent-color', settings.accentColor);
  }, [settings.accentColor]);

  return (
    <div className={`min-h-screen bg-dark-900 ${settings.highContrast ? 'high-contrast' : ''}`}>
      {/* Header */}
      <Header
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className={`pt-4 pb-8 px-4 md:px-8 transition-all duration-300 ${
        sidebarOpen ? 'md:ml-80' : ''
      }`}>
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Player Section */}
          <section className="space-y-4">
            <Player onShowShortcuts={() => setShowShortcuts(true)} />

            {/* Media Info */}
            {playerState.currentMedia && (
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold truncate">
                    {playerState.currentMedia.title}
                  </h2>
                  <p className="text-sm text-slate-400">
                    {playerState.currentMedia.type.toUpperCase()} • {playerState.currentMedia.url}
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Media Input Section */}
          <section className="py-8">
            {/* Tab Switcher */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setInputTab('url')}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all font-medium ${
                  inputTab === 'url'
                    ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/25'
                    : 'bg-dark-700/50 text-slate-400 hover:text-white hover:bg-dark-700'
                }`}
              >
                <Link className="w-5 h-5" />
                URL / Stream
              </button>
              <button
                onClick={() => setInputTab('youtube')}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all font-medium ${
                  inputTab === 'youtube'
                    ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/25'
                    : 'bg-dark-700/50 text-slate-400 hover:text-white hover:bg-dark-700'
                }`}
              >
                <Youtube className="w-5 h-5" />
                YouTube Search
              </button>
            </div>

            {/* Tab Content */}
            {inputTab === 'url' ? <MediaInput /> : <YouTubeSearch />}
          </section>

          {/* Features Grid */}
          <section className="py-8">
            <h3 className="text-lg font-semibold mb-6">Supported Features</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'HLS Streaming', desc: 'Live & VOD .m3u8' },
                { name: 'DASH Streaming', desc: '.mpd manifests' },
                { name: 'Direct Video', desc: 'MP4, WebM, MKV' },
                { name: 'YouTube Search', desc: 'Search & play' },
                { name: 'Volume Boost', desc: 'Up to 200%' },
                { name: 'Picture-in-Picture', desc: 'Floating player' },
                { name: 'A-B Repeat', desc: 'Loop sections' },
                { name: 'Screenshot', desc: 'Capture frames' },
              ].map((feature) => (
                <div
                  key={feature.name}
                  className="p-4 rounded-xl bg-dark-800/50 border border-white/5 hover:border-primary-500/30 transition-colors"
                >
                  <h4 className="font-medium text-sm">{feature.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">{feature.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        showShortcuts={showShortcuts}
        onShowShortcuts={() => setShowShortcuts(false)}
      />

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
}

function App() {
  return (
    <SettingsProvider>
      <PlayerProvider>
        <AppContent />
      </PlayerProvider>
    </SettingsProvider>
  );
}

export default App;
