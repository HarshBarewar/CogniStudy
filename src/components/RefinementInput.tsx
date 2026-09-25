import React, { useState } from 'react';
import { Send, Sparkles, SlidersHorizontal } from 'lucide-react';

interface RefinementInputProps {
  onRefine: (instructions: string) => void;
  isLoading: boolean;
  activeTopicTitle: string;
}

const QUICK_REFINEMENTS = [
  'Add 3 more advanced flashcards',
  'Make the quiz questions more challenging',
  'Simplify explanations for beginners',
  'Focus more on edge cases and failure modes',
];

export const RefinementInput: React.FC<RefinementInputProps> = ({
  onRefine,
  isLoading,
  activeTopicTitle,
}) => {
  const [instructions, setInstructions] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instructions.trim() || isLoading) return;
    onRefine(instructions.trim());
    setInstructions('');
  };

  const handleQuickRefine = (text: string) => {
    if (isLoading) return;
    onRefine(text);
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-8 p-6 bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-3xl shadow-card-subtle animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-200">
          Refine Study Deck ({activeTopicTitle})
        </h4>
      </div>

      <p className="text-xs text-slate-500 dark:text-zinc-400 mb-3.5 leading-relaxed">
        Ask the AI to expand depth, add specific edge cases, or adjust explanations without restarting your session:
      </p>

      {/* Quick refinement suggestions */}
      <div className="flex flex-wrap gap-2 mb-4">
        {QUICK_REFINEMENTS.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleQuickRefine(item)}
            disabled={isLoading}
            className="text-xs px-3 py-1.5 rounded-full bg-slate-100 dark:bg-zinc-800/80 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400 text-slate-600 dark:text-zinc-300 transition-all border border-slate-200/50 dark:border-white/[0.04] disabled:opacity-50 active:scale-95"
          >
            + {item}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          disabled={isLoading}
          placeholder="e.g. 'Add a card explaining how Promise.all differs from Promise.race'..."
          className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-zinc-800/70 border border-slate-200/80 dark:border-zinc-700/80 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 transition-all"
        />
        <button
          type="submit"
          disabled={!instructions.trim() || isLoading}
          className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-zinc-800 text-white disabled:text-slate-400 dark:disabled:text-zinc-600 rounded-2xl transition-all shadow-xs active:scale-95 disabled:scale-100"
          title="Send Refinement"
        >
          {isLoading ? (
            <Sparkles className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
};
