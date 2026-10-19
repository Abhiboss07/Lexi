import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  Palette,
  RotateCcw,
  Eraser,
  PenTool,
  Trash2,
  Save,
  FolderOpen,
  Sparkles,
  Type,
} from 'lucide-react';
import type { SavedDrawing } from '../../types/quickPicks';
import { quickPicksRepository } from '../../db/quickPicksRepository';

interface SketchExplainModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

const COLOR_OPTIONS = [
  { hex: '#15164B', name: 'Indigo' },
  { hex: '#545CA6', name: 'Periwinkle' },
  { hex: '#EA580C', name: 'Coral' },
  { hex: '#059669', name: 'Emerald' },
  { hex: '#D97706', name: 'Amber' },
  { hex: '#4B5563', name: 'Charcoal' },
];

const SKETCH_PROMPTS = [
  {
    title: 'Morning Routine Objects',
    prompt: 'Sketch 3 items from your morning routine and label each in English (e.g. coffee mug, alarm clock, keys).',
  },
  {
    title: 'Cozy Café Corner',
    prompt: 'Draw a welcoming café table scene and label elements: pastry, barista, counter, menu.',
  },
  {
    title: 'Spatial Prepositions',
    prompt: 'Illustrate prepositions of place: "The cat is on the cushion, and the book is under the desk".',
  },
  {
    title: 'Vocabulary Mind-Map',
    prompt: 'Draw a central circle with the word "CONFIDENT" and connect 4 associated feelings or synonyms.',
  },
];

