import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, CornerDownLeft, Eraser, Lightbulb } from 'lucide-react';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
  initialValue?: string;
}

const SAMPLE_PROMPTS = [
  {
    label: '⚡ JS Event Loop',
    text: 'Explain the JavaScript Event Loop, Call Stack, Task Queue, Microtasks vs Macrotasks, and how Promises execute compared to setTimeout.',
  },
  {
    label: '🌿 Photosynthesis',
    text: 'Explain the light-dependent reactions of photosynthesis in the thylakoid membrane, photolysis of water, and the Calvin cycle in the stroma with RuBisCO.',
  },
  {
    label: '🏗️ System Design',
    text: 'Compare Microservices vs Monolithic architecture, discussing CAP Theorem, database per service, and Circuit Breaker patterns.',
  },
];

export const PromptInput: React.FC<PromptInputProps> = ({
  onSubmit,
  isLoading,
  initialValue = '',
}) => {
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
    onSubmit(prompt.trim());
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

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all p-4">
          <label htmlFor="prompt-input" className="sr-only">
            Paste notes or enter a topic
          </label>
          <textarea
            id="prompt-input"
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Paste your raw notes, article snippet, or topic here (e.g. 'Photosynthesis and cellular respiration', 'Distributed locks in Redis', 'Heart anatomy')..."
            rows={4}
            className="w-full bg-transparent resize-none outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-base leading-relaxed"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
              <span>{prompt.length} chars</span>
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
              <span>{isLoading ? 'Synthesizing...' : 'Generate Study Deck'}</span>
              <CornerDownLeft className="w-3.5 h-3.5 opacity-70 hidden sm:inline" />
            </button>
          </div>
        </div>
      </form>

      {/* Quick Sample Prompts for Instant Testing */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1">
          <Lightbulb className="w-3.5 h-3.5" /> Try a sample:
        </span>
        {SAMPLE_PROMPTS.map((sample, idx) => (
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
