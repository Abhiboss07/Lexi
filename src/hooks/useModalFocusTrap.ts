import { useEffect, useRef } from 'react';

interface UseModalFocusTrapOptions {
  isOpen: boolean;
  onClose?: () => void;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  disableFocusTrap?: boolean;
}

/**
 * Universal hook for modal dialog accessibility (WCAG 2.1.2 No Keyboard Trap,
 * WCAG 2.4.3 Focus Order, WCAG 2.4.7 Focus Visible).
 *
 * Features:
 * - Traps Tab and Shift+Tab focus navigation within the modal container.
 * - Handles Escape key to trigger modal closure.
 * - Preserves the opening trigger element and restores focus upon dismissal.
 * - Auto-focuses the first interactive element or specified initialFocusRef.
 */
export function useModalFocusTrap<T extends HTMLElement = HTMLDivElement>({
  isOpen,
  onClose,
  initialFocusRef,
  disableFocusTrap = false,
}: UseModalFocusTrapOptions) {
  const containerRef = useRef<T>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Capture currently active element so we can restore focus when closing
    const activeEl = document.activeElement as HTMLElement | null;
    if (activeEl && (!containerRef.current || !containerRef.current.contains(activeEl))) {
      triggerRef.current = activeEl;
    }

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const timer = setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;

      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else {
        const focusableElements = container.querySelectorAll<HTMLElement>(focusableSelectors);
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        } else {
          container.focus();
        }
      }
    }, 40);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      const container = containerRef.current;
      if (!container) return;

      if (e.key === 'Tab' && !disableFocusTrap) {
        const focusable = Array.from(
          container.querySelectorAll<HTMLElement>(focusableSelectors)
        ).filter((el) => el.offsetParent !== null || el.getClientRects().length > 0);

        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === first || !container.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          // Tab
          if (document.activeElement === last || !container.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown, true);

      // Restore focus to opener element
      if (triggerRef.current && typeof triggerRef.current.focus === 'function') {
        setTimeout(() => {
          try {
            triggerRef.current?.focus();
          } catch {
            // Ignore if element was detached
          }
        }, 10);
      }
    };
  }, [isOpen, onClose, initialFocusRef, disableFocusTrap]);

  return containerRef;
}
