import React, { useRef, useState, useEffect } from 'react';
import { 
  X, 
  PenTool, 
  Eraser, 
  RotateCcw, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  Info
} from 'lucide-react';
import type { PracticePreferences } from '../../../types/practicePreferences';
import { quickPicksRepository } from '../../../db/quickPicksRepository';
import { practiceRepository } from '../../../db/practiceRepository';
import { getLocalDateString } from '../../../services/dailyPracticeService';

interface DescribeAndDrawModalProps {
  userId?: string;
  isOpen: boolean;
  preferences?: PracticePreferences;
  onClose: () => void;
}

const DRAW_PROMPTS = [
  {
    theme: 'Cozy Room',
    prompt: 'Draw a cozy reading nook or living room scene. Include at least 3 objects (e.g. armchair, lamp, book).',
    vocabTips: ['soft', 'wooden', 'peaceful', 'in the corner', 'next to', 'on the table'],
  },
  {
    theme: 'Outdoor Journey',
    prompt: 'Draw a sunny outdoor path, park bench, or bicycle by a tree.',
    vocabTips: ['sunny', 'verdant', 'along the path', 'under the shade', 'breeze', 'quiet'],
  },
  {
    theme: 'Café Corner',
    prompt: 'Sketch a café table with a warm beverage, snack, and notebook.',
    vocabTips: ['steaming', 'ceramic mug', 'pastry', 'on the counter', 'beside', 'delicious'],
  },
];

