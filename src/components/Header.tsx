import React, { useState } from 'react';
import {
  Play,
  Settings,
  Moon,
  Sun,
  Monitor,
  Search,
  Download,
  Menu,
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { usePlayer } from '../contexts/PlayerContext';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
}

export function Header({ onToggleSidebar, onOpenSettings }: HeaderProps) {
  const { settings, setTheme } = useSettings();
  const { history, bookmarks, loadMedia } = usePlayer();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof history>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = [
        ...history.filter(
          (h) =>
            h.title.toLowerCase().includes(query.toLowerCase()) ||
            h.url.toLowerCase().includes(query.toLowerCase())
        ),
        ...bookmarks.filter(
          (b) =>
            b.title.toLowerCase().includes(query.toLowerCase()) ||
            b.url.toLowerCase().includes(query.toLowerCase())
        ),
      ];
      setSearchResults(results.slice(0, 10));
      setShowSearch(true);
    } else {
      setSearchResults([]);
      setShowSearch(false);
    }
  };

  const handleResultClick = (url: string, title: string) => {
    loadMedia(url, title);
    setSearchQuery('');
    setShowSearch(false);
  };

  React.useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstall(false);
      }
      setDeferredPrompt(null);
    }
  };

  const themeIcon = {
    dark: <Moon className="w-5 h-5" />,
    light: <Sun className="w-5 h-5" />,
    system: <Monitor className="w-5 h-5" />,
  }[settings.theme];

  const nextTheme = {
    dark: 'light',
    light: 'system',
    system: 'dark',
  }[settings.theme];

  return (
    <header className="h-16 bg-dark-800/80 backdrop-blur-xl border-b border-white/5 flex items-center px-4 gap-4 sticky top-0 z-50">
      {/* Logo */}
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-lg hover:bg-white/10 transition-colors md:hidden"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/25">
            <Play className="w-5 h-5 text-white fill-white" />
          </div>
          <div className="absolute -inset-1 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl blur opacity-30 -z-10" />
        </div>
        <div className="hidden sm:block">
          <h1 className="text-lg font-bold tracking-tight">
            <span className="text-gradient bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
              Universal
            </span>
            <span className="text-slate-300"> Media</span>
          </h1>
          <p className="text-[10px] text-slate-500 -mt-1">Stream Anything</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-xl mx-4 relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search history & bookmarks..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchQuery && setShowSearch(true)}
            onBlur={() => setTimeout(() => setShowSearch(false), 200)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-dark-700/50 border border-white/5 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-sm placeholder:text-slate-500"
          />
        </div>

        {/* Search Results */}
        {showSearch && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-dark-700 rounded-xl border border-white/10 shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
            {searchResults.map((result) => (
              <button
                key={result.id}
                onClick={() => handleResultClick(result.url, result.title)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded bg-dark-600 flex items-center justify-center flex-shrink-0">
                  <Play className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{result.title}</p>
                  <p className="text-xs text-slate-500 truncate">{result.url}</p>
                </div>
                <span
                  className="px-2 py-0.5 text-[10px] font-medium rounded"
                  style={{
                    backgroundColor: `${result.type === 'youtube' ? '#ef4444' : result.type === 'hls' ? '#f59e0b' : '#22c55e'}20`,
                    color: result.type === 'youtube' ? '#ef4444' : result.type === 'hls' ? '#f59e0b' : '#22c55e',
                  }}
                >
                  {result.type.toUpperCase()}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(nextTheme)}
          className="p-2.5 rounded-xl bg-dark-700/50 hover:bg-white/10 transition-colors"
          aria-label={`Switch to ${nextTheme} theme`}
          title={`Theme: ${settings.theme}`}
        >
          {themeIcon}
        </button>

        {/* Install PWA */}
        {showInstall && (
          <button
            onClick={handleInstall}
            className="p-2.5 rounded-xl bg-dark-700/50 hover:bg-white/10 transition-colors text-primary-400"
            aria-label="Install app"
            title="Install App"
          >
            <Download className="w-5 h-5" />
          </button>
        )}

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="p-2.5 rounded-xl bg-dark-700/50 hover:bg-white/10 transition-colors"
          aria-label="Open settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
