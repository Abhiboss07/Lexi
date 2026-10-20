export interface SpeakingPrompt {
  id: string;
  title: string;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2';
  levelBadge: string;
  category: 'everyday' | 'travel' | 'workplace' | 'social';
  prompt: string;
  context: string;
  modelResponse: string;
  targetKeyPhrases: string[];
  audioAccent: 'en-US' | 'en-GB';
  pronunciationTips: string;
  sampleHints: string[];
}

export const SPEAKING_PROMPTS: SpeakingPrompt[] = [
  {
    id: 'sp-order-coffee',
    title: 'Ordering a Warm Drink',
    cefrLevel: 'A1',
    levelBadge: 'A1 • Beginner',
    category: 'everyday',
    prompt: 'Order an oat milk latte to take away and ask how much it costs.',
    context: 'You are at a local café counter in London talking to the barista.',
    modelResponse: 'Could I please have a medium oat milk latte to go? How much is that?',
    targetKeyPhrases: ['could i please have', 'oat milk latte', 'to go', 'how much is that'],
    audioAccent: 'en-GB',
    pronunciationTips: "Link 'could I' smoothly as /kʊ-daɪ/. Soften the 't' in 'latte' and keep 'please' gentle.",
    sampleHints: ['Could I please have a...', 'Can I get a...', 'To go, please.'],
  },
  {
    id: 'sp-daily-routine',
    title: 'Describing Your Morning Routine',
    cefrLevel: 'A1',
    levelBadge: 'A1 • Beginner',
    category: 'everyday',
    prompt: 'Describe what you usually do in the morning before starting your day.',
    context: 'Your language partner asks about your typical morning schedule.',
    modelResponse: 'I usually wake up at seven, have a cup of black coffee, and read the news.',
    targetKeyPhrases: ['usually wake up', 'cup of black coffee', 'read the news'],
    audioAccent: 'en-US',
    pronunciationTips: "Stress 'usually' on the first syllable (/ˈjuː.ʒu.ə.li/). Connect 'cup of' as /kʌ-pəv/.",
    sampleHints: ['I usually wake up at...', 'First, I have...', 'Then I...'],
  },
  {
    id: 'sp-directions',
    title: 'Asking for Directions to the Metro',
    cefrLevel: 'A2',
    levelBadge: 'A2 • Elementary',
    category: 'travel',
    prompt: 'Excuse yourself politely and ask a passerby for directions to the nearest subway station.',
    context: 'You are standing on a street corner in a foreign city holding your city map.',
    modelResponse: 'Excuse me, could you tell me where the nearest subway station is? Is it within walking distance?',
    targetKeyPhrases: ['excuse me', 'could you tell me', 'nearest subway station', 'within walking distance'],
    audioAccent: 'en-US',
    pronunciationTips: "Raise intonation at the end of polite yes/no questions like 'Is it within walking distance?'.",
    sampleHints: ['Excuse me, could you...', 'Where is the nearest...', 'Is it far from here?'],
  },
  {
    id: 'sp-hotel-issue',
    title: 'Reporting a Room Issue at a Hotel',
    cefrLevel: 'A2',
    levelBadge: 'A2 • Elementary',
    category: 'travel',
    prompt: 'Call the front desk to report that there is no hot water in your bathroom.',
    context: 'You are calling the hotel concierge from your room phone.',
    modelResponse: 'Hello, this is room 304. There seems to be no hot water in our shower. Could someone come take a look?',
    targetKeyPhrases: ['this is room', 'there seems to be', 'no hot water', 'could someone come take a look'],
    audioAccent: 'en-GB',
    pronunciationTips: "Use polite softening: 'There seems to be' sounds much more courteous than 'There is'.",
    sampleHints: ['Hello, this is room...', 'There seems to be a problem with...', 'Could you send someone?'],
  },
  {
    id: 'sp-past-trip',
    title: 'Sharing a Memorable Travel Experience',
    cefrLevel: 'B1',
    levelBadge: 'B1 • Intermediate',
    category: 'social',
    prompt: 'Talk about a memorable trip you took and describe why it was special to you.',
    context: 'You are chatting with colleagues during lunch about favorite vacation spots.',
    modelResponse: 'Last summer I visited Kyoto, and what impressed me most was the peaceful atmosphere of the ancient bamboo gardens.',
    targetKeyPhrases: ['visited', 'what impressed me most', 'peaceful atmosphere', 'ancient bamboo gardens'],
    audioAccent: 'en-US',
    pronunciationTips: "Emphasize 'peaceful' and 'most' to give your sentence emotional color and authentic rhythm.",
    sampleHints: ['Last year I visited...', 'What struck me most was...', 'The best part was...'],
  },
  {
    id: 'sp-project-delay',
    title: 'Explaining a Project Delay to a Client',
    cefrLevel: 'B2',
    levelBadge: 'B2 • Upper Intermediate',
    category: 'workplace',
    prompt: 'Diplomatically inform a client that their delivery will be postponed by two days due to technical validation.',
    context: 'You are in a weekly project milestone call with an enterprise customer.',
    modelResponse: 'To ensure top-tier system stability, we need an extra 48 hours for security validation. We appreciate your patience and will deliver on Thursday.',
    targetKeyPhrases: ['ensure top-tier stability', 'extra 48 hours', 'security validation', 'appreciate your patience', 'deliver on thursday'],
    audioAccent: 'en-US',
    pronunciationTips: "Maintain a steady, confident cadence. Pause slightly before 'We appreciate your patience' for professional reassurance.",
    sampleHints: ['To ensure the highest quality...', 'We require an additional...', 'We sincerely appreciate your flexibility.'],
  },
];
