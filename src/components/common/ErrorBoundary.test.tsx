import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';

const FaultyComponent: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Simulated runtime render failure');
  }
  return <div>Healthy Component Content</div>;
};

describe('ErrorBoundary Component', () => {
  it('renders children when no errors occur', () => {
    render(
      <ErrorBoundary>
        <FaultyComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Healthy Component Content')).toBeDefined();
  });

  it('renders accessible fallback UI when child throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary fallbackTitle="Custom View Interruption">
        <FaultyComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByText('Custom View Interruption')).toBeDefined();
    expect(
      screen.getByText(/Your learning progress is safe in local offline storage/i)
    ).toBeDefined();

    spy.mockRestore();
  });

  it('invokes onReset callback upon retry button click', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onResetMock = vi.fn();

    render(
      <ErrorBoundary onReset={onResetMock}>
        <FaultyComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    const retryBtn = screen.getByRole('button', { name: /Retry Section/i });
    expect(retryBtn).toBeDefined();

    fireEvent.click(retryBtn);
    expect(onResetMock).toHaveBeenCalledTimes(1);

    spy.mockRestore();
  });
});