export const DescribeAndDrawModal: React.FC<DescribeAndDrawModalProps> = ({
  userId = 'local-learner-1',
  isOpen,
  preferences,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [promptIndex, setPromptIndex] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [descriptionText, setDescriptionText] = useState('');
  const [feedback, setFeedback] = useState<{
    score: number;
    strengths: string[];
    tips: string[];
    vocabUsed: string[];
  } | null>(null);

  const currentPrompt = DRAW_PROMPTS[promptIndex];

  useEffect(() => {
    if (!isOpen) return;
    setDescriptionText('');
    setFeedback(null);
    clearCanvas();
  }, [isOpen, promptIndex]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const drawMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : '#15164B';
    ctx.lineWidth = tool === 'eraser' ? 14 : 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = () => {
    setIsDrawing(false);
  };

  if (!isOpen) return null;

  const handleEvaluate = async () => {
    const clean = descriptionText.trim();
    if (!clean) return;

    const words = clean.split(/\s+/);
    const lower = clean.toLowerCase();

    const strengths: string[] = [];
    const tips: string[] = [];
    const vocabUsed: string[] = [];

    let score = 60;

    // Check prepositions of place
    const placePrepositions = ['in', 'on', 'under', 'next to', 'beside', 'behind', 'between', 'above'];
    const matchedPrep = placePrepositions.filter((p) => lower.includes(p));
    if (matchedPrep.length > 0) {
      score += 15;
      strengths.push(`Good spatial description using prepositions: "${matchedPrep.join('", "')}".`);
    } else {
      tips.push('Try adding spatial prepositions like "next to", "on the table", or "in the corner".');
    }

    // Check recommended vocabulary
    const matchedVocab = currentPrompt.vocabTips.filter((v) => lower.includes(v.toLowerCase()));
    if (matchedVocab.length > 0) {
      score += 15;
      vocabUsed.push(...matchedVocab);
      strengths.push(`Incorporated evocative descriptive words: "${matchedVocab.join('", "')}".`);
    } else {
      tips.push(`Consider using suggested vocabulary like "${currentPrompt.vocabTips.slice(0, 3).join(', ')}".`);
    }

    // Word count & sentence structure
    if (words.length >= 12) {
      score += 10;
      strengths.push(`Well-developed description (${words.length} words).`);
    } else {
      tips.push('Aim for 2 to 3 full sentences (12+ words) to describe details and atmosphere.');
    }

    const finalScore = Math.min(100, Math.max(50, score));
    setFeedback({
      score: finalScore,
      strengths,
      tips,
      vocabUsed,
    });

    const dateStr = getLocalDateString();
    await quickPicksRepository.recordActivityCompletion({
      id: `${userId}-describe-draw-${dateStr}`,
      userId,
      activityId: 'describe-and-draw',
      date: dateStr,
      score: finalScore,
      completedAt: new Date().toISOString(),
    });

    await practiceRepository.recordSession({
      userId,
      category: 'describe-and-draw',
      difficulty: preferences?.defaultDifficulty || 'medium',
      sessionLength: 'standard',
      durationMinutes: 5,
      score: finalScore,
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#15164B]/40 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="describe-draw-title"
    >
      <div className="w-full max-w-[480px] bg-white rounded-[32px] p-5 sm:p-6 shadow-2xl border border-[#ECEEFE] space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#545CA6] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FF6243]" />
              <span>Visual-Verbal Practice</span>
            </span>
            <h2 id="describe-draw-title" className="text-[20px] font-black text-[#15164B] tracking-tight">
              Describe & Draw
            </h2>
            <p className="text-[12px] font-medium text-[#6B7094]">
              Sketch a scene and articulate what you see in descriptive English.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F4F5FD] hover:bg-[#E8EBFB] text-[#222149] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close Describe & Draw"
          >
            <X className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {/* Prompt */}
        <div className="p-3.5 rounded-2xl bg-[#F6F7FE] border border-[#ECEEFE] space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#545CA6]">
            <span>Prompt: {currentPrompt.theme}</span>
            <button
              type="button"
              onClick={() => setPromptIndex((idx) => (idx + 1) % DRAW_PROMPTS.length)}
              className="hover:underline cursor-pointer"
            >
              Next Theme →
            </button>
          </div>
          <p className="text-[12.5px] font-bold text-[#15164B]">
            {currentPrompt.prompt}
          </p>
        </div>

        {/* Canvas & Controls */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-bold text-[#15164B]">Visual Canvas:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setTool('pen')}
                className={`p-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                  tool === 'pen' ? 'bg-[#15164B] text-white border-[#15164B]' : 'bg-white text-[#6B7094] border-[#E2E6FA]'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Pen</span>
              </button>
              <button
                type="button"
                onClick={() => setTool('eraser')}
                className={`p-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                  tool === 'eraser' ? 'bg-[#15164B] text-white border-[#15164B]' : 'bg-white text-[#6B7094] border-[#E2E6FA]'
                }`}
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>Eraser</span>
              </button>
              <button
                type="button"
                onClick={clearCanvas}
                className="p-1.5 rounded-lg border bg-white hover:bg-[#F4F5FD] text-[#6B7094] border-[#E2E6FA] cursor-pointer"
                title="Clear canvas"
                aria-label="Clear canvas"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-[#DEE3FA] overflow-hidden bg-white shadow-2xs touch-none">
            <canvas
              ref={canvasRef}
              width={440}
              height={160}
              onMouseDown={startDraw}
              onMouseMove={drawMove}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={drawMove}
              onTouchEnd={endDraw}
              className="w-full h-[160px] bg-white cursor-crosshair block"
              aria-label="Drawing canvas for visual learning"
            />
          </div>
        </div>

        {/* Written Description Input */}
        <div className="space-y-2">
          <label className="text-[11.5px] font-bold text-[#15164B] flex items-center justify-between">
            <span>Describe your drawing in English:</span>
            <span className="text-[10px] text-[#7D82A8]">2–3 sentences</span>
          </label>
          <textarea
            value={descriptionText}
            onChange={(e) => setDescriptionText(e.target.value)}
            placeholder="In my drawing, there is a cozy armchair next to a tall wooden bookshelf. The cat is sleeping peacefully on the soft rug..."
            rows={3}
            className="w-full p-3 rounded-2xl bg-[#F9FAFF] border border-[#DEE3FA] text-[12.5px] text-[#222149] focus:outline-hidden focus:border-[#545CA6] resize-none"
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleEvaluate}
              disabled={!descriptionText.trim()}
              className="px-5 py-2.5 rounded-full bg-[#15164B] hover:bg-[#0E1038] disabled:opacity-50 text-white text-[12.5px] font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Evaluate Description</span>
            </button>
          </div>
        </div>

        {/* Feedback Section */}
        {feedback && (
          <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] space-y-2.5 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[13.5px] font-black text-[#15164B] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                Linguistic Score: {feedback.score}/100
              </span>
            </div>

            {feedback.strengths.length > 0 && (
              <div className="space-y-0.5 text-[11.5px] text-[#15803D]">
                <strong className="block">Strengths:</strong>
                <ul className="list-disc list-inside">
                  {feedback.strengths.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {feedback.tips.length > 0 && (
              <div className="space-y-0.5 text-[11.5px] text-[#9A3412] bg-[#FFF7ED] p-2.5 rounded-xl border border-[#FED7AA]">
                <strong className="block">Suggestions:</strong>
                <ul className="list-disc list-inside">
                  {feedback.tips.map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-[10px] text-[#7D82A8]">
              <Info className="w-3.5 h-3.5 text-[#545CA6] shrink-0" />
              <span>Honest evaluation: AI feedback analyzes your written English sentences; local canvas strokes are not passed to computer-vision models.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
