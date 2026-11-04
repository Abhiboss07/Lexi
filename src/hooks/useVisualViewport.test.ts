import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVisualViewport, scrollInputIntoView } from './useVisualViewport';

describe('useVisualViewport', () => {
  it('initializes with default window dimensions when visualViewport is absent or present', () => {
    const { result } = renderHook(() => useVisualViewport());
    expect(result.current.viewportHeight).toBeGreaterThan(0);
    expect(result.current.viewportWidth).toBeGreaterThan(0);
    expect(result.current.isKeyboardVisible).toBe(false);
  });

  it('scrollInputIntoView calls scrollIntoView on the element safely', async () => {
    const el = document.createElement('input');
    let called = false;
    el.scrollIntoView = () => {
      called = true;
    };
    document.body.appendChild(el);

    act(() => {
      scrollInputIntoView(el, 10);
    });

    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(called).toBe(true);
    document.body.removeChild(el);
  });
});
