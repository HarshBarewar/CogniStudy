import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, CornerDownLeft, Eraser, Lightbulb, FileText, Compass } from 'lucide-react';
import { InputMode } from '../types/result';
import { playWaterDrop } from '../utils/soundEffects';

interface PromptInputProps {
  onSubmit: (prompt: string, mode: InputMode) => void;
  isLoading: boolean;
  initialValue?: string;
  initialMode?: InputMode;
}

const TOPIC_SAMPLES = [
  {
    label: '🏛️ Mughal Administration',
    text: 'Mughal Empire Mansabdari System and Administrative Hierarchy under Akbar',
  },
  {
    label: '📐 Calculus Integration',
    text: 'Integration by Parts and Definite Integrals in Calculus',
  },
  {
    label: '📈 Supply & Demand',
    text: 'Price Elasticity of Demand and Market Equilibrium in Economics',
  },
  {
    label: '🧬 DNA Replication',
    text: 'DNA Replication Fork, DNA Polymerase III, and Okazaki Fragments in Molecular Biology',
  },
  {
    label: '🌍 Plate Tectonics',
    text: 'Plate Tectonics, Convergent Boundaries, and Continental Drift in Physical Geography',
  },
];

const NOTES_SAMPLES = [
  {
    label: '🌿 Biology Notes (Photosynthesis)',
    text: `Photosynthesis in C3 plants begins when photons hit photosystem II in the thylakoid membrane, causing photolysis of water into protons, electrons, and diatomic oxygen (O2). The generated electrons flow through the electron transport chain to reduce NADP+ into NADPH, while a proton gradient drives ATP synthase to produce ATP in the stroma. In the stroma, the enzyme RuBisCO catalyzes carbon fixation by attaching CO2 to ribulose 1,5-bisphosphate (RuBP), which ultimately produces glyceraldehyde 3-phosphate (G3P). Photorespiration occurs when RuBisCO binds oxygen instead of carbon dioxide, reducing photosynthetic efficiency.`,
  },
  {
    label: '⚖️ Commerce Notes (Consumer Protection)',
    text: `The Consumer Protection Act establishes a three-tier quasi-judicial consumer disputes redressal machinery: District Consumer Commission, State Consumer Commission, and National Consumer Commission. A consumer is defined as any person who buys goods or hires services for consideration, excluding purchases made for commercial resale purposes. Six consumer rights are recognized: Right to Safety, Right to Information, Right to Choice, Right to be Heard, Right to Seek Redressal, and Right to Consumer Education. Unfair trade practices encompass misleading advertisements, false quality certifications, and overcharging above the Maximum Retail Price (MRP).`,
  },
];

