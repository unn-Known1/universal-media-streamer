import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Tv,
  Play,
  ChevronDown,
  ChevronUp,
  List,
  Grid3X3,
  ChevronLeft,
  ChevronRight,
  Star,
  Clock,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { IPTVChannel, IPTVPlaylist } from '../types';
import { groupChannelsByCategory, getUniqueCategories, searchChannels, sortChannels } from '../utils/iptvParser';

interface IPTVChannelListProps {
  playlist: IPTVPlaylist;
  currentChannel?: IPTVChannel | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectChannel: (channel: IPTVChannel) => void;
  onPlayChannel: (channel: IPTVChannel) => void;
}

type ViewMode = 'grid' | 'list';
type SortMode = 'name' | 'group';

export function IPTVChannelList({
  playlist,
  currentChannel,
  isOpen,
  onClose,
  onSelectChannel,
  onPlayChannel,
}: IPTVChannelListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortMode, setSortMode] = useState<SortMode>('name');
  const [showCategories, setShowCategories] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Filter and sort channels
  const filteredChannels = useMemo(() => {
    let channels = playlist.channels;

    // Apply search
    if (searchQuery) {
      channels = searchChannels(channels, searchQuery);
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      channels = channels.filter(
        (ch) => ch.group === selectedCategory || ch.category === selectedCategory
      );
    }

    // Sort
    channels = sortChannels(channels, sortMode);

    return channels;
  }, [playlist.channels, searchQuery, selectedCategory, sortMode]);

  // Group channels by category for display
  const groupedChannels = useMemo(() => {
    return groupChannelsByCategory(filteredChannels);
  }, [filteredChannels]);

  const categories = useMemo(() => {
    return ['all', ...getUniqueCategories(playlist.channels)];
  }, [playlist.channels]);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleChannelClick = (channel: IPTVChannel) => {
    onSelectChannel(channel);
  };

  const handlePlayClick = (e: React.MouseEvent, channel: IPTVChannel) => {
    e.stopPropagation();
    onPlayChannel(channel);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-4 md:inset-8 bg-dark-800 rounded-2xl border border-white/10 shadow-2xl z-50 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Tv className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">{playlist.name}</h2>
              <p className="text-sm text-slate-400">{playlist.channels.length} channels</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Controls */}
        <div className="p-4 border-b border-white/5 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-11 pr-4 rounded-xl bg-dark-700/50 border border-white/5 focus:border-primary-500/50 outline-none transition-all"
            />
          </div>

          {/* Controls Row */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-9 px-3 pr-8 rounded-lg bg-dark-700/50 border border-white/5 appearance-none cursor-pointer focus:border-primary-500/50 outline-none text-sm"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Sort Toggle */}
            <div className="flex items-center bg-dark-700/50 rounded-lg p-1">
              <button
                onClick={() => setSortMode('name')}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  sortMode === 'name'
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                A-Z
              </button>
              <button
                onClick={() => setSortMode('group')}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  sortMode === 'group'
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                By Group
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-dark-700/50 rounded-lg p-1 ml-auto">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Toggle Categories Button */}
          <button
            onClick={() => setShowCategories(!showCategories)}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            {showCategories ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showCategories ? 'Collapse' : 'Expand'} Categories
          </button>
        </div>

        {/* Channel List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredChannels.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Tv className="w-12 h-12 mb-3 opacity-50" />
              <p>No channels found</p>
            </div>
          ) : showCategories && selectedCategory === 'all' ? (
            // Grouped view
            <div className="space-y-4">
              {Array.from(groupedChannels.entries()).map(([category, channels]) => (
                <div key={category}>
                  <button
                    onClick={() => toggleCategory(category)}
                    className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-white/5 transition-colors mb-2"
                  >
                    <span className="text-sm font-medium text-primary-400">{category}</span>
                    <span className="text-xs text-slate-500">{channels.length}</span>
                    {expandedCategories.has(category) ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 ml-auto" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 ml-auto" />
                    )}
                  </button>

                  <AnimatePresence>
                    {expandedCategories.has(category) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                      >
                        {viewMode === 'grid' ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {channels.map((channel) => (
                              <ChannelCard
                                key={channel.id}
                                channel={channel}
                                isActive={currentChannel?.id === channel.id}
                                onClick={() => handleChannelClick(channel)}
                                onPlay={(e) => handlePlayClick(e, channel)}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {channels.map((channel) => (
                              <ChannelListItem
                                key={channel.id}
                                channel={channel}
                                isActive={currentChannel?.id === channel.id}
                                onClick={() => handleChannelClick(channel)}
                                onPlay={(e) => handlePlayClick(e, channel)}
                              />
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!expandedCategories.has(category) && (
                    <div className={viewMode === 'grid' 
                      ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3'
                      : 'space-y-1'
                    }>
                      {channels.slice(0, viewMode === 'grid' ? 8 : 5).map((channel) => (
                        viewMode === 'grid' ? (
                          <ChannelCard
                            key={channel.id}
                            channel={channel}
                            isActive={currentChannel?.id === channel.id}
                            onClick={() => handleChannelClick(channel)}
                            onPlay={(e) => handlePlayClick(e, channel)}
                            compact
                          />
                        ) : (
                          <ChannelListItem
                            key={channel.id}
                            channel={channel}
                            isActive={currentChannel?.id === channel.id}
                            onClick={() => handleChannelClick(channel)}
                            onPlay={(e) => handlePlayClick(e, channel)}
                            compact
                          />
                        )
                      ))}
                      {channels.length > (viewMode === 'grid' ? 8 : 5) && (
                        <button
                          onClick={() => toggleCategory(category)}
                          className="col-span-full py-2 text-sm text-primary-400 hover:text-primary-300 transition-colors"
                        >
                          Show all {channels.length} channels in {category}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : viewMode === 'grid' ? (
            // Grid view
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredChannels.map((channel) => (
                <ChannelCard
                  key={channel.id}
                  channel={channel}
                  isActive={currentChannel?.id === channel.id}
                  onClick={() => handleChannelClick(channel)}
                  onPlay={(e) => handlePlayClick(e, channel)}
                />
              ))}
            </div>
          ) : (
            // List view
            <div className="space-y-1">
              {filteredChannels.map((channel) => (
                <ChannelListItem
                  key={channel.id}
                  channel={channel}
                  isActive={currentChannel?.id === channel.id}
                  onClick={() => handleChannelClick(channel)}
                  onPlay={(e) => handlePlayClick(e, channel)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 flex items-center justify-between">
          <div className="text-sm text-slate-400">
            Showing {filteredChannels.length} of {playlist.channels.length} channels
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors text-sm font-medium"
          >
            Done
          </button>
        </div>
      </motion.div>
    </>
  );
}

// Channel Card Component (Grid View)
interface ChannelCardProps {
  channel: IPTVChannel;
  isActive: boolean;
  onClick: () => void;
  onPlay: (e: React.MouseEvent) => void;
  compact?: boolean;
}

function ChannelCard({ channel, isActive, onClick, onPlay, compact }: ChannelCardProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative p-3 rounded-xl border transition-all text-left group ${
        isActive
          ? 'border-primary-500 bg-primary-500/10'
          : 'border-white/5 bg-dark-700/50 hover:border-white/20'
      }`}
    >
      {/* Play Button Overlay */}
      <button
        onClick={onPlay}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-primary-500/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg shadow-primary-500/50"
      >
        <Play className="w-6 h-6 text-white fill-white" />
      </button>

      {/* Logo */}
      {channel.logo ? (
        <div className="w-full aspect-video mb-2 rounded-lg bg-dark-600 overflow-hidden">
          <img
            src={channel.logo}
            alt={channel.name}
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      ) : (
        <div className="w-full aspect-video mb-2 rounded-lg bg-gradient-to-br from-dark-600 to-dark-700 flex items-center justify-center">
          <Tv className="w-8 h-8 text-slate-500" />
        </div>
      )}

      {/* Name */}
      <p className={`text-sm font-medium truncate pr-6 ${compact ? '' : ''}`}>
        {channel.name}
      </p>

      {/* Category Badge */}
      {channel.group && !compact && (
        <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[10px] bg-dark-600 rounded text-slate-400">
          {channel.group}
        </span>
      )}

      {/* Active Indicator */}
      {isActive && (
        <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
      )}
    </motion.button>
  );
}

