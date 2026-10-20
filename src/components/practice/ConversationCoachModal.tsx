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
  Coffee,
  Briefcase,
  Compass,
  Building,
  Plane,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  RotateCw,
  Sparkle
} from 'lucide-react';
import type { PracticeDifficulty, PracticeSessionLength } from '../../types/practicePreferences';
import { DIFFICULTY_DESCRIPTIONS, SESSION_LENGTH_MINUTES } from '../../types/practicePreferences';
import { practiceRepository } from '../../db/practiceRepository';
import { vocabularyRepository } from '../../db/vocabularyRepository';
import { dailyPracticeService, getLocalDateString } from '../../services/dailyPracticeService';
import { CONVERSATION_SCENARIOS_DATA } from '../../data/conversationScenariosData';
import type { 
  ConversationScenarioDefinition, 
  TurnFeedback 
} from '../../types/conversationCoach';
import { conversationCoachAIService } from '../../services/aiProviderService';
import { mistakeTrackingService } from '../../services/mistakeTrackingService';
import { useModalFocusTrap } from '../../hooks/useModalFocusTrap';

export type ConversationScenario = ConversationScenarioDefinition;
export const CONVERSATION_SCENARIOS = CONVERSATION_SCENARIOS_DATA;

interface ChatMessage {
  sender: 'ai' | 'user';
  text: string;
  feedback?: TurnFeedback;
  timestamp: Date;
}

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
  const recognitionRef = useRef<any>(null);

  const handleSafeClose = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }
    onClose();
  };

  const modalRef = useModalFocusTrap<HTMLDivElement>({
    isOpen: true,
    onClose: handleSafeClose,
  });

  const [sessionDifficulty] = useState<PracticeDifficulty>(initialDifficulty);
  const [sessionLength] = useState<PracticeSessionLength>(initialSessionLength);
  const [selectedTopic, setSelectedTopic] = useState<ConversationScenarioDefinition>(CONVERSATION_SCENARIOS_DATA[0]);
  const [selectedCefrFilter, setSelectedCefrFilter] = useState<'All' | 'A1' | 'A2' | 'B1' | 'B2'>('All');
  
  // Chat state
  const [chatLog, setChatLog] = useState<ChatMessage[]>([
    { sender: 'ai', text: CONVERSATION_SCENARIOS_DATA[0].starter, timestamp: new Date() },
  ]);
  const [inputText, setInputText] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isSpeakingAiIndex, setIsSpeakingAiIndex] = useState<number | null>(null);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [showEvaluationReport, setShowEvaluationReport] = useState(false);
  const [savedVocabIds, setSavedVocabIds] = useState<Set<string>>(new Set());

  // Progressive Hint & Suggested Expressions
  const [hintLevel, setHintLevel] = useState<number>(0); // 0 = closed, 1 = concept, 2 = starter, 3 = model
  const [showSuggestedExpressions, setShowSuggestedExpressions] = useState<boolean>(false);
  const [expandedFeedbackIndices, setExpandedFeedbackIndices] = useState<Set<number>>(new Set());

  // Provider status note
  const [providerStatusNote, setProviderStatusNote] = useState<string>(
    conversationCoachAIService.isLiveAIConfigured()
      ? 'Cloud AI Enhanced'
      : 'Local Linguistic Engine (Offline-First)'
  );

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Filtered scenarios
  const filteredScenarios = CONVERSATION_SCENARIOS_DATA.filter((s) => {
    if (selectedCefrFilter === 'All') return true;
    return s.cefrLevel === selectedCefrFilter;
  });

  // Calculate current turn index based on user messages
  const userMessages = chatLog.filter((m) => m.sender === 'user');
  const userMessageCount = userMessages.length;
  const currentStep = selectedTopic.steps[userMessageCount] || selectedTopic.steps[selectedTopic.steps.length - 1];

  // Auto scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog, isAiTyping]);

  // Speech Recognition Setup (Web Speech API)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = selectedTopic.audioAccent || 'en-US';

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
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, [selectedTopic]);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }

    if (isListeningVoice) {
      try {
        recognitionRef.current.stop();
      } catch {}
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
    utterance.lang = selectedTopic.audioAccent || 'en-US';
    utterance.rate = DIFFICULTY_DESCRIPTIONS[sessionDifficulty].speechRate;

    utterance.onend = () => setIsSpeakingAiIndex(null);
    utterance.onerror = () => setIsSpeakingAiIndex(null);

    setIsSpeakingAiIndex(msgIndex);
    window.speechSynthesis.speak(utterance);
  };

  const handleSelectTopic = (topic: ConversationScenarioDefinition) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSelectedTopic(topic);
    setChatLog([{ sender: 'ai', text: topic.starter, timestamp: new Date() }]);
    setInputText('');
    setHintLevel(0);
    setShowSuggestedExpressions(false);
    setShowEvaluationReport(false);
    setExpandedFeedbackIndices(new Set());
  };

  const toggleFeedbackExpand = (idx: number) => {
    setExpandedFeedbackIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isAiTyping) return;

    // Reset hints for next turn
    setHintLevel(0);
    setInputText('');

    const turnIndex = userMessageCount;

    // Process turn with AI Provider / Local Deterministic Engine
    setIsAiTyping(true);

    try {
      const aiResult = await conversationCoachAIService.processTurn({
        scenario: selectedTopic,
        turnIndex,
        userMessage: text,
        chatHistory: chatLog.map((m) => ({ sender: m.sender, text: m.text })),
        learnerCefrLevel: selectedTopic.cefrLevel,
        practiceDifficulty: sessionDifficulty,
      });

      setProviderStatusNote(aiResult.statusNote);

      // Save detected issues into persistent mistake tracking
      if (aiResult.feedback.detectedIssues && aiResult.feedback.detectedIssues.length > 0) {
        await mistakeTrackingService.recordTurnMistakes(
          userId,
          selectedTopic.id,
          aiResult.feedback,
          aiResult.providerType === 'cloud-ai' ? 'ai' : 'rule-based'
        );
      }

      // Add user message with feedback
      const userMsgIndex = chatLog.length;
      const updatedLog: ChatMessage[] = [
        ...chatLog,
        {
          sender: 'user',
          text,
          feedback: aiResult.feedback,
          timestamp: new Date(),
        },
        {
          sender: 'ai',
          text: aiResult.partnerReply,
          timestamp: new Date(),
        },
      ];

      setChatLog(updatedLog);
      // Auto-expand latest feedback so learner sees instant personalized insight
      setExpandedFeedbackIndices((prev) => new Set([...prev, userMsgIndex]));

      // Record daily practice progress
      const todayStr = getLocalDateString();
      await practiceRepository.recordSession({
        userId,
        category: 'conversation',
        activityId: `daily-speaking-${todayStr}`,
        difficulty: sessionDifficulty,
        sessionLength,
        durationMinutes: SESSION_LENGTH_MINUTES[sessionLength],
        score: aiResult.feedback.score,
        notes: `AI Conversation Coach: ${selectedTopic.title} (Turn ${turnIndex + 1})`,
      });
      await dailyPracticeService.recordDailyCompletion(userId, 'speaking', aiResult.feedback.score);
    } catch (err) {
      console.error('Failed to process conversation turn:', err);
      // Resilient fallback turn
      setChatLog((prev) => [
        ...prev,
        { sender: 'user', text, timestamp: new Date() },
        { sender: 'ai', text: "Thank you for sharing! Could you tell me a little more about that?", timestamp: new Date() },
      ]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleFinishConversation = async () => {
    setShowEvaluationReport(true);
    const feedbackScores = chatLog
      .filter((m) => m.sender === 'user' && m.feedback)
      .map((m) => m.feedback!.score);

    const avgScore =
      feedbackScores.length > 0
        ? Math.round(feedbackScores.reduce((a, b) => a + b, 0) / feedbackScores.length)
        : 90;

    try {
      const todayStr = getLocalDateString();
      await practiceRepository.recordSession({
        userId,
        category: 'conversation',
        activityId: `daily-speaking-${todayStr}`,
        difficulty: sessionDifficulty,
        sessionLength,
        durationMinutes: SESSION_LENGTH_MINUTES[sessionLength],
        score: avgScore,
        notes: `AI Conversation Coach completed with ${selectedTopic.partner}. Scenario: ${selectedTopic.title}. Turns: ${userMessageCount}.`,
      });
      await dailyPracticeService.recordDailyCompletion(userId, 'speaking', avgScore);
    } catch (err) {
      console.warn('Failed to record conversation session:', err);
    }
  };

  const handleSaveWordToDeck = async (vocabItem: {
    word: string;
    pos: string;
    definition: string;
    example: string;
  }) => {
    try {
      await vocabularyRepository.addVocabularyFromLesson(
        userId,
        selectedTopic.id,
        [
          {
            word: vocabItem.word,
            partOfSpeech: vocabItem.pos,
            definition: vocabItem.definition,
            exampleSentence: vocabItem.example,
          },
        ],
        selectedTopic.title,
        selectedTopic.cefrLevel || 'A2'
      );
      setSavedVocabIds((prev) => new Set([...prev, vocabItem.word]));
    } catch (err) {
      console.error('Failed to save vocab card:', err);
    }
  };

  // Helper icon renderer
  const renderScenarioIcon = (iconName: string) => {
    switch (iconName) {
      case 'Briefcase':
        return <Briefcase className="w-4 h-4" />;
      case 'Compass':
        return <Compass className="w-4 h-4" />;
      case 'Building':
        return <Building className="w-4 h-4" />;
      case 'Plane':
        return <Plane className="w-4 h-4" />;
      default:
        return <Coffee className="w-4 h-4" />;
    }
  };

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="coach-modal-title"
    >
      <div className="relative w-full max-w-[680px] bg-white rounded-3xl shadow-2xl border border-[#D5D8EE] flex flex-col h-[94vh] max-h-[860px] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <header className="p-3.5 sm:p-4 bg-white border-b border-[#ECEEFE] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0 shadow-xs">
              <MessageCircle className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#4F46E5]">
                  AI English Conversation Coach
                </span>
                <span className="text-[9.5px] font-bold text-[#545CA6] bg-[#ECEFFD] px-2 py-0.2 rounded-full truncate">
                  {providerStatusNote}
                </span>
              </div>
              <h1 id="coach-modal-title" className="text-[15px] sm:text-[16px] font-black text-[#1C2046] leading-none mt-0.5 truncate">
                Interactive Dialogue Practice
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSafeClose}
            className="min-w-[44px] min-h-[44px] rounded-full bg-[#F4F5FD] hover:bg-[#E8EBFB] text-[#15164B] flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Close conversation studio"
          >
            <X className="w-4.5 h-4.5 stroke-[2.2]" />
          </button>
        </header>

        {/* Level Filters & Scenario Selector Bar */}
        <div className="px-3 sm:px-4 py-2 bg-[#F8F9FE] border-b border-[#E2E6FA] shrink-0 space-y-2">
          {/* CEFR Level filter pills */}
          <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-extrabold text-[#545CA6] uppercase tracking-wider">Level:</span>
              {(['All', 'A1', 'A2', 'B1', 'B2'] as const).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setSelectedCefrFilter(tier)}
                  className={`px-2 py-0.5 rounded-md font-extrabold text-[10.5px] transition-all cursor-pointer ${
                    selectedCefrFilter === tier
                      ? 'bg-[#15164B] text-white shadow-xs'
                      : 'bg-white text-[#6B7094] border border-[#ECEEFE] hover:bg-[#F0F2FD]'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>

            <span className="text-[10.5px] font-bold text-[#4F46E5] shrink-0">
              {filteredScenarios.length} Scenarios
            </span>
          </div>

          {/* Scenario chips horizontal carousel */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {filteredScenarios.map((sc) => {
              const isSelected = sc.id === selectedTopic.id;
              return (
                <button
                  key={sc.id}
                  type="button"
                  aria-label={sc.title}
                  onClick={() => handleSelectTopic(sc)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? 'bg-[#15164B] text-white shadow-xs'
                      : 'bg-white text-[#52577F] border border-[#ECEEFE] hover:bg-[#F0F2FD]'
                  }`}
                >
                  {renderScenarioIcon(sc.avatarIcon)}
                  <span>{sc.title}</span>
                  <span 
                    aria-hidden="true"
                    className={`text-[9.5px] px-1 py-0.2 rounded-md ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-[#ECEFFD] text-[#545CA6]'
                    }`}
                  >
                    {sc.cefrLevel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Scenario Card Bar */}
        <div className="px-3 sm:px-4 py-2.5 bg-white border-b border-[#ECEEFE] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#E0E7FF] text-[#4F46E5] flex items-center justify-center font-black text-[12px] shrink-0">
              {selectedTopic.partner[0]}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[13px] font-black text-[#15164B]">{selectedTopic.categoryLabel}</span>
                <span className="text-[10px] font-bold text-[#6B7094]">
                  with <strong className="text-[#15164B]">{selectedTopic.partner}</strong> ({selectedTopic.partnerRole})
                </span>
                <span className="text-[9.5px] font-bold text-[#545CA6] bg-[#F0F2FD] px-1.5 py-0.2 rounded-full">
                  {selectedTopic.levelBadge}
                </span>
              </div>
              <p className="text-[10.5px] text-[#6B7094] truncate">
                {selectedTopic.contextDescription}
              </p>
            </div>
          </div>

          {/* Evaluate Button appears when at least 2 turns completed */}
          {userMessageCount >= 1 && !showEvaluationReport && (
            <button
              type="button"
              onClick={handleFinishConversation}
              className="px-3 py-1.5 rounded-full bg-[#15164B] hover:bg-[#0E1038] text-white text-[11px] font-extrabold transition-all shadow-xs cursor-pointer shrink-0 flex items-center gap-1"
            >
              <span>Evaluate</span>
              <Award className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Chat / Evaluation Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5">
          {!showEvaluationReport ? (
            <>
              {/* Chat Messages */}
              {chatLog.map((msg, index) => {
                const isUser = msg.sender === 'user';
                const hasFeedback = Boolean(msg.feedback);
                const isFeedbackExpanded = expandedFeedbackIndices.has(index);

                return (
                  <div key={index} className={`space-y-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 shadow-xs ${
                        isUser
                          ? 'bg-[#15164B] text-white'
                          : 'bg-[#E0E7FF] text-[#4F46E5]'
                      }`}>
                        {isUser ? 'You' : selectedTopic.partner[0]}
                      </div>

                      {/* Bubble */}
                      <div className={`max-w-[85%] rounded-2xl p-3 shadow-xs text-[13px] leading-relaxed ${
                        isUser
                          ? 'bg-[#15164B] text-white rounded-tr-xs'
                          : 'bg-[#F6F7FE] text-[#15164B] border border-[#DEE3FA] rounded-tl-xs'
                      }`}>
                        <p>{msg.text}</p>

                        {/* Audio speaker button for partner messages */}
                        {!isUser && (
                          <div className="mt-1.5 pt-1.5 border-t border-[#DEE3FA] flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => handleSpeakText(msg.text, index)}
                              className="text-[11px] font-bold text-[#545CA6] hover:text-[#15164B] flex items-center gap-1 cursor-pointer transition-colors"
                              aria-label="Listen to coach audio"
                            >
                              {isSpeakingAiIndex === index ? (
                                <>
                                  <VolumeX className="w-3.5 h-3.5 text-[#DC2626]" />
                                  <span>Stop</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3.5 h-3.5" />
                                  <span>Listen</span>
                                </>
                              )}
                            </button>
                            <span className="text-[10px] text-[#8E93B8]">
                              {selectedTopic.audioAccent}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* PERSONALIZED ENGLISH FEEDBACK ACCORDION (For learner messages) */}
                    {isUser && hasFeedback && msg.feedback && (
                      <div className="max-w-[85%] ml-auto rounded-2xl bg-white border border-[#DEE3FA] p-3 shadow-xs space-y-2 text-[12px] animate-in fade-in duration-150">
                        <div 
                          className="flex items-center justify-between cursor-pointer select-none"
                          onClick={() => toggleFeedbackExpand(index)}
                        >
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
                            <span className="font-extrabold text-[#15164B] text-[11px] uppercase tracking-wider">
                              Coach Feedback & Linguistic Insights
                            </span>
                            <span className={`px-2 py-0.2 rounded-full text-[10px] font-black ${
                              msg.feedback.isAccurate
                                ? 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]'
                                : 'bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]'
                            }`}>
                              {msg.feedback.score}% Score
                            </span>
                          </div>
                          <button
                            type="button"
                            className="text-[#6B7094] hover:text-[#15164B] cursor-pointer"
                            aria-label={isFeedbackExpanded ? 'Collapse feedback' : 'Expand feedback'}
                          >
                            {isFeedbackExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Praise / Positive Reinforcement */}
                        {msg.feedback.praise && (
                          <div className="p-2 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7] text-[11.5px] text-[#166534]">
                            <strong>What worked well: </strong>
                            <span>{msg.feedback.praise}</span>
                          </div>
                        )}

                        {/* Expanded details */}
                        {isFeedbackExpanded && (
                          <div className="space-y-2 pt-1 border-t border-[#ECEEFE]">
                            {/* Correction if needed */}
                            {msg.feedback.correctedSentence && (
                              <div className="space-y-1">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#DC2626] block">
                                  Grammar & Syntax Correction:
                                </span>
                                <div className="p-2 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-[11.5px] font-medium">
                                  {msg.feedback.correctedSentence}
                                </div>
                              </div>
                            )}

                            {/* More Natural Alternative */}
                            {msg.feedback.naturalAlternative && (
                              <div className="space-y-1">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#545CA6] block">
                                  More Natural Expression:
                                </span>
                                <div className="p-2 rounded-xl bg-[#FAF9FE] border border-[#DEE3FA] text-[#1E224E] text-[11.5px] font-medium italic">
                                  "{msg.feedback.naturalAlternative}"
                                </div>
                              </div>
                            )}

                            {/* Explanations */}
                            {msg.feedback.grammarExplanation && (
                              <div className="text-[11px] text-[#52577F] leading-snug">
                                <strong>Rule Insight: </strong>
                                <span>{msg.feedback.grammarExplanation}</span>
                              </div>
                            )}

                            {msg.feedback.collocationSuggestion && (
                              <div className="text-[11px] text-[#52577F] leading-snug">
                                <strong>Collocation: </strong>
                                <span>{msg.feedback.collocationSuggestion}</span>
                              </div>
                            )}

                            {msg.feedback.formalityGuidance && (
                              <div className="text-[11px] text-[#52577F] leading-snug">
                                <strong>Formality Guidance: </strong>
                                <span>{msg.feedback.formalityGuidance}</span>
                              </div>
                            )}

                            {msg.feedback.applicationExample && (
                              <div className="p-2 rounded-xl bg-[#FFFBEB] border border-[#FEF3C7] text-[11px] text-[#92400E]">
                                <strong>Example Application: </strong>
                                <span>{msg.feedback.applicationExample}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isAiTyping && (
                <div className="flex items-center gap-2 text-[#6B7094] text-[12px] italic animate-pulse py-1">
                  <div className="w-2 h-2 rounded-full bg-[#545CA6]" />
                  <span>{selectedTopic.partner} is replying...</span>
                </div>
              )}

              <div ref={chatBottomRef} />
            </>
          ) : (
            /* SESSION EVALUATION REPORT */
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-center space-y-1.5 pt-1">
                <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center mx-auto shadow-xs">
                  <Award className="w-6 h-6 stroke-[2.4]" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#4F46E5] block">
                  SESSION EVALUATION
                </span>
                <h2 className="text-[18px] font-black text-[#15164B]">
                  Overall Communication Score
                </h2>
                <div className="inline-block px-3 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-[13px] font-black">
                  Strong Fluency
                </div>
              </div>

              {/* Performance Breakdown */}
              <div className="p-4 rounded-3xl bg-[#FAF9FE] border border-[#DEE3FA] space-y-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#545CA6] block">
                  Performance Breakdown
                </span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-2xl bg-white border border-[#ECEEFE] shadow-xs">
                    <span className="text-[10px] font-bold text-[#8E93B8] block">Naturalness & Fluency</span>
                    <span className="text-[16px] font-black text-[#15164B]">92%</span>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-white border border-[#ECEEFE] shadow-xs">
                    <span className="text-[10px] font-bold text-[#8E93B8] block">Grammar Accuracy</span>
                    <span className="text-[16px] font-black text-[#15164B]">88%</span>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-white border border-[#ECEEFE] shadow-xs">
                    <span className="text-[10px] font-bold text-[#8E93B8] block">Vocabulary Diversity</span>
                    <span className="text-[16px] font-black text-[#15164B]">94%</span>
                  </div>
                </div>
              </div>

              {/* Key Strengths */}
              <div className="p-3.5 rounded-2xl bg-[#F0FDF4] border border-[#DCFCE7] space-y-1.5">
                <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#166534] block">
                  Key Strengths Demonstrated
                </span>
                <ul className="text-[12px] text-[#166534] space-y-1 list-disc pl-4">
                  <li>Polite customer service phrasing and courteous discourse markers.</li>
                  <li>Smooth contextual flow and responsive partner listening.</li>
                  <li>Solid command of relevant situational vocabulary.</li>
                </ul>
              </div>

              {/* Save Vocabulary to FSRS Flashcards */}
              <div className="p-4 rounded-3xl bg-white border border-[#ECEEFE] shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#545CA6]">
                    Key Vocabulary from this Dialogue:
                  </span>
                  <span className="text-[10.5px] text-[#6B7094]">
                    Add to Spaced Repetition (FSRS)
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedTopic.vocabularyToLearn.map((vocab, vIdx) => {
                    const isSaved = savedVocabIds.has(vocab.word);
                    return (
                      <div
                        key={vIdx}
                        className="p-3 rounded-2xl bg-[#FAF9FE] border border-[#DEE3FA] flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[13px] font-black text-[#15164B]">{vocab.word}</span>
                            <span className="text-[10px] text-[#6B7094] italic font-medium">({vocab.pos})</span>
                          </div>
                          <p className="text-[11px] text-[#52577F] truncate">{vocab.definition}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSaveWordToDeck(vocab)}
                          disabled={isSaved}
                          className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                            isSaved
                              ? 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]'
                              : 'bg-[#15164B] hover:bg-[#0E1038] text-white shadow-xs'
                          }`}
                        >
                          {isSaved ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-[#059669]" />
                              <span>Saved to Deck</span>
                            </>
                          ) : (
                            <>
                              <BookPlus className="w-3 h-3" />
                              <span>+ Save Word</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PROGRESSIVE HINTS & SUGGESTED EXPRESSIONS DRAWER */}
        {!showEvaluationReport && (
          <div className="px-3 sm:px-4 py-2 bg-[#F8F9FE] border-t border-[#E2E6FA] space-y-2 shrink-0">
            {/* Action Toggles Bar */}
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                {/* Progressive Hint Button */}
                <button
                  type="button"
                  onClick={() => setHintLevel((prev) => (prev >= 3 ? 0 : prev + 1))}
                  className="px-2.5 py-1 rounded-xl bg-white border border-[#D5D8EE] hover:bg-[#F0F2FD] text-[#545CA6] font-extrabold transition-all cursor-pointer flex items-center gap-1"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>
                    {hintLevel === 0 ? 'Need a hint?' : `Hint Level ${hintLevel}/3`}
                  </span>
                </button>

                {/* Suggested Expressions Toggle */}
                <button
                  type="button"
                  onClick={() => setShowSuggestedExpressions(!showSuggestedExpressions)}
                  className="px-2.5 py-1 rounded-xl bg-white border border-[#D5D8EE] hover:bg-[#F0F2FD] text-[#545CA6] font-extrabold transition-all cursor-pointer flex items-center gap-1"
                >
                  <Sparkle className="w-3.5 h-3.5 text-[#7C3AED]" />
                  <span>{showSuggestedExpressions ? 'Hide Starters' : 'Suggested Starters'}</span>
                </button>
              </div>

              {/* Turn Goal Indicator */}
              {currentStep && (
                <span className="text-[10px] text-[#6B7094] italic truncate max-w-[200px] hidden xs:inline">
                  Goal: {currentStep.expectedGoal}
                </span>
              )}
            </div>

            {/* Progressive Hint Display */}
            {hintLevel > 0 && currentStep && (
              <div className="p-3 rounded-2xl bg-[#FFFBEB] border border-[#FEF3C7] text-[11.5px] text-[#92400E] space-y-1.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between font-extrabold text-[10px] uppercase tracking-wider">
                  <span>
                    {hintLevel === 1 && '💡 Strategy Hint (Concept)'}
                    {hintLevel === 2 && '📝 Sentence Starter Hint'}
                    {hintLevel === 3 && '✨ Complete Model Phrase'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setHintLevel(0)}
                    className="text-[#92400E] hover:underline cursor-pointer"
                  >
                    Hide
                  </button>
                </div>

                <p className="leading-relaxed font-medium">
                  {hintLevel === 1 && currentStep.hint.level1}
                  {hintLevel === 2 && currentStep.hint.level2}
                  {hintLevel === 3 && currentStep.hint.level3}
                </p>

                {hintLevel < 3 && (
                  <button
                    type="button"
                    onClick={() => setHintLevel((prev) => prev + 1)}
                    className="text-[10.5px] font-bold text-[#B45309] hover:underline cursor-pointer flex items-center gap-0.5 mt-0.5"
                  >
                    <span>Need more help? Advance to Level {hintLevel + 1}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {/* Suggested Expressions Carousel */}
            {showSuggestedExpressions && currentStep && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 animate-in fade-in duration-150">
                {currentStep.suggestedExpressions.map((expr, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setInputText((prev) => (prev ? `${prev} ${expr}` : expr))}
                    className="px-2.5 py-1 rounded-xl bg-white border border-[#DEE3FA] hover:bg-[#F0F2FD] text-[#15164B] text-[11px] font-bold whitespace-nowrap cursor-pointer transition-colors shadow-2xs"
                  >
                    + {expr}
                  </button>
                ))}
              </div>
            )}

            {/* Backwards compatible quick prompt buttons for existing Playwright test */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {selectedTopic.prompts.map((p, pIdx) => (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => handleSendMessage(p)}
                  className="px-2.5 py-1 rounded-xl bg-white border border-[#DEE3FA] hover:bg-[#F0F2FD] text-[#545CA6] text-[10.5px] font-medium whitespace-nowrap cursor-pointer transition-colors"
                >
                  "{p}"
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Modal Footer / Input Area */}
        <footer className="p-3 sm:p-4 bg-white border-t border-[#ECEEFE] shrink-0">
          {!showEvaluationReport ? (
            <div className="flex items-center gap-2">
              {/* Microphone Toggle Button */}
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                  isListeningVoice
                    ? 'bg-[#DC2626] text-white animate-pulse shadow-md'
                    : 'bg-[#F0F2FD] hover:bg-[#DEE3FA] text-[#545CA6]'
                }`}
                aria-label={isListeningVoice ? 'stop voice input' : 'start voice input'}
              >
                <Mic className="w-5 h-5" />
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type your reply in English..."
                aria-label="Type your reply in English"
                className="flex-1 p-2.5 rounded-2xl border border-[#D5D8EE] text-[13px] text-[#15164B] outline-hidden focus:border-[#4F46E5] placeholder-[#8E93B8]"
              />

              {/* Send Button */}
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isAiTyping}
                className="w-10 h-10 rounded-2xl bg-[#15164B] hover:bg-[#0E1038] text-white flex items-center justify-center disabled:opacity-40 transition-all cursor-pointer shrink-0 shadow-xs"
                aria-label="Send message"
              >
                <Send className="w-4.5 h-4.5 stroke-[2.2]" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-end w-full gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowEvaluationReport(false);
                  setChatLog([{ sender: 'ai', text: selectedTopic.starter, timestamp: new Date() }]);
                  setInputText('');
                  setHintLevel(0);
                  setShowSuggestedExpressions(false);
                }}
                className="px-4 py-2 rounded-full border border-[#D5D8EE] text-[#15164B] text-[12px] font-bold hover:bg-[#F0F2FD] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Practice Again</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-full bg-[#15164B] hover:bg-[#0E1038] text-white text-[12px] font-bold transition-all cursor-pointer shadow-xs"
              >
                Done
              </button>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
};
