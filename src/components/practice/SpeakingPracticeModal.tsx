import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  MicOff,
  Volume2,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Award,
  Sparkles,
  ArrowRight,
  Edit3,
  Send,
  ShieldCheck,
} from 'lucide-react';
import type { PracticeDifficulty, PracticeSessionLength } from '../../types/practicePreferences';
import { SESSION_LENGTH_MINUTES } from '../../types/practicePreferences';
import { practiceRepository } from '../../db/practiceRepository';
import { dailyPracticeService, getLocalDateString } from '../../services/dailyPracticeService';
import { SPEAKING_PROMPTS, type SpeakingPrompt } from '../../data/speakingData';
import {
  evaluateSpokenResponse,
  type SpokenEvaluationResult,
} from '../../services/speakingEvaluationService';
import { useModalFocusTrap } from '../../hooks/useModalFocusTrap';

interface SpeakingPracticeModalProps {
  userId?: string;
  initialDifficulty?: PracticeDifficulty;
  initialSessionLength?: PracticeSessionLength;
  onClose: () => void;
  onNavigateToExplore?: () => void;
}

export const SpeakingPracticeModal: React.FC<SpeakingPracticeModalProps> = ({
  userId = 'local-learner-1',
  initialDifficulty = 'medium',
  initialSessionLength = 'standard',
  onClose,
  onNavigateToExplore: _onNavigateToExplore,
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

  const [selectedPromptIndex, setSelectedPromptIndex] = useState(0);
  const [selectedCefrFilter, setSelectedCefrFilter] = useState<'All' | 'A1' | 'A2' | 'B1' | 'B2'>('All');
  
  // Audio Playback
  const [isPlayingModel, setIsPlayingModel] = useState(false);
  
  // Speech Recognition States: 'idle' | 'listening' | 'evaluating' | 'denied' | 'unsupported'
  const [micState, setMicState] = useState<'idle' | 'listening' | 'evaluating' | 'denied' | 'unsupported'>('idle');
  const [micErrorNote, setMicErrorNote] = useState<string | null>(null);
  
  // Input & Evaluation
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [textInputFallback, setTextInputFallback] = useState('');
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [evaluation, setEvaluation] = useState<SpokenEvaluationResult | null>(null);
  const [promptAttempts, setPromptAttempts] = useState(0);

  // Session Tracking
  const [completedScores, setCompletedScores] = useState<number[]>([]);
  const [isSessionFinished, setIsSessionFinished] = useState(false);
  const [totalAttemptsCount, setTotalAttemptsCount] = useState(0);

  // Filtered prompts
  const activePrompts = React.useMemo(() => {
    if (selectedCefrFilter === 'All') return SPEAKING_PROMPTS;
    return SPEAKING_PROMPTS.filter((p) => p.cefrLevel === selectedCefrFilter);
  }, [selectedCefrFilter]);

  const currentPrompt: SpeakingPrompt = activePrompts[selectedPromptIndex] || activePrompts[0] || SPEAKING_PROMPTS[0];

  useEffect(() => {
    // Check speech recognition capability
    if (typeof window !== 'undefined') {
      const hasSpeechRecognition =
        'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
      if (!hasSpeechRecognition) {
        setMicState('unsupported');
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
  }, []);

  // Listen to Model Audio using SpeechSynthesis
  const handlePlayModelAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (isPlayingModel) {
        window.speechSynthesis.cancel();
        setIsPlayingModel(false);
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentPrompt.modelResponse);
      utterance.lang = currentPrompt.audioAccent || 'en-US';
      utterance.rate = initialDifficulty === 'easy' ? 0.85 : 1.0;
      utterance.onend = () => setIsPlayingModel(false);
      utterance.onerror = () => setIsPlayingModel(false);
      setIsPlayingModel(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Toggle Microphone Recording
  const handleStartRecording = () => {
    setMicErrorNote(null);
    const SpeechRecognition =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognition) {
      setMicState('unsupported');
      return;
    }

    if (micState === 'listening') {
      // Stop recording early
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = currentPrompt.audioAccent || 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setMicState('listening');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = 0; i < event.results.length; i++) {
          const transcriptChunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcriptChunk;
          } else {
            interim += transcriptChunk;
          }
        }
        const text = (final || interim).trim();
        setSpokenTranscript(text);
      };

      recognition.onerror = (e: any) => {
        if (e.error === 'not-allowed' || e.error === 'permission-denied') {
          setMicState('denied');
          setMicErrorNote(
            'Microphone access was denied. Please allow microphone permissions in your browser or type your response in the text field below.'
          );
        } else {
          setMicState('idle');
          setMicErrorNote('Could not detect speech. Please speak closer to your microphone or use the text fallback.');
        }
      };

      recognition.onend = () => {
        setMicState('idle');
        // If we captured speech, evaluate it automatically
        if (spokenTranscript.trim()) {
          runEvaluation(spokenTranscript);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setMicState('idle');
      setMicErrorNote('Failed to initialize speech recognition. Use the text fallback below.');
    }
  };

  // Run Linguistic Evaluation on Text
  const runEvaluation = (textToEvaluate: string) => {
    if (!textToEvaluate.trim()) return;
    const result = evaluateSpokenResponse(textToEvaluate, currentPrompt);
    setEvaluation(result);
    setTotalAttemptsCount((prev) => prev + 1);
    setPromptAttempts((prev) => prev + 1);
  };

  // Submit Text Fallback
  const handleSubmitTextFallback = () => {
    if (!textInputFallback.trim()) return;
    setSpokenTranscript(textInputFallback);
    runEvaluation(textInputFallback);
  };

  // Retry Prompt Without Penalty
  const handleRetryWithoutPenalty = () => {
    setSpokenTranscript('');
    setTextInputFallback('');
    setEvaluation(null);
    setIsEditingTranscript(false);
    setMicErrorNote(null);
  };

  // Next Prompt or Finish
  const handleNextPrompt = () => {
    if (evaluation) {
      setCompletedScores((prev) => [...prev, evaluation.overallScore]);
    }

    if (selectedPromptIndex + 1 < activePrompts.length) {
      setSelectedPromptIndex((prev) => prev + 1);
      setSpokenTranscript('');
      setTextInputFallback('');
      setEvaluation(null);
      setIsEditingTranscript(false);
      setPromptAttempts(0);
      setMicErrorNote(null);
    } else {
      finishSpeakingSession();
    }
  };

  // Finish Studio Session & Persist
  const finishSpeakingSession = async () => {
    setIsSessionFinished(true);
    const allScores = evaluation ? [...completedScores, evaluation.overallScore] : completedScores;
    const avgScore =
      allScores.length > 0
        ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
        : 80;

    try {
      const todayStr = getLocalDateString();
      await practiceRepository.recordSession({
        userId,
        category: 'conversation',
        activityId: `daily-speaking-${todayStr}`,
        difficulty: initialDifficulty,
        sessionLength: initialSessionLength,
        durationMinutes: SESSION_LENGTH_MINUTES[initialSessionLength],
        score: avgScore,
        notes: `Speaking & Pronunciation Studio completed. Prompts: ${allScores.length}. Attempts: ${totalAttemptsCount || 1}. Accuracy: ${avgScore}%. CEFR: ${currentPrompt.cefrLevel}.`,
      });
      await dailyPracticeService.recordDailyCompletion(userId, 'speaking', avgScore);
    } catch (err) {
      console.warn('Failed to record speaking session:', err);
    }
  };

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="speaking-modal-title"
    >
      <div className="relative w-full max-w-[620px] bg-white rounded-3xl shadow-2xl border border-[#D5D8EE] flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <header className="p-4 bg-white border-b border-[#ECEEFE] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center shadow-xs">
              <Mic className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#E11D48]">
                  Speaking & Pronunciation Studio
                </span>
                <span className="text-[9.5px] font-bold text-[#545CA6] bg-[#ECEFFD] px-1.5 py-0.2 rounded-full">
                  {currentPrompt.levelBadge}
                </span>
              </div>
              <h1 id="speaking-modal-title" className="text-[15px] font-black text-[#1C2046] leading-none mt-0.5">
                Spoken Fluency & Rhythm Coach
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSafeClose}
            className="min-w-[44px] min-h-[44px] rounded-full bg-[#F4F5FD] hover:bg-[#E8EBFB] text-[#15164B] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close speaking studio"
          >
            <X className="w-4.5 h-4.5 stroke-[2.2]" />
          </button>
        </header>

        {/* Level Filters Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#F0F2FD] border-b border-[#E2E6FA] text-[11px] shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-[#545CA6] uppercase tracking-wider text-[10px]">Tier:</span>
            {(['All', 'A1', 'A2', 'B1', 'B2'] as const).map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => {
                  setSelectedCefrFilter(tier);
                  setSelectedPromptIndex(0);
                  handleRetryWithoutPenalty();
                }}
                className={`px-2 py-0.5 rounded-md font-extrabold transition-all cursor-pointer text-[10.5px] ${
                  selectedCefrFilter === tier
                    ? 'bg-[#15164B] text-white shadow-xs'
                    : 'bg-white text-[#6B7094] border border-[#ECEEFE] hover:bg-[#F9F9FE]'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 text-[10.5px] text-[#545CA6] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
            <span>Local Processing Only</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!isSessionFinished ? (
            <>
              {/* Prompt Card */}
              <div className="p-4.5 rounded-3xl bg-[#FAF9FE] border border-[#ECEEFE] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6B7094]">
                    Scenario Prompt ({selectedPromptIndex + 1}/{activePrompts.length})
                  </span>
                  <span className="text-[11px] font-bold text-[#E11D48] bg-[#FFF1F2] border border-[#FFE4E6] px-2 py-0.5 rounded-full capitalize">
                    {currentPrompt.category}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-black text-[#545CA6] block mb-0.5">
                    {currentPrompt.title}
                  </span>
                  <h2 className="text-[16px] font-black text-[#15164B] leading-snug">
                    {currentPrompt.prompt}
                  </h2>
                  <p className="text-[12px] text-[#6B7094] mt-1 italic">
                    Context: {currentPrompt.context}
                  </p>
                </div>

                {/* Model Response & Audio Player */}
                <div className="p-3.5 rounded-2xl bg-white border border-[#E2E6FA] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#545CA6] flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#7C3AED]" />
                      <span>Model Response ({currentPrompt.audioAccent})</span>
                    </span>
                    <button
                      type="button"
                      onClick={handlePlayModelAudio}
                      className="text-[11px] font-bold text-[#545CA6] hover:text-[#15164B] flex items-center gap-1 cursor-pointer transition-colors"
                      aria-label="Listen to model audio response"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isPlayingModel ? 'Playing...' : 'Listen to Model'}</span>
                    </button>
                  </div>
                  <p className="text-[13px] font-medium text-[#1E224E] leading-relaxed">
                    "{currentPrompt.modelResponse}"
                  </p>

                  {/* Target Key Phrases */}
                  <div className="pt-2 border-t border-[#ECEEFE]">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8E93B8] block mb-1">
                      Target Key Phrases:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {currentPrompt.targetKeyPhrases.map((phrase, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-[#F0F2FD] border border-[#DEE3FA] text-[#15164B] text-[11px] font-bold"
                        >
                          {phrase}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Pronunciation & Cadence Tip */}
                <div className="p-3 rounded-2xl bg-[#FFFBEB] border border-[#FEF3C7] text-[11.5px] text-[#92400E] space-y-0.5">
                  <span className="font-extrabold block text-[10.5px] uppercase tracking-wider">
                    Rhythm & Pronunciation Tip:
                  </span>
                  <p>{currentPrompt.pronunciationTips}</p>
                </div>
              </div>

              {/* Microphone & Spoken Practice Section */}
              <div className="p-4 rounded-3xl bg-white border border-[#ECEEFE] shadow-xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-[14px] font-extrabold text-[#15164B]">
                    Your Spoken Response
                  </h3>
                  <span className="text-[10.5px] font-semibold text-[#6B7094]">
                    {promptAttempts > 0 ? `Attempt #${promptAttempts + 1}` : 'Ready to record'}
                  </span>
                </div>

                {/* Permission Warning / Error Note */}
                {micErrorNote && (
                  <div className="p-3 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-[11.5px] text-[#991B1B] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{micErrorNote}</span>
                  </div>
                )}

                {/* Recording Button */}
                <div className="text-center py-2 space-y-2">
                  <button
                    type="button"
                    onClick={handleStartRecording}
                    className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center transition-all shadow-md cursor-pointer ${
                      micState === 'listening'
                        ? 'bg-[#EF4444] text-white ring-8 ring-[#FEE2E2] animate-pulse'
                        : 'bg-[#15164B] text-white hover:bg-[#0E1038] hover:scale-105'
                    }`}
                    aria-label="Tap to speak into microphone"
                  >
                    {micState === 'listening' ? (
                      <MicOff className="w-7 h-7 stroke-[2.2]" />
                    ) : (
                      <Mic className="w-7 h-7 stroke-[2.2]" />
                    )}
                  </button>

                  <span className="text-[12px] font-bold text-[#15164B] block">
                    {micState === 'listening'
                      ? 'Listening... Speak naturally'
                      : 'Tap microphone to speak'}
                  </span>
                  <p className="text-[11px] text-[#8E93B8] max-w-[280px] mx-auto">
                    Microphone access is used strictly locally in your browser to transcribe and analyze phrase accuracy.
                  </p>
                </div>

                {/* Recognized Transcript Display & Editing */}
                {spokenTranscript && (
                  <div className="p-3.5 rounded-2xl bg-[#FAF9FE] border border-[#DEE3FA] space-y-2 text-[12px]">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[#15164B] block">Recognized Transcript:</span>
                      <button
                        type="button"
                        onClick={() => setIsEditingTranscript(!isEditingTranscript)}
                        className="text-[11px] font-bold text-[#545CA6] flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{isEditingTranscript ? 'Done' : 'Edit'}</span>
                      </button>
                    </div>

                    {isEditingTranscript ? (
                      <div className="space-y-1.5">
                        <textarea
                          value={spokenTranscript}
                          onChange={(e) => setSpokenTranscript(e.target.value)}
                          rows={2}
                          className="w-full p-2.5 rounded-xl border border-[#D5D8EE] text-[12.5px] text-[#15164B] outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingTranscript(false);
                            runEvaluation(spokenTranscript);
                          }}
                          className="px-3 py-1 rounded-lg bg-[#15164B] text-white text-[11px] font-bold cursor-pointer"
                        >
                          Re-evaluate Edited Text
                        </button>
                      </div>
                    ) : (
                      <p className="italic text-[#1E224E] leading-relaxed">
                        "{spokenTranscript}"
                      </p>
                    )}
                  </div>
                )}

                {/* Text Fallback Alternative */}
                <div className="pt-2 border-t border-[#ECEEFE] space-y-2">
                  <span className="text-[11px] font-bold text-[#545CA6] flex items-center gap-1">
                    <span>Typing Alternative (No Microphone / Unsupported Browser)</span>
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={textInputFallback}
                      onChange={(e) => setTextInputFallback(e.target.value)}
                      placeholder="Type your spoken sentence here..."
                      aria-label="Type your spoken sentence alternative"
                      className="flex-1 p-2.5 rounded-xl border border-[#D5D8EE] text-[12px] text-[#15164B] outline-hidden focus:border-[#545CA6]"
                    />
                    <button
                      type="button"
                      onClick={handleSubmitTextFallback}
                      disabled={!textInputFallback.trim()}
                      className="px-3 py-2 rounded-xl bg-[#15164B] text-white text-[11px] font-bold disabled:opacity-40 cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <Send className="w-3 h-3" />
                      <span>Evaluate</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* EVALUATION FEEDBACK SCORECARD */}
              {evaluation && (
                <div 
                  className="p-4.5 rounded-3xl bg-white border border-[#D5D8EE] shadow-md space-y-3.5 animate-in fade-in duration-200"
                  role="region"
                  aria-live="polite"
                  aria-label="Speaking Evaluation Feedback"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#545CA6]">
                      Linguistic Analysis & Feedback
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                      evaluation.isPassing
                        ? 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]'
                        : 'bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]'
                    }`}>
                      {evaluation.overallScore}% Accuracy
                    </span>
                  </div>

                  {/* Feedback Summary */}
                  <p className="text-[13px] font-semibold text-[#15164B] leading-relaxed">
                    {evaluation.feedback}
                  </p>

                  {/* Matched vs Missing Phrases */}
                  <div className="space-y-2 pt-1 border-t border-[#ECEEFE]">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#059669] block mb-1">
                        Matched Key Phrases ({evaluation.matchedKeyPhrases.length}):
                      </span>
                      {evaluation.matchedKeyPhrases.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {evaluation.matchedKeyPhrases.map((p, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-[11px] font-bold flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{p}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#6B7094] italic">None detected yet.</span>
                      )}
                    </div>

                    {evaluation.missingKeyPhrases.length > 0 && (
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#D97706] block mb-1">
                          Opportunities to Include:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {evaluation.missingKeyPhrases.map((p, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] text-[11px] font-medium"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Completeness & Word Order Metrics */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2.5 rounded-xl bg-[#FAF9FE] border border-[#ECEEFE] text-center">
                      <span className="text-[10px] font-extrabold uppercase text-[#8E93B8] block">Sentence Completeness</span>
                      <span className="text-[15px] font-black text-[#15164B]">{evaluation.sentenceCompleteness}%</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#FAF9FE] border border-[#ECEEFE] text-center">
                      <span className="text-[10px] font-extrabold uppercase text-[#8E93B8] block">Word Order Cohesion</span>
                      <span className="text-[15px] font-black text-[#15164B]">{evaluation.wordOrderScore}%</span>
                    </div>
                  </div>

                  {/* Practical Suggestions */}
                  {evaluation.improvementSuggestions.length > 0 && (
                    <div className="p-3 rounded-2xl bg-[#F0F2FD] border border-[#DEE3FA] text-[11.5px] text-[#1E224E] space-y-1">
                      <span className="font-extrabold block text-[10.5px] uppercase text-[#545CA6]">Practical Suggestions:</span>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {evaluation.improvementSuggestions.map((sug, i) => (
                          <li key={i}>{sug}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Buttons: Retry Without Penalty vs Next Prompt */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleRetryWithoutPenalty}
                      className="flex-1 py-2 rounded-full border border-[#D5D8EE] hover:bg-[#F0F2FD] text-[#15164B] text-[12px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Retry Without Penalty</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNextPrompt}
                      className="flex-1 py-2 rounded-full bg-[#15164B] hover:bg-[#0E1038] text-white text-[12px] font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>{selectedPromptIndex + 1 < activePrompts.length ? 'Continue to Next Prompt' : 'Finish Studio'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* END OF SESSION SCORECARD */
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-center space-y-1.5 pt-2">
                <div className="w-12 h-12 rounded-2xl bg-[#FFE4E6] text-[#E11D48] flex items-center justify-center mx-auto shadow-xs">
                  <Award className="w-6 h-6 stroke-[2.4]" />
                </div>
                <h3 className="text-[19px] font-black text-[#15164B]">
                  Speaking Studio Complete!
                </h3>
                <p className="text-[12px] text-[#6B7094] max-w-[340px] mx-auto">
                  Spoken phrasing, vocabulary coverage, and conversational cadence recorded.
                </p>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-2xl bg-white border border-[#DEE3FA] text-center shadow-xs">
                  <span className="text-[10px] font-extrabold uppercase text-[#8E93B8] block">Average Score</span>
                  <span className="text-[18px] font-black text-[#15164B]">
                    {completedScores.length > 0
                      ? Math.round(completedScores.reduce((a, b) => a + b, 0) / completedScores.length)
                      : 85}%
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-center shadow-xs">
                  <span className="text-[10px] font-extrabold uppercase text-[#059669] block">Completed</span>
                  <span className="text-[18px] font-black text-[#059669]">{completedScores.length}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#FAF9FE] border border-[#DEE3FA] text-center shadow-xs">
                  <span className="text-[10px] font-extrabold uppercase text-[#545CA6] block">Total Attempts</span>
                  <span className="text-[18px] font-black text-[#545CA6]">{totalAttemptsCount || 1}</span>
                </div>
              </div>

              {/* Recommendations */}
              <div className="p-4 rounded-2xl bg-white border border-[#ECEEFE] space-y-2 text-[12px] text-[#52577F]">
                <span className="font-extrabold text-[#15164B] block text-[12.5px]">
                  Speaking & Pronunciation Plan:
                </span>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Focus on linking words smoothly across thought groups (e.g. "could I please", "there seems to be").</li>
                  <li>Practice polite softening techniques to make requests sound authentic and courteous.</li>
                  <li>Incorporate 5 minutes of daily aloud shadowing with model responses.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="p-4 bg-white border-t border-[#ECEEFE] flex items-center justify-between shrink-0">
          {!isSessionFinished ? (
            <>
              <button
                type="button"
                onClick={finishSpeakingSession}
                className="text-[12px] font-bold text-[#6B7094] hover:text-[#15164B] transition-colors cursor-pointer"
              >
                End Session Early
              </button>

              <button
                type="button"
                onClick={handleNextPrompt}
                className="px-4 py-2 rounded-full bg-[#15164B] hover:bg-[#0E1038] text-white text-[12px] font-bold transition-all shadow-xs cursor-pointer"
              >
                {selectedPromptIndex + 1 < activePrompts.length ? 'Next Prompt' : 'Finish Studio'}
              </button>
            </>
          ) : (
            <div className="flex items-center justify-end w-full gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsSessionFinished(false);
                  setSelectedPromptIndex(0);
                  setSpokenTranscript('');
                  setTextInputFallback('');
                  setEvaluation(null);
                  setCompletedScores([]);
                  setTotalAttemptsCount(0);
                }}
                className="px-3.5 py-1.5 rounded-full border border-[#D5D8EE] text-[#15164B] text-[12px] font-bold hover:bg-[#F0F2FD] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Practice Again</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-1.5 rounded-full bg-[#15164B] text-white text-[12px] font-bold hover:bg-[#0E1038] transition-all cursor-pointer shadow-xs"
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