// Channel List Item Component (List View)
interface ChannelListItemProps {
  channel: IPTVChannel;
  isActive: boolean;
  onClick: () => void;
  onPlay: (e: React.MouseEvent) => void;
  compact?: boolean;
}

function ChannelListItem({ channel, isActive, onClick, onPlay, compact }: ChannelListItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left group ${
        isActive
          ? 'bg-primary-500/10 border border-primary-500/30'
          : 'hover:bg-white/5 border border-transparent'
      }`}
    >
      {/* Logo */}
      <div className="w-10 h-10 rounded-lg bg-dark-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {channel.logo ? (
          <img
            src={channel.logo}
            alt={channel.name}
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <Tv className="w-5 h-5 text-slate-500" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate group-hover:text-primary-300">{channel.name}</p>
        {channel.group && !compact && (
          <p className="text-xs text-slate-500">{channel.group}</p>
        )}
      </div>

      {/* Play Button */}
      <button
        onClick={onPlay}
        className="p-2 rounded-lg bg-primary-500/10 text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary-500/20"
      >
        <Play className="w-4 h-4 fill-current" />
      </button>

      {/* Active Indicator */}
      {isActive && (
        <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
      )}
    </button>
  );
}

// IPTV Channel Navigator Component (for quick channel switching)
interface IPTVChannelNavigatorProps {
  playlist: IPTVPlaylist;
  currentChannel: IPTVChannel;
  onPrevious: () => void;
  onNext: () => void;
  onOpenList: () => void;
}

export function IPTVChannelNavigator({
  playlist,
  currentChannel,
  onPrevious,
  onNext,
  onOpenList,
}: IPTVChannelNavigatorProps) {
  const currentIndex = playlist.channels.findIndex((ch) => ch.id === currentChannel.id);

  return (
    <div className="flex items-center gap-2 p-2 bg-dark-700/80 backdrop-blur rounded-xl">
      <button
        onClick={onOpenList}
        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        title="Open Channel List"
      >
        <Tv className="w-5 h-5" />
      </button>

      <div className="flex-1 flex items-center gap-2 min-w-0">
        {currentChannel.logo ? (
          <img
            src={currentChannel.logo}
            alt={currentChannel.name}
            className="w-6 h-6 rounded object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <Tv className="w-5 h-5 text-slate-400 flex-shrink-0" />
        )}
        <span className="text-sm font-medium truncate">{currentChannel.name}</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onPrevious}
          disabled={currentIndex <= 0}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Previous Channel"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-xs text-slate-400 px-1 min-w-[50px] text-center">
          {currentIndex + 1}/{playlist.channels.length}
        </span>
        <button
          onClick={onNext}
          disabled={currentIndex >= playlist.channels.length - 1}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Next Channel"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// Loading Component
export function IPTVChannelListLoading() {
  return (
    <div className="fixed inset-4 md:inset-8 bg-dark-800 rounded-2xl border border-white/10 shadow-2xl z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
        <p className="text-slate-400">Loading IPTV channels...</p>
      </div>
    </div>
  );
}

// Empty State Component
export function IPTVChannelListEmpty() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
      <Tv className="w-12 h-12 mb-3 opacity-50" />
      <p>No channels loaded</p>
      <p className="text-sm text-slate-500 mt-1">Paste an M3U/M3U8 URL to get started</p>
    </div>
  );
}