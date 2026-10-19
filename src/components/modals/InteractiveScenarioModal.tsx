import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Volume2,
  Mic,
  MicOff,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  BookOpen,
  BookmarkPlus,
  BookmarkCheck,
  Award,
  ShieldAlert,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type {
  ScenarioDefinition,
  ScenarioTurn,
  ScenarioChoice,
  ScenarioKeyWord,
  ScenarioSessionResult,
} from '../../types/scenarios';
import { scenarioSimulationService } from '../../services/scenarioSimulationService';
import { getMappedLessonForActivity } from '../../data/lessonMapping';

interface InteractiveScenarioModalProps {
  isOpen: boolean;
  scenarioId: string | null;
  userId?: string;
  onClose: () => void;
  onSessionComplete?: (result: ScenarioSessionResult) => void;
  onStartLesson?: (lessonId: string) => void;
}

interface CompletedTurnChoice {
  turnIndex: number;
  partnerSpeech: string;
  selectedChoice: ScenarioChoice;
}

export const InteractiveScenarioModal: React.FC<InteractiveScenarioModalProps> = ({
  isOpen,
  scenarioId,
  userId = 'local-learner-1',
  onClose,
  onSessionComplete,
  onStartLesson,
}) => {
  const [scenario, setScenario] = useState<ScenarioDefinition | null>(null);
  const [currentTurnIdx, setCurrentTurnIdx] = useState<number>(0);
  const [history, setHistory] = useState<CompletedTurnChoice[]>([]);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [isTurnEvaluated, setIsTurnEvaluated] = useState<boolean>(false);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [wordsSaved, setWordsSaved] = useState<boolean>(false);
  const [savingWords, setSavingWords] = useState<boolean>(false);
  const [sessionResult, setSessionResult] = useState<ScenarioSessionResult | null>(null);

  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize or reset scenario when opened
  useEffect(() => {
    if (isOpen && scenarioId) {
      const def = scenarioSimulationService.getScenarioById(scenarioId);
      if (def) {
        setScenario(def);
        setCurrentTurnIdx(0);
        setHistory([]);
        setSelectedChoiceId(null);
        setIsTurnEvaluated(false);
        setTotalScore(0);
        setIsCompleted(false);
        setWordsSaved(false);
        setSessionResult(null);
        setSpeechError(null);
      }
    }
  }, [isOpen, scenarioId]);

  // Autoscroll transcript
  useEffect(() => {
    if (transcriptEndRef.current && typeof transcriptEndRef.current.scrollIntoView === 'function') {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [history, isTurnEvaluated, currentTurnIdx]);

  // Clean up speech synthesis / recognition when unmounting or closing
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  if (!isOpen || !scenario) return null;

  const currentTurn: ScenarioTurn | undefined = scenario.turns[currentTurnIdx];
  const maxPossiblePoints = scenario.turns.length * 25;

  const handleSpeakText = (text: string) => {
    if (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      'SpeechSynthesisUtterance' in window
    ) {
      window.speechSynthesis.cancel();
      const utterance = new window.SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.92;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleToggleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('Speech recognition is not supported in this browser. Please select an option below.');
      return;
    }

    try {
      setSpeechError(null);
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 3;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        setIsListening(false);
        const transcript = event.results[0][0].transcript.toLowerCase();

        // Match spoken text against option texts
        if (currentTurn) {
          let bestMatchChoice: ScenarioChoice | null = null;
          let highestOverlap = 0;

          const spokenWords = new Set(transcript.split(/\s+/));
          for (const opt of currentTurn.options) {
            const optWords = opt.text.toLowerCase().split(/\s+/);
            const commonCount = optWords.filter((w: string) => spokenWords.has(w)).length;
            if (commonCount > highestOverlap) {
              highestOverlap = commonCount;
              bestMatchChoice = opt;
            }
          }

          if (bestMatchChoice && highestOverlap >= 2) {
            handleSelectChoice(bestMatchChoice.id);
          } else {
            setSpeechError(`Heard: "${event.results[0][0].transcript}". Please tap your preferred response option.`);
          }
        }
      };

      recognition.onerror = (e: any) => {
        setIsListening(false);
        if (e.error !== 'no-speech') {
          setSpeechError(`Voice input error (${e.error}). You can tap the response directly.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      setSpeechError('Could not start speech recognition. Tap an option below to proceed.');
    }
  };

  const handleSelectChoice = (choiceId: string) => {
    if (isTurnEvaluated || !currentTurn) return;

    setSelectedChoiceId(choiceId);
    setIsTurnEvaluated(true);

    const chosen = scenarioSimulationService.evaluateTurnChoice(currentTurn, choiceId);
    if (!chosen) return;

    const newScore = totalScore + chosen.scoreDelta;
    setTotalScore(newScore);

    // Provide gentle voice feedback if natural
    if (chosen.isBest) {
      confetti({
        particleCount: 25,
        spread: 50,
        origin: { y: 0.75 },
        colors: ['#4F46E5', '#10B981', '#F59E0B'],
      });
    }
  };

  const handleNextTurn = async () => {
    if (!currentTurn || !selectedChoiceId) return;

    const chosen = scenarioSimulationService.evaluateTurnChoice(currentTurn, selectedChoiceId);
    if (!chosen) return;

    const nextHistory = [
      ...history,
      {
        turnIndex: currentTurnIdx,
        partnerSpeech: currentTurn.partnerSpeech,
        selectedChoice: chosen,
      },
    ];
    setHistory(nextHistory);

    const nextIdx = currentTurnIdx + 1;
    if (nextIdx < scenario.turns.length) {
      setCurrentTurnIdx(nextIdx);
      setSelectedChoiceId(null);
      setIsTurnEvaluated(false);
      setSpeechError(null);
    } else {
      // Finished all turns!
      const normalizedScore = Math.min(100, Math.round((totalScore / maxPossiblePoints) * 100));
      setIsCompleted(true);

      // Trigger completion celebration
      confetti({
        particleCount: 75,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#4F46E5', '#818CF8', '#10B981', '#F59E0B', '#EC4899'],
      });

      // Persist session to practice repository
      try {
        const result = await scenarioSimulationService.saveScenarioSession({
          userId,
          scenarioId: scenario.id,
          score: normalizedScore,
          wordsToSave: [], // Will be saved explicitly by user or automatically
        });
        setSessionResult(result);
        if (onSessionComplete) {
          onSessionComplete(result);
        }
      } catch {
        // Fallback
      }
    }
  };

  const handleSaveAllKeyWords = async () => {
    if (wordsSaved || savingWords || !scenario) return;
    setSavingWords(true);
    try {
      const result = await scenarioSimulationService.saveScenarioSession({
        userId,
        scenarioId: scenario.id,
        score: Math.min(100, Math.round((totalScore / maxPossiblePoints) * 100)),
        wordsToSave: scenario.keyVocabulary,
      });
      setWordsSaved(true);
      setSessionResult(result);
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#10B981', '#6366F1', '#FBBF24'],
      });
    } finally {
      setSavingWords(false);
    }
  };

  const handleRestart = () => {
    setCurrentTurnIdx(0);
    setHistory([]);
    setSelectedChoiceId(null);
    setIsTurnEvaluated(false);
    setTotalScore(0);
    setIsCompleted(false);
    setWordsSaved(false);
    setSessionResult(null);
    setSpeechError(null);
  };

  const currentChoice = currentTurn?.options.find((o) => o.id === selectedChoiceId);
  const finalPercentage = Math.min(100, Math.round((totalScore / maxPossiblePoints) * 100));
  const ratingInfo = scenarioSimulationService.calculateSessionRating(finalPercentage);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/45 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scenario-title"
    >
      <div className="w-full max-w-[560px] bg-white rounded-t-[32px] sm:rounded-[28px] shadow-2xl border border-[#ECEEFE] max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#ECEEFE] bg-[#FAF9FD] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[22px] shrink-0 shadow-xs">
              {scenario.partnerAvatar}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded-full inline-block mb-0.5">
                {scenario.category}
              </span>
              <h2 id="scenario-title" className="text-[16px] xs:text-[17px] font-bold text-[#222149] truncate leading-tight">
                {scenario.title}
              </h2>
              <p className="text-[11px] font-medium text-[#7D82A8] truncate mt-0.5">
                {scenario.category} • {scenario.difficulty} • {scenario.duration}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white hover:bg-[#ECEEFE] border border-[#ECEEFE] flex items-center justify-center text-[#222149] transition-colors shrink-0 ml-2"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

        {/* Progress bar */}
        {!isCompleted && (
          <div className="px-5 py-2.5 bg-white border-b border-[#F0F2FD] flex items-center justify-between text-xs text-[#646AA4] shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#222149]">
                Turn {currentTurnIdx + 1} of {scenario.turns.length}
              </span>
              <span className="text-[#A2A7D2]">•</span>
              <span>with {scenario.partnerName} ({scenario.partnerRole})</span>
            </div>
            <div className="w-24 h-2 bg-[#EEF0FD] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentTurnIdx + (isTurnEvaluated ? 1 : 0)) / scenario.turns.length) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {!isCompleted ? (
            <>
              {/* Dialogue Transcript History */}
              {history.map((item, idx) => (
                <div key={idx} className="space-y-2.5 animate-in fade-in duration-200">
                  {/* Partner speech */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-sm shrink-0">
                      {scenario.partnerAvatar}
                    </div>
                    <div className="bg-[#F5F6FE] border border-[#ECEEFE] rounded-2xl rounded-tl-sm p-3 max-w-[85%] text-[13.5px] text-[#222149] leading-relaxed">
                      <div className="font-semibold text-[11px] text-[#646AA4] mb-0.5">
                        {scenario.partnerName}
                      </div>
                      {item.partnerSpeech}
                    </div>
                  </div>

                  {/* Learner choice made */}
                  <div className="flex items-start justify-end gap-2.5">
                    <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-sm p-3 max-w-[85%] text-[13.5px] leading-relaxed shadow-xs">
                      <div className="flex items-center justify-between gap-2 text-[10px] text-indigo-200 font-semibold mb-0.5">
                        <span>You</span>
                        <span className="capitalize px-1.5 py-0.2 bg-white/20 rounded-full text-[9.5px]">
                          {item.selectedChoice.tone}
                        </span>
                      </div>
                      {item.selectedChoice.text}
                    </div>
                  </div>
                </div>
              ))}

              {/* Active Current Turn */}
              {currentTurn && (
                <div className="space-y-4 pt-1">
                  {/* Partner current prompt */}
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-base shrink-0 shadow-xs">
                      {scenario.partnerAvatar}
                    </div>
                    <div className="flex-1">
                      <div className="bg-white border-2 border-indigo-100 rounded-2xl rounded-tl-sm p-3.5 shadow-xs relative group">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[12px] text-[#222149]">
                            {scenario.partnerName}{' '}
                            <span className="font-normal text-[#7D82A8]">({scenario.partnerRole})</span>
                          </span>
                          <button
                            onClick={() => handleSpeakText(currentTurn.partnerSpeech)}
                            className="p-1.5 rounded-lg bg-[#F4F5FD] hover:bg-indigo-50 text-[#646AA4] hover:text-indigo-600 transition-colors"
                            title="Listen to audio pronunciation"
                            aria-label="Listen to partner speech"
                          >
                            <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-pulse text-indigo-600' : ''}`} />
                          </button>
                        </div>
                        <p className="text-[14px] text-[#222149] font-medium leading-relaxed">
                          "{currentTurn.partnerSpeech}"
                        </p>
                      </div>

                      {/* Scene notes */}
                      {currentTurn.partnerNotes && (
                        <p className="text-[11.5px] text-[#7D82A8] italic mt-1.5 ml-1">
                          ↳ {currentTurn.partnerNotes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Speech input option & instructions */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[12px] font-bold text-[#646AA4] uppercase tracking-wider">
                      Your Response:
                    </span>
                    <button
                      type="button"
                      onClick={handleToggleVoiceInput}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        isListening
                          ? 'bg-rose-500 text-white animate-pulse shadow-xs'
                          : 'bg-[#EEF0FD] text-[#4F46E5] hover:bg-[#E3E7FC]'
                      }`}
                      title="Speak your answer using voice input"
                    >
                      {isListening ? (
                        <>
                          <MicOff className="w-3.5 h-3.5" />
                          <span>Listening...</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3.5 h-3.5" />
                          <span>Practice Voice</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Speech error or recognition feedback */}
                  {speechError && (
                    <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[12px] text-amber-800 animate-in fade-in">
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                      <span>{speechError}</span>
                    </div>
                  )}

                  {/* Options List */}
                  <div className="space-y-2.5" role="radiogroup" aria-label="Dialogue options">
                    {currentTurn.options.map((option) => {
                      const isSelected = selectedChoiceId === option.id;
                      let optionClasses = 'bg-white border-[#E5E7EB] hover:border-indigo-300 text-[#222149]';

                      if (isTurnEvaluated) {
                        if (isSelected) {
                          if (option.isBest) {
                            optionClasses = 'bg-emerald-50/70 border-emerald-400 text-emerald-950 ring-2 ring-emerald-200';
                          } else if (option.tone === 'informal') {
                            optionClasses = 'bg-amber-50/70 border-amber-400 text-amber-950 ring-2 ring-amber-200';
                          } else {
                            optionClasses = 'bg-purple-50/70 border-purple-400 text-purple-950 ring-2 ring-purple-200';
                          }
                        } else {
                          optionClasses = 'bg-gray-50/60 border-gray-200 text-gray-500 opacity-60';
                        }
                      } else if (isSelected) {
                        optionClasses = 'bg-indigo-50 border-indigo-500 text-indigo-950 ring-2 ring-indigo-200';
                      }

                      return (
                        <button
                          key={option.id}
                          type="button"
                          disabled={isTurnEvaluated}
                          onClick={() => handleSelectChoice(option.id)}
                          className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all flex items-start justify-between gap-3 ${optionClasses}`}
                          role="radio"
                          aria-checked={isSelected}
                        >
                          <div className="flex-1 text-[13.5px] leading-snug font-medium">
                            {option.text}
                          </div>
                          {isTurnEvaluated && isSelected && (
                            <span
                              className={`shrink-0 text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                option.isBest
                                  ? 'bg-emerald-200 text-emerald-800'
                                  : option.tone === 'informal'
                                  ? 'bg-amber-200 text-amber-800'
                                  : 'bg-purple-200 text-purple-800'
                              }`}
                            >
                              {option.tone}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Immediate Feedback Card */}
                  {isTurnEvaluated && currentChoice && (
                    <div
                      className={`p-4 rounded-2xl border animate-in slide-in-from-bottom-2 duration-200 ${
                        currentChoice.isBest
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : currentChoice.tone === 'informal'
                          ? 'bg-amber-50 border-amber-200 text-amber-900'
                          : 'bg-purple-50 border-purple-200 text-purple-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs mb-1">
                        {currentChoice.isBest ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Natural & Polite (+{currentChoice.scoreDelta} pts)</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>Language Feedback (+{currentChoice.scoreDelta} pts)</span>
                          </>
                        )}
                      </div>
                      <p className="text-[13px] leading-relaxed font-medium">
                        {currentChoice.feedback}
                      </p>
                    </div>
                  )}

                  <div ref={transcriptEndRef} />
                </div>
              )}
            </>
          ) : (
            /* Completion Screen */
            <div className="text-center py-4 space-y-5 animate-in zoom-in-95 duration-200">
              {/* Score circle */}
              <div className="relative inline-flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white flex flex-col items-center justify-center shadow-lg">
                  <span className="text-2xl font-black">{finalPercentage}%</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-90">Fluency</span>
                </div>
                <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-amber-400 text-white flex items-center justify-center shadow-xs">
                  <Award className="w-4 h-4" />
                </div>
              </div>

              <div>
                <span className="inline-block px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-full mb-2">
                  {ratingInfo.rating}
                </span>
                <h3 className="text-xl font-bold text-[#222149]">
                  Scenario Complete!
                </h3>
                <p className="text-xs text-[#646AA4] max-w-sm mx-auto mt-1 leading-relaxed">
                  {ratingInfo.summary}
                </p>
              </div>

              {/* Key Vocabulary Learned Card */}
              {scenario.keyVocabulary.length > 0 && (
                <div className="text-left bg-[#FAF9FD] border border-[#ECEEFE] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-bold text-[#222149] uppercase tracking-wider">
                        Key Phrases & Vocabulary
                      </span>
                    </div>
                    <span className="text-[11px] text-[#7D82A8]">
                      {scenario.keyVocabulary.length} words
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {scenario.keyVocabulary.map((kw: ScenarioKeyWord) => (
                      <div
                        key={kw.word}
                        className="bg-white p-2.5 rounded-xl border border-[#EEF0FD] text-xs shadow-2xs"
                      >
                        <div className="flex items-center justify-between font-bold text-indigo-900">
                          <span>{kw.word}</span>
                          <span className="text-[9.5px] font-semibold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-600">
                            {kw.cefrLevel}
                          </span>
                        </div>
                        <p className="text-[#646AA4] text-[11px] mt-0.5 line-clamp-1">{kw.definition}</p>
                      </div>
                    ))}
                  </div>

                  {/* 1-tap Save all to FSRS Spaced-Repetition Deck */}
                  <button
                    type="button"
                    onClick={handleSaveAllKeyWords}
                    disabled={wordsSaved || savingWords}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      wordsSaved
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-200 shadow-2xs'
                    }`}
                  >
                    {wordsSaved ? (
                      <>
                        <BookmarkCheck className="w-4 h-4 text-emerald-600" />
                        <span>Saved {sessionResult?.savedWordsCount ?? scenario.keyVocabulary.length} Words to Memory Deck (FSRS)</span>
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="w-4 h-4" />
                        <span>{savingWords ? 'Saving...' : 'Add All to Memory Deck (FSRS)'}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 xs:p-4 border-t border-[#ECEEFE] bg-[#FAF9FD] flex items-center justify-between gap-2 xs:gap-3 shrink-0">
          {!isCompleted ? (
            <>
              <button
                type="button"
                onClick={handleRestart}
                className="px-3 xs:px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#EEF0FD] border border-[#ECEEFE] text-xs font-semibold text-[#646AA4] flex items-center justify-center gap-1.5 transition-colors shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restart</span>
              </button>

              {onStartLesson && getMappedLessonForActivity(scenario.id) && (
                <button
                  type="button"
                  onClick={() => {
                    const mapped = getMappedLessonForActivity(scenario.id);
                    if (mapped) {
                      onClose();
                      onStartLesson(mapped.id);
                    }
                  }}
                  className="px-3 xs:px-3.5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-indigo-200/80 shadow-2xs shrink-0"
                  title="Start interactive curriculum lesson"
                  aria-label="Start interactive curriculum lesson"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Start</span>
                </button>
              )}

              <button
                type="button"
                disabled={!isTurnEvaluated}
                onClick={handleNextTurn}
                className="flex-1 py-2.5 px-3 xs:px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                <span>
                  {currentTurnIdx + 1 < scenario.turns.length ? 'Continue' : 'Complete & View Score'}
                </span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleRestart}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#EEF0FD] border border-[#ECEEFE] text-xs font-semibold text-[#646AA4] flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Practice Again</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <span>Finish & Return Home</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