export const PromptInput: React.FC<PromptInputProps> = ({
  onSubmit,
  isLoading,
  initialValue = '',
  initialMode = 'topic',
}) => {
  const [mode, setMode] = useState<InputMode>(initialMode);
  const [prompt, setPrompt] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialValue) {
      setPrompt(initialValue);
    }
  }, [initialValue]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    onSubmit(prompt.trim(), mode);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePickSample = (text: string) => {
    playWaterDrop();
    setPrompt(text);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const wordCount = prompt.trim() ? prompt.trim().split(/\s+/).length : 0;

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Precision Liquid Sliding Mode Selector */}
      <div className="relative flex p-1.5 liquid-glass specular-card rounded-2xl mb-4 max-w-md mx-auto shadow-liquid-card dark:shadow-liquid-card-dark overflow-hidden">
        {/* Animated Liquid Sliding Pill */}
        <div 
          className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-cyan-500/20 border border-indigo-400/40 dark:border-cyan-400/40 rounded-xl transition-all duration-300 ease-out shadow-sm pointer-events-none"
          style={{
            left: mode === 'topic' ? '6px' : 'calc(50%)',
          }}
        />

        <button
          type="button"
          onClick={() => { playWaterDrop(); setMode('topic'); }}
          className={`relative z-10 flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors duration-200 ${
            mode === 'topic'
              ? 'text-indigo-600 dark:text-cyan-300'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <Compass className={`w-4 h-4 ${mode === 'topic' ? 'text-indigo-600 dark:text-cyan-400' : 'text-slate-400 dark:text-zinc-500'}`} />
          <span>Topic Mode</span>
          {mode === 'topic' && (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => { playWaterDrop(); setMode('notes'); }}
          className={`relative z-10 flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors duration-200 ${
            mode === 'notes'
              ? 'text-indigo-600 dark:text-cyan-300'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
          }`}
        >
          <FileText className={`w-4 h-4 ${mode === 'notes' ? 'text-indigo-600 dark:text-cyan-400' : 'text-slate-400 dark:text-zinc-500'}`} />
          <span>Prewritten Notes</span>
          {mode === 'notes' && (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* Mode Guidance Microcopy */}
      <div className="text-center mb-3">
        {mode === 'topic' ? (
          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
            <span className="font-bold text-indigo-600 dark:text-cyan-400">Curriculum Synthesis:</span> Enter any syllabus topic (STEM, Humanities, Commerce). AI retrieves authentic domain knowledge into 3D cards & quizzes.
          </p>
        ) : (
          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
            <span className="font-bold text-indigo-600 dark:text-cyan-400">Reading Comprehension:</span> Paste study notes or syllabus text. AI strictly evaluates and questions your provided material.
          </p>
        )}
      </div>

      {/* Liquid Studio Input Module */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative rounded-3xl liquid-glass specular-card shadow-liquid-card dark:shadow-liquid-card-dark focus-within:shadow-liquid-glow focus-within:border-cyan-400/50 transition-all duration-300 p-4 sm:p-5">
          <label htmlFor="prompt-input" className="sr-only">
            {mode === 'topic' ? 'Enter a study topic' : 'Paste prewritten study notes'}
          </label>
          <textarea
            id="prompt-input"
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={
              mode === 'topic'
                ? "e.g. 'Mughal Empire Mansabdari System', 'Calculus Integration by Parts', 'Price Elasticity of Demand', 'Plate Tectonics'..."
                : "Paste your raw lecture notes, article excerpts, or textbook paragraphs here (AI will strictly formulate questions based on your text)..."
            }
            rows={mode === 'notes' ? 6 : 3}
            className="w-full bg-transparent resize-none outline-none text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 text-sm sm:text-base leading-relaxed"
          />

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-3 border-t border-white/20 dark:border-white/10">
            <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-zinc-400">
              <span className="font-mono text-[11px] liquid-glass px-2.5 py-1 rounded-lg font-bold text-slate-700 dark:text-zinc-300 shadow-2xs">
                {wordCount} words · {prompt.length} chars
              </span>
              {mode === 'notes' && wordCount > 0 && wordCount < 30 && (
                <span className="text-amber-500 text-[11px] hidden sm:inline-block font-medium">
                  💡 Tip: Adding more notes yields richer questions
                </span>
              )}
              {prompt.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPrompt('')}
                  className="flex items-center gap-1 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors font-medium"
                >
                  <Eraser className="w-3.5 h-3.5" /> Clear
                </button>
              )}
              <span className="hidden md:inline-block text-[11px] font-medium">Press Ctrl + Enter</span>
            </div>

            <button
              type="submit"
              disabled={!prompt.trim() || isLoading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:brightness-110 active:scale-95 disabled:opacity-40 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-liquid-glow transition-all duration-300 disabled:shadow-none"
            >
              <Sparkles className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Synthesizing...' : mode === 'topic' ? 'Generate 3D Deck' : 'Extract Knowledge'}</span>
              <CornerDownLeft className="w-3.5 h-3.5 opacity-70 hidden sm:inline" />
            </button>
          </div>
        </div>
      </form>

      {/* Floating Sample Chips */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-400 dark:text-zinc-400 flex items-center gap-1.5 shrink-0">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Samples:
        </span>
        {(mode === 'topic' ? TOPIC_SAMPLES : NOTES_SAMPLES).map((sample, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handlePickSample(sample.text)}
            className="text-xs px-3.5 py-1.5 rounded-full liquid-glass hover:border-cyan-400/50 hover:text-cyan-600 dark:hover:text-cyan-300 text-slate-700 dark:text-zinc-300 transition-all active:scale-95 shadow-2xs font-medium"
          >
            {sample.label}
          </button>
        ))}
      </div>
    </div>
  );
};
