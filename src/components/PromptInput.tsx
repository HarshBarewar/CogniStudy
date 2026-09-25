import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, CornerDownLeft, Eraser, Lightbulb, FileText, Compass } from 'lucide-react';
import { InputMode } from '../types/result';

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
    setPrompt(text);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const wordCount = prompt.trim() ? prompt.trim().split(/\s+/).length : 0;

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Input Mode Selector Toggle */}
      <div className="flex p-1.5 bg-slate-200/70 dark:bg-slate-800/80 rounded-2xl mb-4 max-w-md mx-auto shadow-inner">
        <button
          type="button"
          onClick={() => setMode('topic')}
          className={`flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            mode === 'topic'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Topic Mode</span>
        </button>
        <button
          type="button"
          onClick={() => setMode('notes')}
          className={`flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
            mode === 'notes'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Prewritten Notes Mode</span>
        </button>
      </div>

      {/* Mode Description Banner */}
      <div className="text-center mb-3">
        {mode === 'topic' ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            <strong className="text-indigo-600 dark:text-indigo-400">Topic Mode:</strong> Enter any subject (Maths, Science, History, Geography, Economics, Arts, Tech). AI will retrieve authentic domain knowledge and build logical flashcards & quizzes.
          </p>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            <strong className="text-indigo-600 dark:text-indigo-400">Prewritten Notes Mode:</strong> Paste your notes, textbook paragraphs, or syllabus. AI will strictly extract facts and construct questions based exclusively on the provided text.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <div className="relative rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all p-4">
          <label htmlFor="prompt-input" className="sr-only">
            {mode === 'topic' ? 'Enter a topic' : 'Paste prewritten study notes'}
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
                ? "e.g. 'Mughal Empire Mansabdari System', 'Calculus Integration by Parts', 'Price Elasticity of Demand', 'Plate Tectonics', 'Cellular Respiration'..."
                : "Paste your raw lecture notes, article excerpts, or textbook text here (AI will strictly formulate questions based on your text)..."
            }
            rows={mode === 'notes' ? 6 : 4}
            className="w-full bg-transparent resize-none outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-base leading-relaxed"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
              <span className="font-mono font-medium">{wordCount} words · {prompt.length} chars</span>
              {mode === 'notes' && wordCount > 0 && wordCount < 40 && (
                <span className="text-amber-500 text-[11px]">Tip: Longer notes yield deeper questions</span>
              )}
              {prompt.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPrompt('')}
                  className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <Eraser className="w-3.5 h-3.5" /> Clear
                </button>
              )}
              <span className="hidden sm:inline-block">Press Ctrl + Enter to submit</span>
            </div>

            <button
              type="submit"
              disabled={!prompt.trim() || isLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 font-semibold text-sm rounded-2xl shadow-sm hover:shadow transition-all active:scale-95 disabled:scale-100"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isLoading ? 'Synthesizing...' : mode === 'topic' ? 'Generate from Topic' : 'Extract from Notes'}</span>
              <CornerDownLeft className="w-3.5 h-3.5 opacity-70 hidden sm:inline" />
            </button>
          </div>
        </div>
      </form>

      {/* Quick Sample Prompts tailored to current mode */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1">
          <Lightbulb className="w-3.5 h-3.5" /> Try a sample ({mode === 'topic' ? 'Topics' : 'Notes'}):
        </span>
        {(mode === 'topic' ? TOPIC_SAMPLES : NOTES_SAMPLES).map((sample, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handlePickSample(sample.text)}
            className="text-xs px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/70 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-400 text-slate-600 dark:text-slate-300 transition-all border border-slate-200/60 dark:border-slate-800"
          >
            {sample.label}
          </button>
        ))}
      </div>
    </div>
  );
};
