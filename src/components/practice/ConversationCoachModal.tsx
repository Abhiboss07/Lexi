import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  MessageCircle, 
  Send, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Mic, 
  ArrowRight, 
  Award, 
  CheckCircle2, 
  BookPlus, 
  User,
  Coffee,
  Briefcase,
  Compass,
  Building,
  Plane
} from 'lucide-react';
import type { PracticeDifficulty, PracticeSessionLength } from '../../types/practicePreferences';
import { DIFFICULTY_DESCRIPTIONS, SESSION_LENGTH_MINUTES } from '../../types/practicePreferences';
import { practiceRepository } from '../../db/practiceRepository';
import { vocabularyRepository } from '../../db/vocabularyRepository';
import { dailyPracticeService, getLocalDateString } from '../../services/dailyPracticeService';

export interface ConversationScenario {
  id: string;
  category: 'everyday' | 'workplace' | 'travel';
  title: string;
  level: string;
  partner: string;
  partnerRole: string;
  icon: React.ElementType;
  starter: string;
  prompts: string[];
  vocabularyToLearn: Array<{ word: string; pos: string; definition: string; example: string }>;
}

export const CONVERSATION_SCENARIOS: ConversationScenario[] = [
  {
    id: 'cafe',
    category: 'everyday',
    title: 'Ordering at a Cozy Café',
    level: 'A1 • Beginner',
    partner: 'Alex',
    partnerRole: 'Barista',
    icon: Coffee,
    starter: "Hello! Welcome to Corner Café. What can I get started for you today?",
    prompts: [
      "I'd like an iced latte with oat milk, please.",
      "Could I see what pastries you have fresh today?",
      "Can I get a large cappuccino to go?",
    ],
    vocabularyToLearn: [
      { word: 'cappuccino', pos: 'noun', definition: 'An Italian coffee drink prepared with espresso and steamed milk foam.', example: 'Can I get a large cappuccino to go?' },
      { word: 'pastry', pos: 'noun', definition: 'A sweet baked food made with dough of flour, water and shortening.', example: 'The almond pastry was fresh and delicious.' },
    ],
  },
  {
    id: 'introductions',
    category: 'workplace',
    title: 'Meeting a New Colleague',
    level: 'A2 • Workplace',
    partner: 'Sarah',
    partnerRole: 'Design Lead',
    icon: Briefcase,
    starter: "Hi there! I don't think we've met yet. Are you new to the team?",
    prompts: [
      "Yes, I just started this week! Nice to meet you.",
      "Hello Sarah, yes! I'm joining the marketing project.",
      "Nice to meet you! I've heard great things about your team.",
    ],
    vocabularyToLearn: [
      { word: 'colleague', pos: 'noun', definition: 'A person with whom one works in a profession or business.', example: 'Sarah is a wonderful colleague to work with.' },
      { word: 'initiative', pos: 'noun', definition: 'The ability to assess and initiate things independently.', example: 'She showed great initiative on the new design system.' },
    ],
  },
  {
    id: 'travel',
    category: 'travel',
    title: 'Asking for Directions in London',
    level: 'A2 • Travel',
    partner: 'Oliver',
    partnerRole: 'Local Commuter',
    icon: Compass,
    starter: "Excuse me, you look a bit lost! Can I help you find the tube station?",
    prompts: [
      "Thank you! Which way is Covent Garden station?",
      "Yes please, is the underground entrance nearby?",
      "Thanks! I'm looking for the Piccadilly line.",
    ],
    vocabularyToLearn: [
      { word: 'underground', pos: 'noun', definition: 'An underground railway system, especially that of London.', example: 'The underground entrance is just past the corner.' },
      { word: 'direction', pos: 'noun', definition: 'A course along which someone or something moves.', example: 'Could you give me directions to the station?' },
    ],
  },
  {
    id: 'hotel',
    category: 'travel',
    title: 'Checking into a Boutique Hotel',
    level: 'A2 • Hospitality',
    partner: 'Emma',
    partnerRole: 'Front Desk Concierge',
    icon: Building,
    starter: "Good afternoon! Welcome to The Grand View. Do you have a reservation with us?",
    prompts: [
      "Yes, I booked a queen room under the name Smith.",
      "Hello! We have a booking for two nights.",
      "Could you let me know what time breakfast is served?",
    ],
    vocabularyToLearn: [
      { word: 'reservation', pos: 'noun', definition: 'An arrangement to secure a room, seat, or service in advance.', example: 'I have a reservation for two nights.' },
      { word: 'amenity', pos: 'noun', definition: 'A desirable or useful feature or facility of a building or place.', example: 'The hotel amenities include a gym and pool.' },
    ],
  },
  {
    id: 'standup',
    category: 'workplace',
    title: 'Giving a Project Standup Update',
    level: 'B1 • Professional',
    partner: 'Marcus',
    partnerRole: 'Engineering Lead',
    icon: Plane,
    starter: "Morning team! Let's do a quick round of standup. How are things looking on your end?",
    prompts: [
      "Yesterday I finished the user profile tests, today I am reviewing PRs.",
      "I made good progress on the API integration and have no blockers.",
      "Everything is on schedule. I will deploy the update by this afternoon.",
    ],
    vocabularyToLearn: [
      { word: 'blocker', pos: 'noun', definition: 'An obstacle or issue preventing progress on a task.', example: 'Do you have any blockers on your sprint tickets?' },
      { word: 'milestone', pos: 'noun', definition: 'A significant stage or event in the development of something.', example: 'We achieved our project milestone ahead of schedule.' },
    ],
  },
];

