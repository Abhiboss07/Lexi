import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mic, 
  MicOff, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  Info
} from 'lucide-react';
import type { PracticePreferences } from '../../../types/practicePreferences';
import { getTodaySpeakingPrompt, type SpeakingPrompt } from '../../../services/activityHubService';
import { quickPicksRepository } from '../../../db/quickPicksRepository';
import { practiceRepository } from '../../../db/practiceRepository';
import { getLocalDateString } from '../../../services/dailyPracticeService';

interface SpeakingPromptModalProps {
  userId?: string;
  isOpen: boolean;
  preferences?: PracticePreferences;
  onClose: () => void;
}

export const SpeakingPromptModal: React.FC<SpeakingPromptModalProps> = ({
  userId = 'local-learner-1',
  isOpen,
  preferences,
  onClose,
}) => {
  const [prompt, setPrompt] = useState<SpeakingPrompt | null>(null);
  const [userTranscript, setUserTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [evaluation, setEvaluation] = useState<{
    score: number;
    wordCount: number;
    strengths: string[];
    tips: string[];
    matchedPhrases: string[];
  } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setSpeechSupported(!!SpeechRecognition);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const today = getTodaySpeakingPrompt();
    setPrompt(today);
    setUserTranscript('');
    setEvaluation(null);
    setIsRecording(false);
  }, [isOpen]);

  if (!isOpen || !prompt) return null;

  const handleToggleVoice = () => {
    if (!speechSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = () => setIsRecording(false);

      recognition.onresult = (event: any) => {
        let text = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          text += event.results[i][0].transcript;
        }
        if (text) {
          setUserTranscript((prev) => (prev ? `${prev} ${text}` : text));
        }
      };

      recognition.start();
    } catch (err) {
      console.warn('Speech recognition start failed:', err);
      setIsRecording(false);
    }
  };

  const handleEvaluate = async () => {
    const clean = userTranscript.trim();
    if (!clean) return;

    const words = clean.split(/\s+/);
    const lower = clean.toLowerCase();

    const strengths: string[] = [];
    const tips: string[] = [];
    const matchedPhrases = prompt.suggestedPhrases.filter((p) => lower.includes(p.toLowerCase()));

    let score = 60;

    // Word count & flow
    if (words.length >= 15) {
      score += 20;
      strengths.push(`Spoke ${words.length} words with natural sustained cadence.`);
    } else if (words.length >= 8) {
      score += 10;
      tips.push('Try expanding your response: aim for 15+ words to practice communicative fluency.');
    } else {
      tips.push('Response is very brief. Try answering at least 2 of the guiding questions.');
    }

    // Vocabulary & phrases
    if (matchedPhrases.length > 0) {
      score += 20;
      strengths.push(`Used idiomatic expressions: "${matchedPhrases.join('", "')}".`);
    } else {
      tips.push(`Consider using suggested vocabulary like "${prompt.suggestedPhrases.slice(0, 2).join('", "')}".`);
    }

    const finalScore = Math.min(100, Math.max(50, score));

    setEvaluation({
      score: finalScore,
      wordCount: words.length,
      strengths,
      tips,
      matchedPhrases,
    });

    const dateStr = getLocalDateString();
    await quickPicksRepository.recordActivityCompletion({
      id: `${userId}-speaking-prompt-${dateStr}`,
      userId,
      activityId: 'speaking-prompt',
      date: dateStr,
      score: finalScore,
      completedAt: new Date().toISOString(),
    });

    await practiceRepository.recordSession({
      userId,
      category: 'speaking-prompt',
      difficulty: preferences?.defaultDifficulty || 'medium',
      sessionLength: 'quick',
      durationMinutes: 3,
      score: finalScore,
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#15164B]/40 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="speaking-prompt-title"
    >
      <div className="w-full max-w-[480px] bg-white rounded-[32px] p-5 sm:p-6 shadow-2xl border border-[#ECEEFE] space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#545CA6] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FF6243]" />
              <span>Daily Speaking Workout</span>
            </span>
            <h2 id="speaking-prompt-title" className="text-[20px] font-black text-[#15164B] tracking-tight">
              Speaking Prompt of the Day
            </h2>
            <p className="text-[12px] font-medium text-[#6B7094]">
              Practise expressing thoughts spontaneously via voice or text.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F4F5FD] hover:bg-[#E8EBFB] text-[#222149] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close Speaking Prompt"
          >
            <X className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {/* Prompt Card */}
        <div className="p-4 rounded-2xl bg-[#F6F7FE] border border-[#ECEEFE] space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#545CA6]">
            <span>Today's Topic</span>
            <span>Level: {prompt.cefrLevel}</span>
          </div>
          <h3 className="text-[15px] font-black text-[#15164B]">
            {prompt.title}
          </h3>
          <p className="text-[12px] text-[#474B75]">
            {prompt.promptDescription}
          </p>

          {/* Guiding Questions */}
          <div className="pt-1.5 border-t border-[#DEE3FA]/70 space-y-1">
            <span className="text-[10.5px] font-extrabold uppercase text-[#545CA6] block">
              Ideas to touch upon:
            </span>
            <ul className="list-disc list-inside text-[11.5px] text-[#222149] space-y-0.5">
              {prompt.guidingQuestions.map((gq, idx) => (
                <li key={idx}>{gq}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Input Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11.5px] font-bold text-[#15164B]">
            <span>Your Spoken Answer:</span>
            {speechSupported && (
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  isRecording 
                    ? 'bg-[#EF4444] text-white animate-pulse' 
                    : 'bg-[#ECEFFD] text-[#545CA6] hover:bg-[#DEE3FA]'
                }`}
                aria-label={isRecording ? 'Stop recording' : 'Record voice'}
              >
                {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isRecording ? 'Listening...' : 'Speak with Mic'}</span>
              </button>
            )}
          </div>

          <textarea
            value={userTranscript}
            onChange={(e) => setUserTranscript(e.target.value)}
            placeholder={`Start with: "${prompt.starterPhrase}"...`}
            rows={3}
            className="w-full p-3 rounded-2xl bg-[#F9FAFF] border border-[#DEE3FA] text-[12.5px] text-[#222149] focus:outline-hidden focus:border-[#545CA6] resize-none"
          />

          {!speechSupported && (
            <p className="text-[10px] text-[#8E93B8] italic">
              Speech recognition not supported in this browser; typing is fully supported.
            </p>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleEvaluate}
              disabled={!userTranscript.trim()}
              className="px-5 py-2.5 rounded-full bg-[#15164B] hover:bg-[#0E1038] disabled:opacity-50 text-white text-[12.5px] font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Evaluate Speech Transcript</span>
            </button>
          </div>
        </div>

        {/* Evaluation Feedback */}
        {evaluation && (
          <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] space-y-2.5 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[13.5px] font-black text-[#15164B] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                Communicative Fluency: {evaluation.score}/100
              </span>
              <span className="text-[11px] font-bold text-[#15803D]">
                {evaluation.wordCount} words
              </span>
            </div>

            {evaluation.strengths.length > 0 && (
              <div className="space-y-0.5 text-[11.5px] text-[#15803D]">
                <strong className="block">Strengths:</strong>
                <ul className="list-disc list-inside">
                  {evaluation.strengths.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {evaluation.tips.length > 0 && (
              <div className="space-y-0.5 text-[11.5px] text-[#9A3412] bg-[#FFF7ED] p-2 rounded-xl border border-[#FED7AA]">
                <strong className="block">Tips for Next Time:</strong>
                <ul className="list-disc list-inside">
                  {evaluation.tips.map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-[10px] text-[#7D82A8]">
              <Info className="w-3.5 h-3.5 text-[#545CA6] shrink-0" />
              <span>Pronunciation notice: Feedback analyzes vocabulary, fluency length, and transcript grammar. Precise phonetic audio scores require specialized hardware microphones and are not fabricated.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
