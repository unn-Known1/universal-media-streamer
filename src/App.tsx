import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Player } from './components/Player';
import { MediaInput } from './components/MediaInput';
import { SettingsModal } from './components/SettingsModal';
import { ToastContainer } from './components/Toast';
import { SettingsProvider, initializeTheme, useSettings } from './contexts/SettingsContext';
import { PlayerProvider, usePlayer } from './contexts/PlayerContext';

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
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
            <MediaInput />
          </section>

          {/* Features Grid */}
          <section className="py-8">
            <h3 className="text-lg font-semibold mb-6">Supported Features</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'HLS Streaming', desc: 'Live & VOD .m3u8' },
                { name: 'DASH Streaming', desc: '.mpd manifests' },
                { name: 'Direct Video', desc: 'MP4, WebM, MKV' },
                { name: 'Volume Boost', desc: 'Up to 200%' },
                { name: 'Picture-in-Picture', desc: 'Floating player' },
                { name: 'Keyboard Shortcuts', desc: 'Full control' },
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
