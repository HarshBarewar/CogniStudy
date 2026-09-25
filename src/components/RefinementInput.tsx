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
    <div className="w-full max-w-2xl mx-auto my-8 p-6 sm:p-7 liquid-glass specular-card shadow-liquid-card rounded-3xl backdrop-blur-2xl border border-white/30 dark:border-white/10 animate-fade-in relative z-10">
      <div className="flex items-center gap-2 mb-2">
        <SlidersHorizontal className="w-4 h-4 text-cyan-500" />
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-zinc-200">
          Refine Study Deck ({activeTopicTitle})
        </h4>
      </div>

      <p className="text-xs text-slate-600 dark:text-zinc-400 mb-4 leading-relaxed font-medium">
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
            className="text-xs px-3.5 py-1.5 rounded-full liquid-glass border border-white/20 dark:border-white/10 hover:border-cyan-400/50 hover:text-cyan-400 text-slate-700 dark:text-zinc-300 transition-all disabled:opacity-40 active:scale-95 shadow-2xs font-semibold"
          >
            + {item}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
        <input
          type="text"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          disabled={isLoading}
          placeholder="e.g. 'Add a card explaining how Promise.all differs from Promise.race'..."
          className="flex-1 px-4 py-3 text-xs sm:text-sm liquid-glass border border-white/30 dark:border-white/10 rounded-2xl outline-none focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-500/20 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 transition-all font-medium"
        />
        <button
          type="submit"
          disabled={!instructions.trim() || isLoading}
          className="p-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:brightness-110 disabled:opacity-40 text-white rounded-2xl transition-all shadow-liquid-glow active:scale-95 disabled:scale-100 disabled:shadow-none"
          title="Send Refinement"
        >
          {isLoading ? (
            <Sparkles className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Send className="w-4 h-4 text-white" />
          )}
        </button>
      </form>
    </div>
  );
};