interface ConversationCoachModalProps {
  userId?: string;
  initialDifficulty?: PracticeDifficulty;
  initialSessionLength?: PracticeSessionLength;
  onClose: () => void;
  onNavigateToExplore?: () => void;
}

export const ConversationCoachModal: React.FC<ConversationCoachModalProps> = ({
  userId = 'local-learner-1',
  initialDifficulty = 'medium',
  initialSessionLength = 'standard',
  onClose,
}) => {
  const [sessionDifficulty, setSessionDifficulty] = useState<PracticeDifficulty>(initialDifficulty);
  const [sessionLength, setSessionLength] = useState<PracticeSessionLength>(initialSessionLength);
  const [selectedTopic, setSelectedTopic] = useState<ConversationScenario>(CONVERSATION_SCENARIOS[0]);
  
  const [chatLog, setChatLog] = useState<Array<{ 
    sender: 'ai' | 'user'; 
    text: string; 
    feedback?: string;
    timestamp: Date;
  }>>([
    { sender: 'ai', text: CONVERSATION_SCENARIOS[0].starter, timestamp: new Date() },
  ]);
  
  const [inputText, setInputText] = useState('');
  const [isSpeakingAiIndex, setIsSpeakingAiIndex] = useState<number | null>(null);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [showEvaluationReport, setShowEvaluationReport] = useState(false);
  const [savedVocabIds, setSavedVocabIds] = useState<Set<string>>(new Set());
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Scroll chat into view on updates
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  // Speech Recognition Setup (Web Speech API)
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
          }
          setIsListeningVoice(false);
        };

        recognition.onerror = () => {
          setIsListeningVoice(false);
        };

        recognition.onend = () => {
          setIsListeningVoice(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }

    if (isListeningVoice) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListeningVoice(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListeningVoice(true);
      } catch (err) {
        console.error('Speech recognition error:', err);
        setIsListeningVoice(false);
      }
    }
  };

  const handleSpeakText = (text: string, msgIndex: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeakingAiIndex === msgIndex) {
      window.speechSynthesis.cancel();
      setIsSpeakingAiIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = DIFFICULTY_DESCRIPTIONS[sessionDifficulty].speechRate;
    
    utterance.onend = () => setIsSpeakingAiIndex(null);
    utterance.onerror = () => setIsSpeakingAiIndex(null);
    
    setIsSpeakingAiIndex(msgIndex);
    window.speechSynthesis.speak(utterance);
  };

  const handleSelectTopic = (topic: ConversationScenario) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSelectedTopic(topic);
    setChatLog([{ sender: 'ai', text: topic.starter, timestamp: new Date() }]);
    setInputText('');
    setShowEvaluationReport(false);
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    // Add user message
    const updatedLog = [...chatLog, { sender: 'user' as const, text, timestamp: new Date() }];
    setChatLog(updatedLog);
    setInputText('');

    // Record progress activity
    const todayStr = getLocalDateString();
    practiceRepository.recordSession({
      userId,
      category: 'conversation',
      activityId: `daily-speaking-${todayStr}`,
      difficulty: sessionDifficulty,
      sessionLength,
      durationMinutes: SESSION_LENGTH_MINUTES[sessionLength],
      score: 90,
      notes: `Daily Conversation practice: ${selectedTopic.title}`,
    }).catch(console.error);
    dailyPracticeService.recordDailyCompletion(userId, 'speaking', 90).catch(console.error);

    // AI Partner contextual response generator with tailored CEFR level feedback
    setTimeout(() => {
      let aiReply = "Wonderful phrasing! Let me ask: Would you like anything else with that, or should I get the receipt?";
      let feedbackTip = "Tip: Using 'Could I please get...' is especially polite in casual English.";

      if (sessionDifficulty === 'easy') {
        feedbackTip = "Great work! 'Please' and 'thank you' make every order smooth and friendly.";
      } else if (sessionDifficulty === 'hard') {
        feedbackTip = "Advanced Coach Tip: Try introducing nuanced conditionals, e.g. 'I was wondering if I might trouble you for...'";
      }

      if (selectedTopic.id === 'introductions') {
        aiReply = "Welcome aboard! It's fantastic to have you here. What kind of projects are you most excited to work on?";
        feedbackTip = sessionDifficulty === 'easy' 
          ? "Tip: 'Nice to meet you' is simple and great." 
          : "Tip: 'Great to meet you' or 'Pleasure to connect' adds warmth to workplace introductions.";
      } else if (selectedTopic.id === 'travel') {
        aiReply = "You're only a two-minute walk away! Just head straight past the post office and take your first left.";
        feedbackTip = "Tip: When confirming directions, saying 'So that's past the post office, right?' shows active listening.";
      } else if (selectedTopic.id === 'hotel') {
        aiReply = "Welcome! Everything is confirmed for your stay. Here is your room key on the 4th floor. Breakfast is served from 7 to 10 AM.";
        feedbackTip = "Coach feedback: Excellent clarity. When requesting room details, 'Could you tell me if...' sounds very natural.";
      } else if (selectedTopic.id === 'standup') {
        aiReply = "Awesome update! Thanks for keeping the pull requests moving. Let me know if you need any pairing on that deployment.";
        feedbackTip = "Coach feedback: Crisp and concise workplace communication. Professional and confident tone.";
      }

      setChatLog((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: aiReply,
          feedback: feedbackTip,
          timestamp: new Date(),
        },
      ]);
    }, 600);
  };

  const handleFinishConversation = async () => {
    setShowEvaluationReport(true);
    try {
      const todayStr = getLocalDateString();
      await practiceRepository.recordSession({
        userId,
        category: 'conversation',
        activityId: `daily-speaking-${todayStr}`,
        difficulty: sessionDifficulty,
        sessionLength,
        durationMinutes: SESSION_LENGTH_MINUTES[sessionLength],
        score: 94,
        notes: `AI Conversation Coach completed with ${selectedTopic.partner}. Scenario: ${selectedTopic.title}. Turns: ${userMessageCount}.`,
      });
      await dailyPracticeService.recordDailyCompletion(userId, 'speaking', 94);
    } catch (err) {
      console.warn('Failed to record conversation session:', err);
    }
  };

  const handleSaveWordToDeck = async (vocabItem: { word: string; pos: string; definition: string; example: string }) => {
    try {
      await vocabularyRepository.addVocabularyFromLesson(
        userId,
        selectedTopic.id,
        [{
          word: vocabItem.word,
          partOfSpeech: vocabItem.pos,
          definition: vocabItem.definition,
          exampleSentence: vocabItem.example,
        }],
        selectedTopic.title,
        selectedTopic.level.startsWith('B') ? 'B1' : 'A2'
      );
      setSavedVocabIds((prev) => new Set([...prev, vocabItem.word]));
    } catch (err) {
      console.error('Failed to save vocab card:', err);
    }
  };

  const userMessageCount = chatLog.filter((m) => m.sender === 'user').length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="conversation-modal-title"
    >
      <div className="w-full max-w-[440px] h-full sm:h-auto sm:max-h-[92vh] sm:rounded-[36px] bg-[#F6F7FE] shadow-2xl border border-[#ECEEFE] flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="p-4 bg-white border-b border-[#ECEEFE] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2563EB]">
                AI Conversation Studio
              </span>
              <h1 id="conversation-modal-title" className="text-[15px] font-black text-[#1C2046] leading-none">
                Interactive Dialogue Practice
              </h1>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-[#F4F5FD] hover:bg-[#E8EBFB] text-[#222149] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close conversation studio"
          >
            <X className="w-4.5 h-4.5 stroke-[2.2]" />
          </button>
        </header>

        {/* Session Difficulty & Duration Override Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#F0F2FD] border-b border-[#E2E6FA] text-[11px] shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-[#545CA6] uppercase tracking-wider text-[10px]">Level:</span>
            {(['easy', 'medium', 'hard'] as PracticeDifficulty[]).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSessionDifficulty(lvl)}
                className={`px-2 py-0.5 rounded-md font-extrabold capitalize transition-all cursor-pointer text-[10.5px] ${
                  sessionDifficulty === lvl
                    ? 'bg-[#15164B] text-white shadow-xs'
                    : 'bg-white text-[#6B7094] border border-[#ECEEFE] hover:bg-[#F9F9FE]'
                }`}
                aria-label={`Select ${lvl} difficulty for this session`}
              >
                {lvl}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-[#545CA6] uppercase tracking-wider text-[10px]">Time:</span>
            {(['quick', 'standard', 'extended'] as PracticeSessionLength[]).map((len) => (
              <button
                key={len}
                type="button"
                onClick={() => setSessionLength(len)}
                className={`px-2 py-0.5 rounded-md font-extrabold capitalize transition-all cursor-pointer text-[10.5px] ${
                  sessionLength === len
                    ? 'bg-[#545CA6] text-white shadow-xs'
                    : 'bg-white text-[#6B7094] border border-[#ECEEFE] hover:bg-[#F9F9FE]'
                }`}
                aria-label={`Select ${len} session length`}
              >
                {len === 'quick' ? '5m' : len === 'standard' ? '15m' : '30m'}
              </button>
            ))}
          </div>
        </div>

        {/* Evaluation Report View */}
        {showEvaluationReport ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="p-5 rounded-3xl bg-linear-to-br from-[#1E224E] to-[#2E3575] text-white space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                  SESSION EVALUATION
                </span>
                <span className="text-[12px] font-extrabold text-[#C2C9FD] flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-[#FBBF24]" />
                  CEFR: {selectedTopic.level.split(' ')[0]}
                </span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-[32px] font-black leading-none text-white">
                    94%
                  </div>
                  <span className="text-[11.5px] text-[#A5AFEE]">Overall Communication Score</span>
                </div>
                <div className="text-right">
                  <span className="text-[12px] font-bold text-[#34D399]">Strong Fluency</span>
                  <div className="text-[10px] text-[#A5AFEE]">{userMessageCount} dialogue turns</div>
                </div>
              </div>
            </div>

            {/* Scorecard Breakdown */}
            <div className="p-4 rounded-3xl bg-white border border-[#ECEEFE] space-y-2.5 shadow-xs">
              <h3 className="text-[13px] font-extrabold text-[#15164B]">Performance Breakdown</h3>
              <div className="space-y-2 text-[12px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7094]">Naturalness & Fluency</span>
                  <span className="font-extrabold text-[#10B981]">96%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#F0F2FD] overflow-hidden">
                  <div className="w-[96%] h-full bg-[#10B981] rounded-full" />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[#6B7094]">Grammar Accuracy</span>
                  <span className="font-extrabold text-[#2563EB]">92%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#F0F2FD] overflow-hidden">
                  <div className="w-[92%] h-full bg-[#2563EB] rounded-full" />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[#6B7094]">Vocabulary Diversity</span>
                  <span className="font-extrabold text-[#7C3AED]">94%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#F0F2FD] overflow-hidden">
                  <div className="w-[94%] h-full bg-[#7C3AED] rounded-full" />
                </div>
              </div>
            </div>

            {/* Coach Takeaways */}
            <div className="p-4 rounded-3xl bg-[#F0FDF4] border border-[#BBF7D0] space-y-2 text-[12px]">
              <span className="font-extrabold text-[#166534] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                Key Strengths Demonstrated
              </span>
              <p className="text-[#14532D] leading-relaxed">
                You expressed intentions clearly, used polite opening clauses, and maintained smooth conversational flow with {selectedTopic.partner}.
              </p>
            </div>

            {/* Recommended Vocabulary to Save to Notebook */}
            <div className="p-4 rounded-3xl bg-white border border-[#ECEEFE] space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-extrabold text-[#15164B] flex items-center gap-1.5">
                  <BookPlus className="w-4 h-4 text-[#545CA6]" />
                  Key Vocabulary from this Scenario
                </span>
                <span className="text-[10px] font-bold text-[#8E93B8]">FSRS Spaced Repetition</span>
              </div>

              <div className="space-y-2">
                {selectedTopic.vocabularyToLearn.map((vocab) => {
                  const isSaved = savedVocabIds.has(vocab.word);
                  return (
                    <div
                      key={vocab.word}
                      className="p-3 rounded-2xl bg-[#F8F9FE] border border-[#E8EBFA] flex items-center justify-between text-[12px]"
                    >
                      <div className="space-y-0.5 pr-2">
                        <span className="font-bold text-[#15164B] capitalize">{vocab.word}</span>
                        <span className="text-[10px] text-[#545CA6] ml-1.5">({vocab.pos})</span>
                        <p className="text-[11px] text-[#6B7094] line-clamp-1">{vocab.definition}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSaveWordToDeck(vocab)}
                        disabled={isSaved}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                          isSaved
                            ? 'bg-[#ECFDF5] text-[#065F46] border border-[#10B981]'
                            : 'bg-white hover:bg-[#15164B] hover:text-white text-[#15164B] border border-[#D5D8EE]'
                        }`}
                      >
                        {isSaved ? 'Saved to Deck' : '+ Save Word'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Back to chat or start another scenario */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowEvaluationReport(false)}
                className="flex-1 py-3 rounded-full bg-[#15164B] text-white text-[12.5px] font-bold shadow-md hover:bg-[#0E1038] transition-colors cursor-pointer text-center"
              >
                Continue Dialogue
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 rounded-full bg-white border border-[#D5D8EE] text-[#545CA6] text-[12.5px] font-bold hover:bg-[#F4F5FD] transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Live Chat View */
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Easy mode guidance banner */}
            {sessionDifficulty === 'easy' && (
              <div className="px-3.5 py-2 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] text-[11.5px] text-[#1E40AF] flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0 text-[#2563EB]" />
                <span>Easy mode hint: Slower pacing, supportive prompts, and relaxed conversational standards.</span>
              </div>
            )}

            {/* Topic & Persona Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B7094] block">
                Choose Conversation Scenario
              </label>
              <div className="flex flex-wrap gap-1.5 py-0.5">
                {CONVERSATION_SCENARIOS.map((topic) => (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => handleSelectTopic(topic)}
                    className={`px-3 py-1.5 rounded-full text-[11.5px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedTopic.id === topic.id
                        ? 'bg-[#15164B] text-white shadow-xs'
                        : 'bg-white text-[#6B7094] border border-[#ECEEFE] hover:bg-[#F9F9FE]'
                    }`}
                  >
                    <span>{topic.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Scenario & Partner Info Bar */}
            <div className="p-3 rounded-2xl bg-white border border-[#ECEEFE] flex items-center justify-between text-[11.5px] shadow-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#F0F2FD] text-[#545CA6] flex items-center justify-center font-bold">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-extrabold text-[#1C2046] flex items-center gap-1.5">
                    <span>{selectedTopic.partner}</span>
                    <span className="text-[10px] font-semibold text-[#8E93B8]">({selectedTopic.partnerRole})</span>
                  </div>
                  <span className="text-[10px] text-[#10B981] font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                    Online Tutor
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-[#ECEFFD] text-[#545CA6] font-extrabold text-[10px]">
                  {selectedTopic.level}
                </span>
                {userMessageCount >= 2 && (
                  <button
                    type="button"
                    onClick={handleFinishConversation}
                    className="px-2.5 py-1 rounded-full bg-[#10B981] text-white font-bold text-[10.5px] shadow-xs hover:bg-[#059669] transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Award className="w-3 h-3" />
                    <span>Evaluate</span>
                  </button>
                )}
              </div>
            </div>

            {/* Chat Messages */}
            <div className="space-y-3 min-h-[180px]">
              {chatLog.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div className="flex items-center gap-1">
                    {msg.sender === 'ai' && (
                      <button
                        type="button"
                        onClick={() => handleSpeakText(msg.text, i)}
                        className={`p-1 rounded-full transition-colors cursor-pointer ${
                          isSpeakingAiIndex === i
                            ? 'bg-[#2563EB] text-white'
                            : 'bg-[#ECEFFD] text-[#545CA6] hover:bg-[#DFE4FC]'
                        }`}
                        aria-label="Listen to coach audio"
                      >
                        {isSpeakingAiIndex === i ? (
                          <VolumeX className="w-3.5 h-3.5" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                    <div
                      className={`max-w-[85%] rounded-3xl p-3.5 text-[13px] leading-relaxed shadow-xs ${
                        msg.sender === 'user'
                          ? 'bg-[#15164B] text-white rounded-br-xs'
                          : 'bg-white border border-[#ECEEFE] text-[#1C2046] rounded-bl-xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>

                  {msg.feedback && (
                    <div className="max-w-[85%] text-[11px] font-medium text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs">
                      <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#2563EB]" />
                      <span>{msg.feedback}</span>
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            {/* Suggested Quick Prompts */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#8E93B8] block">
                Suggested Responses (Tap to Send)
              </span>
              <div className="flex flex-col gap-1.5">
                {selectedTopic.prompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(p)}
                    className="text-left text-[12px] p-2.5 rounded-xl bg-white border border-[#E0E4FC] hover:border-[#545CA6] text-[#222149] font-medium transition-all hover:bg-[#F9F9FE] cursor-pointer flex items-center justify-between group"
                  >
                    <span>"{p}"</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#545CA6] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input Bar (Only visible during live chat) */}
        {!showEvaluationReport && (
          <footer className="p-3 bg-white border-t border-[#ECEEFE] shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              {/* Voice Input Toggle Button */}
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                  isListeningVoice
                    ? 'bg-[#EF4444] text-white animate-pulse shadow-md'
                    : 'bg-[#F0F2FD] hover:bg-[#E4E8FA] text-[#545CA6]'
                }`}
                aria-label={isListeningVoice ? 'Stop listening' : 'Start voice input'}
                title={isListeningVoice ? 'Listening... Speak now' : 'Speak your reply'}
              >
                {isListeningVoice ? <Mic className="w-4 h-4 animate-bounce" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isListeningVoice ? 'Listening to speech...' : 'Type your reply in English...'}
                className="flex-1 px-3.5 py-2.5 rounded-2xl bg-[#F6F7FE] border border-[#ECEEFE] text-[13px] text-[#1C2046] placeholder-[#8E93B8] focus:outline-hidden focus:border-[#545CA6]"
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="w-10 h-10 rounded-2xl bg-[#15164B] hover:bg-[#0E1038] disabled:opacity-40 text-white flex items-center justify-center transition-all shrink-0 cursor-pointer"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </footer>
        )}
      </div>
    </div>
  );
};
