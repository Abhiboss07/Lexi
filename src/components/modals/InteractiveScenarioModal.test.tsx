import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InteractiveScenarioModal } from './InteractiveScenarioModal';

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

describe('InteractiveScenarioModal', () => {
  const mockOnClose = vi.fn();
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock speechSynthesis and SpeechSynthesisUtterance
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        speak: vi.fn(),
        cancel: vi.fn(),
      },
      writable: true,
    });
    (window as any).SpeechSynthesisUtterance = vi.fn().mockImplementation((text) => ({
      text,
      lang: '',
      rate: 1,
    }));
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <InteractiveScenarioModal
        isOpen={false}
        scenarioId="cafe-conversation"
        onClose={mockOnClose}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders scenario details and initial turn when open', () => {
    render(
      <InteractiveScenarioModal
        isOpen={true}
        scenarioId="cafe-conversation"
        onClose={mockOnClose}
        onSessionComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('Café Conversation')).toBeDefined();
    expect(screen.getByText(/Turn 1 of/i)).toBeDefined();
    expect(screen.getAllByText(/Liam/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Good morning! Welcome to The Roastery/i)).toBeDefined();
  });

  it('allows selecting an option and reveals feedback', async () => {
    render(
      <InteractiveScenarioModal
        isOpen={true}
        scenarioId="cafe-conversation"
        onClose={mockOnClose}
        onSessionComplete={mockOnComplete}
      />
    );

    const naturalOption = screen.getByText(/Could I please get a medium cappuccino with oat milk\?/i);
    fireEvent.click(naturalOption);

    // Feedback should be visible
    expect(screen.getByText(/Perfect! Using "Could I please get\.\.\." is polite/i)).toBeDefined();
    expect(screen.getByText(/Natural & Polite/i)).toBeDefined();

    // Continue button should be enabled
    const continueBtn = screen.getByText('Continue');
    expect(continueBtn).not.toBeNull();
    fireEvent.click(continueBtn);

    // Moves to Turn 2
    await waitFor(() => {
      expect(screen.getByText(/Turn 2 of/i)).toBeDefined();
      expect(screen.getByText(/Sure thing, one medium oat cappuccino!/i)).toBeDefined();
    });
  });

  it('speaks dialogue when speaker button is pressed', () => {
    render(
      <InteractiveScenarioModal
        isOpen={true}
        scenarioId="cafe-conversation"
        onClose={mockOnClose}
      />
    );

    const speakerBtn = screen.getByLabelText('Listen to partner speech');
    fireEvent.click(speakerBtn);

    expect(window.speechSynthesis.speak).toHaveBeenCalled();
  });

  it('renders Start button when onStartLesson is provided', () => {
    const mockStartLesson = vi.fn();
    render(
      <InteractiveScenarioModal
        isOpen={true}
        scenarioId="cafe-conversation"
        onClose={mockOnClose}
        onStartLesson={mockStartLesson}
      />
    );

    const startBtn = screen.getByRole('button', { name: /Start interactive curriculum lesson/i });
    expect(startBtn).toBeDefined();
    expect(startBtn.textContent).toContain('Start');
    fireEvent.click(startBtn);

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockStartLesson).toHaveBeenCalled();
  });
});
