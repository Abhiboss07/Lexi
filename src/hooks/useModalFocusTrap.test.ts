import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useModalFocusTrap } from './useModalFocusTrap';

describe('useModalFocusTrap hook', () => {
  let container: HTMLDivElement;
  let openerButton: HTMLButtonElement;
  let firstBtn: HTMLButtonElement;
  let secondBtn: HTMLButtonElement;
  let closeBtn: HTMLButtonElement;

  beforeEach(() => {
    // Setup simulated DOM
    openerButton = document.createElement('button');
    openerButton.id = 'opener-btn';
    openerButton.textContent = 'Open Modal';
    document.body.appendChild(openerButton);
    openerButton.focus();

    container = document.createElement('div');
    firstBtn = document.createElement('button');
    firstBtn.textContent = 'First Action';
    secondBtn = document.createElement('button');
    secondBtn.textContent = 'Second Action';
    closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close Modal';

    container.appendChild(firstBtn);
    container.appendChild(secondBtn);
    container.appendChild(closeBtn);
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('captures opener element and restores focus on close', async () => {
    openerButton.focus();
    expect(document.activeElement).toBe(openerButton);

    const onClose = vi.fn();
    const { unmount } = renderHook(() =>
      useModalFocusTrap({ isOpen: true, onClose })
    );

    unmount();

    // Give setTimeout in cleanup time to execute
    await new Promise((r) => setTimeout(r, 20));
    expect(document.activeElement).toBe(openerButton);
  });

  it('triggers onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    renderHook(() => useModalFocusTrap({ isOpen: true, onClose }));

    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(escapeEvent);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not trigger onClose if isOpen is false', () => {
    const onClose = vi.fn();
    renderHook(() => useModalFocusTrap({ isOpen: false, onClose }));

    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(escapeEvent);

    expect(onClose).not.toHaveBeenCalled();
  });
});
