import React, { useState } from 'react';
import {
  X,
  Play,
  Clock,
  Bookmark,
  ListVideo,
  Trash2,
  Plus,
  ExternalLink,
  Copy,
  MoreVertical,
  Search,
  ChevronRight,
  Tv,
  RefreshCw,
  Upload,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayer } from '../contexts/PlayerContext';
import { MediaItem, IPTVPlaylist, IPTVChannel } from '../types';
import { formatDate } from '../utils/formatTime';
import { getMediaTypeColor, getMediaTypeLabel } from '../utils/mediaDetector';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'playlist' | 'history' | 'bookmarks' | 'iptv';

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { 
    playlist, 
    history, 
    bookmarks, 
    iptvPlaylists,
    loadMedia, 
    loadIPTVChannel,
    removeFromPlaylist, 
    removeBookmark, 
    clearPlaylist, 
    clearHistory, 
    clearBookmarks,
    removeIPTVPlaylist,
    clearIPTVPlaylists,
    addBookmark, 
    showToast 
  } = usePlayer();
  const [activeTab, setActiveTab] = useState<TabType>('playlist');
  const [filter, setFilter] = useState('');
  const [contextMenu, setContextMenu] = useState<{ item: MediaItem | IPTVPlaylist; x: number; y: number } | null>(null);

  const tabs = [
    { id: 'playlist' as const, label: 'Playlist', icon: ListVideo, count: playlist.length },
    { id: 'history' as const, label: 'History', icon: Clock, count: history.length },
    { id: 'bookmarks' as const, label: 'Bookmarks', icon: Bookmark, count: bookmarks.length },
    { id: 'iptv' as const, label: 'IPTV', icon: Tv, count: iptvPlaylists.length },
  ];

  const getItems = (): (MediaItem | IPTVPlaylist)[] => {
    let items: (MediaItem | IPTVPlaylist)[];
    switch (activeTab) {
      case 'playlist':
        items = playlist;
        break;
      case 'history':
        items = history;
        break;
      case 'bookmarks':
        items = bookmarks;
        break;
      case 'iptv':
        items = iptvPlaylists;
        break;
    }
    if (filter) {
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(filter.toLowerCase()) ||
          ('url' in item && item.url.toLowerCase().includes(filter.toLowerCase())) ||
          ('name' in item && item.name.toLowerCase().includes(filter.toLowerCase()))
      );
    }
    return items;
  };

  const handleContextMenu = (e: React.MouseEvent, item: MediaItem | IPTVPlaylist) => {
    e.preventDefault();
    setContextMenu({ item, x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => setContextMenu(null);

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    showToast('URL copied to clipboard', 'success');
    closeContextMenu();
  };

  const handleOpenInNewTab = (url: string) => {
    window.open(url, '_blank');
    closeContextMenu();
  };

  const handleRemove = (item: MediaItem | IPTVPlaylist) => {
    switch (activeTab) {
      case 'playlist':
        removeFromPlaylist(item.id);
        break;
      case 'bookmarks':
        removeBookmark(item.id);
        break;
      case 'iptv':
        removeIPTVPlaylist(item.id);
        break;
    }
    closeContextMenu();
  };

  const handleAddBookmark = (item: MediaItem) => {
    addBookmark(item);
    closeContextMenu();
  };

  const handlePlayIPTVPlaylist = (pl: IPTVPlaylist) => {
    if (pl.channels.length > 0) {
      loadIPTVChannel(pl.channels[0], pl, 0);
      if (window.innerWidth < 768) onClose();
    }
  };

  const handlePlayMediaItem = (item: MediaItem) => {
    loadMedia(item.url, item.title);
    if (window.innerWidth < 768) onClose();
  };

  const items = getItems();

  const getTabIcon = (tab: typeof tabs[number]) => {
    return tab.icon;
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={onClose}
            />

            {/* Sidebar */}
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-dark-800/95 backdrop-blur-xl border-r border-white/5 z-50 flex flex-col"
            >
              {/* Header */}
              <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
                <h2 className="font-semibold">Media Library</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors md:hidden"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/5">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative ${
                      activeTab === tab.id
                        ? tab.id === 'iptv'
                          ? 'text-violet-400'
                          : 'text-primary-400'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden lg:inline">{tab.label}</span>
                    <span className="px-1.5 py-0.5 text-[10px] bg-dark-600 rounded">
                      {tab.count}
                    </span>
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTab"
                        className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                          tab.id === 'iptv' ? 'bg-violet-500' : 'bg-primary-500'
                        }`}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Filter */}
              <div className="p-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder={`Filter ${activeTab}...`}
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-lg bg-dark-700/50 border border-white/5 focus:border-primary-500/50 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 p-4">
                    {(() => {
                      const TabIcon = getTabIcon(tabs.find(t => t.id === activeTab) || tabs[0]);
                      return <TabIcon className="w-12 h-12 mb-3 opacity-50" />;
                    })()}
                    <p className="text-sm text-center">
                      {activeTab === 'playlist' && 'No items in playlist'}
                      {activeTab === 'history' && 'No watch history'}
                      {activeTab === 'bookmarks' && 'No bookmarks yet'}
                      {activeTab === 'iptv' && 'No IPTV playlists loaded'}
                    </p>
                    {activeTab === 'iptv' && (
                      <p className="text-xs text-slate-600 mt-1 text-center">
                        Paste an M3U/M3U8 URL to load channels
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {items.map((item, index) => {
                      const isIPTVItem = 'channels' in item;
                      const itemTitle = isIPTVItem ? (item as IPTVPlaylist).name : (item as MediaItem).title;
                      const itemType = isIPTVItem ? 'iptv' : (item as MediaItem).type;
                      const itemId = item.id;
                      const itemUrl = isIPTVItem ? (item as IPTVPlaylist).url : (item as MediaItem).url;
                      
                      return (
                        <button
                          key={itemId}
                          onClick={() => {
                            if (isIPTVItem) {
                              handlePlayIPTVPlaylist(item as IPTVPlaylist);
                            } else {
                              handlePlayMediaItem(item as MediaItem);
                            }
                          }}
                          onContextMenu={(e) => handleContextMenu(e, item)}
                          className="w-full p-3 rounded-xl flex items-center gap-3 hover:bg-white/5 transition-colors text-left group"
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden ${
                            isIPTVItem ? 'bg-gradient-to-br from-violet-600/20 to-purple-600/20' : 'bg-dark-700'
                          }`}>
                            {isIPTVItem ? (
                              <Tv className="w-5 h-5 text-violet-400 group-hover:text-violet-300" />
                            ) : (
                              <Play className="w-4 h-4 text-slate-400 group-hover:text-primary-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate group-hover:text-primary-300">
                              {itemTitle}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {isIPTVItem ? (
                                <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-violet-500/20 text-violet-400">
                                  {(item as IPTVPlaylist).channels.length} channels
                                </span>
                              ) : (
                                <>
                                  <span
                                    className="px-1.5 py-0.5 text-[10px] font-medium rounded"
                                    style={{
                                      backgroundColor: `${getMediaTypeColor(itemType)}20`,
                                      color: getMediaTypeColor(itemType),
                                    }}
                                  >
                                    {getMediaTypeLabel(itemType)}
                                  </span>
                                  {'lastPlayedAt' in item && item.lastPlayedAt && (
                                    <span className="text-[10px] text-slate-500">
                                      {formatDate(item.lastPlayedAt)}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-3 border-t border-white/5">
                {activeTab === 'iptv' && (
                  <button
                    onClick={() => {
                      // Could open file picker for local M3U files
                      showToast('Paste an M3U/M3U8 URL to add IPTV playlists', 'info');
                    }}
                    className="w-full h-10 flex items-center justify-center gap-2 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 hover:text-violet-300 transition-colors text-sm mb-2"
                  >
                    <Upload className="w-4 h-4" />
                    Load Local Playlist
                  </button>
                )}
                <button
                  onClick={() => {
                    switch (activeTab) {
                      case 'playlist':
                        clearPlaylist();
                        break;
                      case 'history':
                        clearHistory();
                        break;
                      case 'bookmarks':
                        clearBookmarks();
                        break;
                      case 'iptv':
                        clearIPTVPlaylists();
                        break;
                    }
                    showToast('Cleared', 'success');
                  }}
                  className="w-full h-10 flex items-center justify-center gap-2 rounded-xl bg-dark-700/50 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear {activeTab}
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <>
            <div
              className="fixed inset-0 z-[100]"
              onClick={closeContextMenu}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed z-[101] bg-dark-700 rounded-xl border border-white/10 shadow-2xl overflow-hidden min-w-[180px]"
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              {'url' in contextMenu.item && (
                <>
                  <button
                    onClick={() => {
                      if ('channels' in contextMenu.item) {
                        handlePlayIPTVPlaylist(contextMenu.item as IPTVPlaylist);
                      } else {
                        handlePlayMediaItem(contextMenu.item as MediaItem);
                      }
                      closeContextMenu();
                    }}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 text-sm"
                  >
                    <Play className="w-4 h-4" />
                    Play Now
                  </button>
                  <button
                    onClick={() => handleCopyUrl((contextMenu.item as MediaItem).url)}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 text-sm"
                  >
                    <Copy className="w-4 h-4" />
                    Copy URL
                  </button>
                  <button
                    onClick={() => handleOpenInNewTab((contextMenu.item as MediaItem).url)}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in New Tab
                  </button>
                  {!('channels' in contextMenu.item) && activeTab !== 'bookmarks' && (
                    <button
                      onClick={() => handleAddBookmark(contextMenu.item as MediaItem)}
                      className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 text-sm"
                    >
                      <Bookmark className="w-4 h-4" />
                      Add to Bookmarks
                    </button>
                  )}
                  <div className="border-t border-white/5" />
                </>
              )}
              <button
                onClick={() => handleRemove(contextMenu.item)}
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-red-500/10 text-red-400 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}