export const SketchExplainModal: React.FC<SketchExplainModalProps> = ({
  isOpen,
  onClose,
  userId = 'local-learner-1',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<'pen' | 'eraser'>('pen');
  const [currentColor, setCurrentColor] = useState('#15164B');
  const lineWidth = 4;
  const [undoStack, setUndoStack] = useState<ImageData[]>([]);

  // Metadata form
  const [title, setTitle] = useState('');
  const [explanation, setExplanation] = useState('');
  const [labelsInput, setLabelsInput] = useState('');
  const [activePromptIndex, setActivePromptIndex] = useState(0);

  // Mode: Draw vs Text-Alternative
  const [isTextAlternative, setIsTextAlternative] = useState(false);
  const [textDescription, setTextDescription] = useState('');

  // Gallery of saved sketches
  const [savedDrawings, setSavedDrawings] = useState<SavedDrawing[]>([]);
  const [showGallery, setShowGallery] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadDrawings = async () => {
    try {
      const list = await quickPicksRepository.getDrawings(userId);
      setSavedDrawings(list);
    } catch (e) {
      console.error('Failed to load drawings:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDrawings();
      setTitle(SKETCH_PROMPTS[0].title);
    }
  }, [isOpen, userId]);

  // Canvas initialization
  useEffect(() => {
    if (!isOpen || isTextAlternative || showGallery) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill white background if first load
    if (undoStack.length === 0) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const initial = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setUndoStack([initial]);
    }
  }, [isOpen, isTextAlternative, showGallery]);

  const saveCanvasState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setUndoStack((prev) => [...prev.slice(-15), data]);
  };

  const handleUndo = () => {
    if (undoStack.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newStack = [...undoStack];
    newStack.pop(); // Remove current
    const previous = newStack[newStack.length - 1];
    ctx.putImageData(previous, 0, 0);
    setUndoStack(newStack);
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveCanvasState();
  };

  // Pointer events for Canvas
  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = currentTool === 'eraser' ? '#FFFFFF' : currentColor;
    ctx.lineWidth = currentTool === 'eraser' ? lineWidth * 3 : lineWidth;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch (err) {
        // Ignore if pointer capture lost
      }
    }
    saveCanvasState();
  };

  const handleSaveDrawing = async () => {
    let dataUrl = '';
    if (canvasRef.current && !isTextAlternative) {
      dataUrl = canvasRef.current.toDataURL('image/png');
    }

    const labels = labelsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const newDrawing: SavedDrawing = {
      id: `drawing-${Date.now()}`,
      userId,
      title: title.trim() || SKETCH_PROMPTS[activePromptIndex].title,
      prompt: SKETCH_PROMPTS[activePromptIndex].prompt,
      explanation: isTextAlternative ? textDescription.trim() : explanation.trim(),
      dataUrl,
      labels,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await quickPicksRepository.saveDrawing(newDrawing);
      setStatusMessage('✓ Drawing saved to local notebook!');
      setTimeout(() => setStatusMessage(null), 3000);
      await loadDrawings();
    } catch (err) {
      console.error('Failed to save drawing:', err);
      setStatusMessage('Error saving drawing.');
    }
  };

  const handleLoadDrawing = (drawing: SavedDrawing) => {
    setTitle(drawing.title);
    setExplanation(drawing.explanation);
    setLabelsInput(drawing.labels.join(', '));
    setShowGallery(false);

    if (drawing.dataUrl) {
      setIsTextAlternative(false);
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        saveCanvasState();
      };
      img.src = drawing.dataUrl;
    } else {
      setIsTextAlternative(true);
      setTextDescription(drawing.explanation);
    }
  };

  const handleDeleteDrawing = async (id: string) => {
    try {
      await quickPicksRepository.deleteDrawing(id);
      await loadDrawings();
    } catch (err) {
      console.error('Failed to delete drawing:', err);
    }
  };

  if (!isOpen) return null;

  const currentPrompt = SKETCH_PROMPTS[activePromptIndex];

  return (
    <div
      className="fixed inset-0 z-50 bg-[#15164B]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sketch-explain-title"
    >
      <div className="bg-[#FAF9FE] w-full max-w-xl rounded-[28px] border border-[#E2E6FD] shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#ECEEFE] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#EFF2FE] border border-[#D5D8EE] flex items-center justify-center text-[#545CA6]">
              <Palette className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="sketch-explain-title" className="text-[17px] font-black text-[#15164B] tracking-tight">
                  Sketch & Explain
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C3AED] bg-[#F5F3FF] px-2 py-0.5 rounded-full">
                  Visual Canvas
                </span>
              </div>
              <p className="text-[11.5px] font-medium text-[#7D82A8]">
                Draw scenes, mind-map words, and label objects to reinforce memory
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F0F2FE] hover:bg-[#E2E6FD] text-[#545CA6] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close sketch canvas modal"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Top Bar: Prompt Selector & Gallery Button */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-[#5B618E] uppercase tracking-wider">
                Prompt:
              </span>
              <select
                value={activePromptIndex}
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  setActivePromptIndex(idx);
                  setTitle(SKETCH_PROMPTS[idx].title);
                }}
                className="px-2.5 py-1 bg-white rounded-xl border border-[#DCE0F7] text-[11.5px] font-bold text-[#15164B] focus:outline-hidden"
              >
                {SKETCH_PROMPTS.map((p, idx) => (
                  <option key={idx} value={idx}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsTextAlternative(!isTextAlternative)}
                className="px-2.5 py-1 rounded-xl bg-white border border-[#DCE0F7] text-[11px] font-bold text-[#5B618E] hover:bg-[#F0F2FE] flex items-center gap-1 cursor-pointer"
              >
                <Type className="w-3 h-3" />
                <span>{isTextAlternative ? 'Switch to Canvas' : 'Text Mode'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowGallery(!showGallery)}
                className="px-2.5 py-1 rounded-xl bg-white border border-[#DCE0F7] text-[11px] font-bold text-[#5B618E] hover:bg-[#F0F2FE] flex items-center gap-1 cursor-pointer"
              >
                <FolderOpen className="w-3 h-3" />
                <span>Saved ({savedDrawings.length})</span>
              </button>
            </div>
          </div>

          {/* Active Prompt Box */}
          <div className="p-3 bg-[#F0F2FE] rounded-2xl border border-[#D5D8EE] flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-[#545CA6] shrink-0 mt-0.5" />
            <p className="text-[12px] text-[#232655] font-semibold leading-relaxed">
              {currentPrompt.prompt}
            </p>
          </div>

          {showGallery ? (
            /* Saved Sketches Gallery */
            <div className="space-y-3 bg-white p-4 rounded-2xl border border-[#ECEEFE]">
              <div className="flex items-center justify-between pb-2 border-b border-[#ECEEFE]">
                <h3 className="text-[14px] font-black text-[#15164B]">Your Saved Sketches</h3>
                <button
                  onClick={() => setShowGallery(false)}
                  className="text-[11.5px] font-bold text-[#545CA6] hover:underline"
                >
                  Back to Canvas
                </button>
              </div>

              {savedDrawings.length === 0 ? (
                <p className="py-8 text-center text-[12px] text-[#7D82A8]">
                  No saved drawings yet. Draw a sketch and tap "Save Drawing" below!
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto p-1">
                  {savedDrawings.map((d) => (
                    <div
                      key={d.id}
                      className="p-2.5 rounded-xl border border-[#ECEEFE] bg-[#FAF9FE] space-y-1.5 hover:border-[#CCD1F5] transition-all"
                    >
                      {d.dataUrl ? (
                        <img
                          src={d.dataUrl}
                          alt={d.title}
                          className="w-full h-24 object-contain bg-white rounded-lg border border-[#E2E6FD]"
                        />
                      ) : (
                        <div className="w-full h-24 bg-white rounded-lg border border-[#E2E6FD] flex items-center justify-center p-2 text-center text-[11px] text-[#7D82A8] font-medium">
                          Text Description
                        </div>
                      )}
                      <h4 className="text-[12px] font-bold text-[#15164B] truncate">{d.title}</h4>
                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => handleLoadDrawing(d)}
                          className="text-[10.5px] font-bold text-[#545CA6] hover:underline"
                        >
                          Load
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDrawing(d.id)}
                          className="text-[10.5px] font-bold text-[#DC2626] hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : isTextAlternative ? (
            /* Text-Based Alternative Mode */
            <div className="space-y-3 bg-white p-4 rounded-2xl border border-[#ECEEFE]">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#5B618E] block">
                  Describe Your Visual Scene in English:
                </label>
                <textarea
                  value={textDescription}
                  onChange={(e) => setTextDescription(e.target.value)}
                  rows={5}
                  placeholder="Describe your scene, mind-map, or diagram in text (e.g., In the center is a wooden desk. On the left sits a steaming coffee cup...)"
                  className="w-full p-3 bg-[#F9F9FE] rounded-xl border border-[#DCE0F7] text-[12.5px] text-[#15164B] font-medium leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-[#545CA6]"
                />
              </div>
            </div>
          ) : (
            /* Interactive Canvas Board */
            <div className="space-y-3">
              {/* Toolbar */}
              <div className="flex items-center justify-between gap-2 p-2 bg-white rounded-2xl border border-[#ECEEFE] shadow-xs flex-wrap">
                {/* Tool toggle: Pen vs Eraser */}
                <div className="flex items-center gap-1 bg-[#F0F2FE] p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setCurrentTool('pen')}
                    className={`p-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                      currentTool === 'pen' ? 'bg-[#15164B] text-white' : 'text-[#5B618E] hover:text-[#15164B]'
                    }`}
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Pen</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentTool('eraser')}
                    className={`p-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                      currentTool === 'eraser' ? 'bg-[#15164B] text-white' : 'text-[#5B618E] hover:text-[#15164B]'
                    }`}
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span>Eraser</span>
                  </button>
                </div>

                {/* Color Swatches */}
                {currentTool === 'pen' && (
                  <div className="flex items-center gap-1.5">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setCurrentColor(c.hex)}
                        className={`w-6 h-6 rounded-full transition-transform cursor-pointer border ${
                          currentColor === c.hex ? 'scale-110 ring-2 ring-[#545CA6]' : 'border-black/10'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                        aria-label={`Color ${c.name}`}
                      />
                    ))}
                  </div>
                )}

                {/* Undo & Clear */}
                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={undoStack.length <= 1}
                    className="p-1.5 rounded-xl border border-[#DCE0F7] text-[#5B618E] hover:bg-[#F0F2FE] disabled:opacity-40 cursor-pointer"
                    title="Undo stroke"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleClearCanvas}
                    className="p-1.5 rounded-xl border border-[#DCE0F7] text-[#DC2626] hover:bg-[#FEE2E2] cursor-pointer"
                    title="Clear canvas"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Drawing Surface */}
              <div className="relative rounded-2xl border border-[#DCE0F7] overflow-hidden bg-white shadow-xs touch-none">
                <canvas
                  ref={canvasRef}
                  width={520}
                  height={280}
                  className="w-full h-[240px] sm:h-[280px] cursor-crosshair block"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                />
              </div>
            </div>
          )}

          {/* Metadata Inputs (Title, English Labels, Explanation) */}
          <div className="space-y-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-[#ECEEFE] shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10.5px] font-bold uppercase tracking-wider text-[#5B618E] block mb-1">
                  Sketch Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. My Morning Routine Desk"
                  className="w-full px-3 py-1.5 bg-[#F9F9FE] rounded-xl border border-[#DCE0F7] text-[12px] text-[#15164B] font-semibold focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[10.5px] font-bold uppercase tracking-wider text-[#5B618E] block mb-1">
                  English Object Labels
                </label>
                <input
                  type="text"
                  value={labelsInput}
                  onChange={(e) => setLabelsInput(e.target.value)}
                  placeholder="e.g. coffee mug, notebook, keys"
                  className="w-full px-3 py-1.5 bg-[#F9F9FE] rounded-xl border border-[#DCE0F7] text-[12px] text-[#15164B] focus:outline-hidden"
                />
              </div>
            </div>

            {!isTextAlternative && (
              <div>
                <label className="text-[10.5px] font-bold uppercase tracking-wider text-[#5B618E] block mb-1">
                  Short Explanation / English Notes (Optional)
                </label>
                <input
                  type="text"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="e.g. I drew my breakfast table with the cup under the window."
                  className="w-full px-3 py-1.5 bg-[#F9F9FE] rounded-xl border border-[#DCE0F7] text-[12px] text-[#15164B] focus:outline-hidden"
                />
              </div>
            )}
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className="p-2.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-[11.5px] font-bold text-center">
              {statusMessage}
            </div>
          )}

          {/* Bottom Save & Disclosure */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10.5px] font-semibold text-[#8E93B8]">
              Local Offline Canvas (Private & on-device)
            </span>
            <button
              onClick={handleSaveDrawing}
              className="px-5 py-2.5 rounded-full bg-[#15164B] hover:bg-[#0E1038] text-white text-[12px] font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
            >
              <Save className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Save Drawing</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
