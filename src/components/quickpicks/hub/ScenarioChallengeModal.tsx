import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mic, 
  MicOff, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Info
} from 'lucide-react';
import type { PracticePreferences } from '../../../types/practicePreferences';
import { 
  SCENARIO_CHALLENGES, 
  evaluateScenarioResponse, 
  type ScenarioEvaluationResult 
} from '../../../services/activityHubService';
import { quickPicksRepository } from '../../../db/quickPicksRepository';
import { practiceRepository } from '../../../db/practiceRepository';
import { getLocalDateString } from '../../../services/dailyPracticeService';

interface ScenarioChallengeModalProps {
  userId?: string;
  isOpen: boolean;
  preferences?: PracticePreferences;
  onClose: () => void;
}

export const ScenarioChallengeModal: React.FC<ScenarioChallengeModalProps> = ({
  userId = 'local-learner-1',
  isOpen,
  preferences,
  onClose,
}) => {
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const [userText, setUserText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [evaluation, setEvaluation] = useState<ScenarioEvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const scenario = SCENARIO_CHALLENGES[selectedScenarioIndex];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setSpeechSupported(!!SpeechRecognition);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setUserText('');
    setEvaluation(null);
    setIsRecording(false);
  }, [isOpen, selectedScenarioIndex]);

  if (!isOpen) return null;

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
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setUserText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.start();
    } catch (err) {
      console.warn('Speech recognition start failed:', err);
      setIsRecording(false);
    }
  };

  const handleSubmit = async () => {
    if (!userText.trim() || !scenario) return;
    setIsEvaluating(true);

    const result = evaluateScenarioResponse(userText, scenario);
    setEvaluation(result);

    const dateStr = getLocalDateString();
    await quickPicksRepository.recordActivityCompletion({
      id: `${userId}-scenario-${scenario.id}-${dateStr}`,
      userId,
      activityId: 'scenario-challenge',
      date: dateStr,
      score: result.score,
      completedAt: new Date().toISOString(),
    });

    await practiceRepository.recordSession({
      userId,
      category: 'scenario-challenge',
      difficulty: preferences?.defaultDifficulty || 'medium',
      sessionLength: preferences?.defaultSessionLength || 'quick',
      durationMinutes: 4,
      score: result.score,
      activityId: scenario.id,
    });

    setIsEvaluating(false);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#15164B]/40 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scenario-challenge-title"
    >
      <div className="w-full max-w-[480px] bg-white rounded-[32px] p-5 sm:p-6 shadow-2xl border border-[#ECEEFE] space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#545CA6] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FF6243]" />
              <span>Real-Life Communicative Win</span>
            </span>
            <h2 id="scenario-challenge-title" className="text-[20px] font-black text-[#15164B] tracking-tight">
              Scenario Challenge
            </h2>
            <p className="text-[12px] font-medium text-[#6B7094]">
              Practise spontaneous responses in high-frequency everyday situations.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F4F5FD] hover:bg-[#E8EBFB] text-[#222149] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close Scenario Challenge"
          >
            <X className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {/* Scenario Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {SCENARIO_CHALLENGES.map((sc, idx) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => setSelectedScenarioIndex(idx)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors whitespace-nowrap ${
                selectedScenarioIndex === idx
                  ? 'bg-[#15164B] text-white shadow-xs'
                  : 'bg-[#F4F5FD] text-[#6B7094] hover:bg-[#E8EBFB]'
              }`}
            >
              {sc.title}
            </button>
          ))}
        </div>

        {/* Scenario Brief */}
        {scenario && (
          <div className="p-4 rounded-2xl bg-[#F6F7FE] border border-[#ECEEFE] space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#545CA6]">
              <span>📍 {scenario.setting}</span>
              <span className="uppercase">{scenario.cefrLevel} • {scenario.difficulty}</span>
            </div>
            <p className="text-[13px] font-bold text-[#15164B]">
              Situation: {scenario.situation}
            </p>
            <p className="text-[12px] text-[#474B75]">
              <strong>Your Goal:</strong> {scenario.goal}
            </p>
          </div>
        )}

        {/* Response Input Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11.5px] font-bold text-[#15164B]">
            <span>Your Spoken or Written Response:</span>
            {speechSupported && (
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  isRecording 
                    ? 'bg-[#EF4444] text-white animate-pulse' 
                    : 'bg-[#ECEFFD] text-[#545CA6] hover:bg-[#DEE3FA]'
                }`}
                aria-label={isRecording ? 'Stop voice recording' : 'Start speaking'}
              >
                {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isRecording ? 'Listening...' : 'Voice Input'}</span>
              </button>
            )}
          </div>

          <textarea
            value={userText}
            onChange={(e) => setUserText(e.target.value)}
            placeholder={scenario ? `Start typing (e.g. "${scenario.starterPrompt}")...` : 'Your response...'}
            rows={3}
            className="w-full p-3 rounded-2xl bg-[#F9FAFF] border border-[#DEE3FA] text-[13px] text-[#222149] focus:outline-hidden focus:border-[#545CA6] resize-none"
          />

          {!speechSupported && (
            <p className="text-[10px] text-[#8E93B8] italic">
              Speech recognition not supported in this browser; text input is fully enabled.
            </p>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isEvaluating || !userText.trim()}
              className="px-5 py-2.5 rounded-full bg-[#15164B] hover:bg-[#0E1038] disabled:opacity-50 text-white text-[12.5px] font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Evaluate Communication</span>
            </button>
          </div>
        </div>

        {/* Evaluation Breakdown & Transparent Criteria */}
        {evaluation && (
          <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-black text-[#15164B] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                Communicative Score: {evaluation.score}/100
              </span>
              <span className="text-[11px] font-bold text-[#15803D] bg-white px-2 py-0.5 rounded-full border border-[#BBF7D0]">
                {evaluation.score >= 80 ? 'Natural Fluency' : evaluation.score >= 65 ? 'Clear & Functional' : 'Developing'}
              </span>
            </div>

            {/* Criteria breakdown */}
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              {evaluation.criteriaBreakdown.map((c) => (
                <div key={c.criterion} className="p-2 rounded-xl bg-white border border-[#DCFCE7] flex items-center justify-between">
                  <span className="text-[#474B75]">{c.criterion}</span>
                  <span className="font-extrabold text-[#15164B]">{c.awarded}/{c.max}</span>
                </div>
              ))}
            </div>

            {/* Strengths */}
            {evaluation.strengths.length > 0 && (
              <div className="space-y-1 text-[11.5px] text-[#15803D]">
                <span className="font-bold block">Strengths:</span>
                <ul className="list-disc list-inside space-y-0.5">
                  {evaluation.strengths.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improvements */}
            {evaluation.feedbackNotes.length > 0 && (
              <div className="space-y-1 text-[11.5px] text-[#9A3412] bg-[#FFF7ED] p-2.5 rounded-xl border border-[#FED7AA]">
                <span className="font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-[#EA580C]" />
                  Improvement Tips:
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  {evaluation.feedbackNotes.map((n, idx) => (
                    <li key={idx}>{n}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Model Alternative */}
            {scenario && (
              <div className="p-2.5 rounded-xl bg-white border border-[#ECEEFE] space-y-1 text-[11.5px]">
                <span className="text-[10px] font-extrabold uppercase text-[#545CA6] block">
                  Natural English Phrasing:
                </span>
                <p className="text-[#222149] italic">
                  "{scenario.sampleModelResponse}"
                </p>
              </div>
            )}

            <div className="flex items-center gap-1 text-[10px] text-[#7D82A8]">
              <Info className="w-3 h-3 text-[#545CA6] shrink-0" />
              <span>Transparent evaluation: criteria reflect communicative relevance, tone, vocabulary, and grammar rules.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
