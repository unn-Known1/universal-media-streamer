import { useEffect, useCallback } from 'react';

export function useMediaSession(
  title: string | null,
  isPlaying: boolean,
  currentTime: number,
  duration: number,
  onSeek: (time: number) => void,
  onPlay: () => void,
  onPause: () => void
) {
  const updateMediaSession = useCallback(() => {
    if (!('mediaSession' in navigator)) return;

    const media = navigator.mediaSession;

    if (title) {
      media.metadata = new MediaMetadata({
        title,
        artist: 'Universal Media Streamer',
        album: 'Streaming',
        artwork: [],
      });
    }

    media.setActionHandler('play', onPlay);
    media.setActionHandler('pause', onPause);
    media.setActionHandler('seekbackward', () => onSeek(Math.max(0, currentTime - 10)));
    media.setActionHandler('seekforward', () => onSeek(Math.min(duration, currentTime + 10)));
    media.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        onSeek(details.seekTime);
      }
    });
  }, [title, currentTime, duration, onPlay, onPause, onSeek]);

  useEffect(() => {
    updateMediaSession();
  }, [updateMediaSession]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const updatePositionState = () => {
      if ('setPositionState' in navigator.mediaSession!) {
        navigator.mediaSession!.setPositionState!({
          duration,
          playbackRate: 1,
          position: currentTime,
        });
      }
    };

    updatePositionState();
    const interval = setInterval(updatePositionState, 1000);

    return () => clearInterval(interval);
  }, [currentTime, duration]);
}