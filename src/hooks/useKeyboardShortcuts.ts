import { useEffect, useCallback, useRef } from 'react';
import { KEYBOARD_SHORTCUTS } from '../utils/constants';

interface ShortcutHandlers {
  playPause?: () => void;
  fullscreen?: () => void;
  theater?: () => void;
  mute?: () => void;
  pip?: () => void;
  captions?: () => void;
  seekBack?: () => void;
  seekForward?: () => void;
  seekBack10?: () => void;
  seekForward10?: () => void;
  volumeUp?: () => void;
  volumeDown?: () => void;
  seek0?: () => void;
  seek10?: () => void;
  seek20?: () => void;
  seek30?: () => void;
  seek40?: () => void;
  seek50?: () => void;
  seek60?: () => void;
  seek70?: () => void;
  seek80?: () => void;
  seek90?: () => void;
  showShortcuts?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers, enabled: boolean = true) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when typing in input fields
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    const key = e.key;
    const action = KEYBOARD_SHORTCUTS[key];

    if (!action) return;

    e.preventDefault();

    const handler = handlersRef.current[action as keyof ShortcutHandlers];
    if (handler) {
      handler();
    }
  }, [enabled]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export function useTouchGestures(
  elementRef: React.RefObject<HTMLElement>,
  options: {
    onSingleTap?: () => void;
    onDoubleTapLeft?: () => void;
    onDoubleTapRight?: () => void;
    onHorizontalSwipe?: (deltaX: number) => void;
    onVerticalSwipe?: (deltaY: number, side: 'left' | 'right') => void;
    onLongPress?: () => void;
  }
) {
  const { onSingleTap, onDoubleTapLeft, onDoubleTapRight, onHorizontalSwipe, onVerticalSwipe, onLongPress } = options;

  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };

      // Long press detection
      if (onLongPress) {
        longPressTimeoutRef.current = setTimeout(() => {
          onLongPress();
        }, 500);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const start = touchStartRef.current;

      // Clear long press timeout
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
      }

      if (!start) return;

      const deltaX = touch.clientX - start.x;
      const deltaY = touch.clientY - start.y;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      const time = Date.now();
      const lastTap = lastTapRef.current;

      // Detect double tap
      if (
        lastTap &&
        absDeltaX < 30 &&
        absDeltaY < 30 &&
        time - lastTap.time < 300 &&
        Math.abs(touch.clientX - lastTap.x) < 50 &&
        Math.abs(touch.clientY - lastTap.y) < 50
      ) {
        // Double tap detected
        if (touch.clientX < element.clientWidth / 2) {
          onDoubleTapLeft?.();
        } else {
          onDoubleTapRight?.();
        }
        lastTapRef.current = null;
        return;
      }

      // Detect swipe
      if (absDeltaX > 50 && absDeltaX > absDeltaY) {
        onHorizontalSwipe?.(deltaX);
      } else if (absDeltaY > 50 && absDeltaY > absDeltaX) {
        onVerticalSwipe?.(deltaY, touch.clientX < element.clientWidth / 2 ? 'left' : 'right');
      } else if (absDeltaX < 30 && absDeltaY < 30) {
        // Single tap
        onSingleTap?.();
      }

      lastTapRef.current = { x: touch.clientX, y: touch.clientY, time };
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
      }
    };
  }, [elementRef, onSingleTap, onDoubleTapLeft, onDoubleTapRight, onHorizontalSwipe, onVerticalSwipe, onLongPress]);
}
