import { useState, useEffect } from 'react';

interface VisualViewportState {
  viewportHeight: number;
  viewportWidth: number;
  isKeyboardVisible: boolean;
  keyboardHeight: number;
}

/**
 * Hook to track mobile visualViewport dimensions and virtual keyboard presence.
 * Prevents mobile keyboards from obscuring inputs or pushing modals offscreen.
 */
export function useVisualViewport(): VisualViewportState {
  const [state, setState] = useState<VisualViewportState>(() => {
    if (typeof window === 'undefined' || !window.visualViewport) {
      return {
        viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 800,
        viewportWidth: typeof window !== 'undefined' ? window.innerWidth : 400,
        isKeyboardVisible: false,
        keyboardHeight: 0,
      };
    }
    const vv = window.visualViewport;
    const windowH = window.innerHeight;
    const diff = windowH - vv.height;
    return {
      viewportHeight: vv.height,
      viewportWidth: vv.width,
      isKeyboardVisible: diff > 140,
      keyboardHeight: diff > 140 ? diff : 0,
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const vv = window.visualViewport;

    const handleResizeOrScroll = () => {
      const windowH = window.innerHeight;
      const diff = windowH - vv.height;
      const isKb = diff > 140;

      setState({
        viewportHeight: vv.height,
        viewportWidth: vv.width,
        isKeyboardVisible: isKb,
        keyboardHeight: isKb ? diff : 0,
      });

      // Update CSS variable on document element for CSS-based calculations
      document.documentElement.style.setProperty('--visual-viewport-height', `${vv.height}px`);
      document.documentElement.style.setProperty('--keyboard-height', `${isKb ? diff : 0}px`);
    };

    vv.addEventListener('resize', handleResizeOrScroll);
    vv.addEventListener('scroll', handleResizeOrScroll);
    handleResizeOrScroll();

    return () => {
      vv.removeEventListener('resize', handleResizeOrScroll);
      vv.removeEventListener('scroll', handleResizeOrScroll);
    };
  }, []);

  return state;
}

/**
 * Utility to safely scroll an element into the center of the visual viewport
 * when focused on mobile devices.
 */
export function scrollInputIntoView(element: HTMLElement | null, delayMs = 120) {
  if (!element) return;
  setTimeout(() => {
    try {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    } catch {
      // Fallback for older browsers
      element.scrollIntoView(false);
    }
  }, delayMs);
}
