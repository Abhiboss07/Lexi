import { PracticeScreen, type PracticeScreenProps } from '../practice/PracticeScreen';

export type VocabularyNotebookScreenProps = PracticeScreenProps;

/**
 * Backward-compatible alias for PracticeScreen.
 * In Phase A, the Vocabulary Notebook was elevated into the broader Practice destination.
 */
export const VocabularyNotebookScreen = PracticeScreen;

export default PracticeScreen;
