import React from 'react';
import type { PracticeCategoryKey } from './PracticeCategoryNav';
export type { PracticeCategoryKey };

import type { PracticeDifficulty, PracticeSessionLength } from '../../types/practicePreferences';
import { ConversationCoachModal } from './ConversationCoachModal';
import { StoryStudioModal } from './StoryStudioModal';
import { VocabularyStudioModal } from './VocabularyStudioModal';
import { GrammarStudioModal } from './GrammarStudioModal';
import { ListeningVoiceStudioModal } from './ListeningVoiceStudioModal';
import { InterviewTrainerModal } from './InterviewTrainerModal';
import { SpeakingPracticeModal } from './SpeakingPracticeModal';

interface PracticeModalProps {
  category: PracticeCategoryKey | null;
  userId?: string;
  initialDifficulty?: PracticeDifficulty;
  initialSessionLength?: PracticeSessionLength;
  onClose: () => void;
  onNavigateToExplore?: () => void;
}

export const PracticeModal: React.FC<PracticeModalProps> = ({
  category,
  userId = 'local-learner-1',
  initialDifficulty = 'medium',
  initialSessionLength = 'standard',
  onClose,
  onNavigateToExplore,
}) => {
  if (!category) return null;

  switch (category) {
    case 'vocabulary':
      return (
        <VocabularyStudioModal
          userId={userId}
          initialDifficulty={initialDifficulty}
          initialSessionLength={initialSessionLength}
          onClose={onClose}
          onNavigateToExplore={onNavigateToExplore}
        />
      );
    case 'conversation':
      return (
        <ConversationCoachModal 
          userId={userId}
          initialDifficulty={initialDifficulty}
          initialSessionLength={initialSessionLength}
          onClose={onClose} 
          onNavigateToExplore={onNavigateToExplore} 
        />
      );
    case 'stories':
      return (
        <StoryStudioModal 
          userId={userId}
          initialDifficulty={initialDifficulty}
          initialSessionLength={initialSessionLength}
          onClose={onClose} 
          onNavigateToExplore={onNavigateToExplore} 
        />
      );
    case 'grammar':
      return (
        <GrammarStudioModal 
          userId={userId}
          initialDifficulty={initialDifficulty}
          initialSessionLength={initialSessionLength}
          onClose={onClose} 
          onNavigateToExplore={onNavigateToExplore} 
        />
      );
    case 'listening':
      return (
        <ListeningVoiceStudioModal 
          userId={userId}
          initialDifficulty={initialDifficulty}
          initialSessionLength={initialSessionLength}
          onClose={onClose} 
          onNavigateToExplore={onNavigateToExplore} 
        />
      );
    case 'speaking':
      return (
        <SpeakingPracticeModal
          userId={userId}
          initialDifficulty={initialDifficulty}
          initialSessionLength={initialSessionLength}
          onClose={onClose}
          onNavigateToExplore={onNavigateToExplore}
        />
      );
    case 'interview':
      return (
        <InterviewTrainerModal
          userId={userId}
          initialDifficulty={initialDifficulty}
          initialSessionLength={initialSessionLength}
          onClose={onClose}
          onNavigateToExplore={onNavigateToExplore}
        />
      );
    default:
      return null;
  }
};
