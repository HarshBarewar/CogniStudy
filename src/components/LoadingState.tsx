import React, { useState, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';

interface LoadingStateProps {
  onCancel?: () => void;
  topic?: string;
}

const PROGRESS_STAGES = [
  'Synthesizing notes and isolating key concepts...',
  'Extracting core definitions and memory anchors...',
  'Structuring interactive 3D flashcards...',
  'Generating multiple-choice questions and explanations...',
  'Validating strict JSON schema and integrity...',
];

export const LoadingState: React.FC<LoadingStateProps> = ({ onCancel, topic }) => {
  const [stageIndex, setStageIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const stageInterval = setInterval(() => {
      setStageIndex((prev) => (prev < PROGRESS_STAGES.length - 1 ? prev + 1 : prev));
    }, 1800);

    const timerInterval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(stageInterval);
      clearInterval(timerInterval);
    };
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto my-12 p-8 bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-3xl shadow-card-subtle text-center animate-fade-in">
      {/* Central Spinner with Sparkle */}
      <div className="relative w-16 h-16 mx-auto mb-5 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-indigo-950/80 border-t-indigo-600 animate-spin" />
        <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-pulse" />
      </div>

      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
        {topic ? `Generating Deck for "${topic.slice(0, 36)}${topic.length > 36 ? '...' : ''}"` : 'Synthesizing Study Materials'}
      </h3>

      <div className="h-6 flex items-center justify-center mb-1">
        <p className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 font-semibold transition-all duration-300">
          {PROGRESS_STAGES[stageIndex]}
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-zinc-500 font-mono">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Elapsed: {elapsedSeconds}s · Sub-10s Latency Target</span>
      </div>

      {/* Shimmering Skeleton Cards Preview */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
        <div className="relative overflow-hidden p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/40 space-y-3">
          <div className="h-3 w-1/3 bg-slate-200 dark:bg-zinc-700 rounded-full" />
          <div className="h-4 w-4/5 bg-slate-300 dark:bg-zinc-600 rounded-lg" />
          <div className="h-3 w-2/3 bg-slate-200 dark:bg-zinc-700 rounded-lg" />
          <div className="absolute inset-0 shimmer-gradient animate-shimmer pointer-events-none" />
        </div>
        <div className="relative overflow-hidden p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/40 space-y-3 hidden md:block">
          <div className="h-3 w-1/4 bg-slate-200 dark:bg-zinc-700 rounded-full" />
          <div className="h-4 w-3/4 bg-slate-300 dark:bg-zinc-600 rounded-lg" />
          <div className="h-3 w-1/2 bg-slate-200 dark:bg-zinc-700 rounded-lg" />
          <div className="absolute inset-0 shimmer-gradient animate-shimmer pointer-events-none" />
        </div>
      </div>

      {onCancel && (
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800/80">
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 px-3.5 py-1.5 rounded-xl transition-all"
          >
            <X className="w-3.5 h-3.5" /> Cancel Request
          </button>
        </div>
      )}
    </div>
  );
};
