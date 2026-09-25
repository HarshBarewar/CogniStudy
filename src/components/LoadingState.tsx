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
    <div className="w-full max-w-2xl mx-auto my-12 p-8 sm:p-10 liquid-glass specular-card rounded-3xl shadow-liquid-card dark:shadow-liquid-card-dark text-center animate-fade-in relative z-10 backdrop-blur-2xl border border-white/30 dark:border-white/10 overflow-hidden">
      {/* Ambient background fluid glow */}
      <div className="pointer-events-none absolute -top-16 -left-16 w-64 h-64 bg-cyan-400/15 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -right-16 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl" />

      {/* Central Orbital Spinner with Sparkle */}
      <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-indigo-400/20 border-t-cyan-400 border-r-indigo-500 animate-spin shadow-liquid-glow" />
        <div className="absolute inset-2 rounded-full border border-purple-400/30 border-b-purple-400 animate-spin-reverse" />
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-cyan-400/20 flex items-center justify-center text-cyan-400 shadow-2xs backdrop-blur-md">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
      </div>

      <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
        {topic ? `Synthesizing "${topic.slice(0, 36)}${topic.length > 36 ? '...' : ''}"` : 'Synthesizing Study Materials'}
      </h3>

      <div className="h-6 flex items-center justify-center mb-3">
        <p className="text-xs sm:text-sm text-cyan-600 dark:text-cyan-300 font-bold transition-all duration-300">
          {PROGRESS_STAGES[stageIndex]}
        </p>
      </div>

      {/* Animated Liquid Progress Bar */}
      <div className="w-48 mx-auto h-1.5 bg-slate-200/50 dark:bg-zinc-800/60 rounded-full mb-4 overflow-hidden p-[0.5px]">
        <div className="h-full w-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 rounded-full animate-liquid-wave shadow-liquid-glow" />
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-zinc-400 font-mono">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span>Elapsed: {elapsedSeconds}s · Sub-10s Target</span>
      </div>

      {/* Shimmering Skeleton Cards Preview */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
        <div className="relative overflow-hidden p-5 rounded-2xl liquid-glass border border-white/20 dark:border-white/10 space-y-3 shadow-2xs">
          <div className="h-3 w-1/3 bg-slate-200/80 dark:bg-zinc-700/80 rounded-full" />
          <div className="h-4 w-4/5 bg-slate-300/80 dark:bg-zinc-600/80 rounded-lg" />
          <div className="h-3 w-2/3 bg-slate-200/80 dark:bg-zinc-700/80 rounded-lg" />
          <div className="absolute inset-0 shimmer-gradient animate-shimmer pointer-events-none" />
        </div>
        <div className="relative overflow-hidden p-5 rounded-2xl liquid-glass border border-white/20 dark:border-white/10 space-y-3 hidden md:block shadow-2xs">
          <div className="h-3 w-1/4 bg-slate-200/80 dark:bg-zinc-700/80 rounded-full" />
          <div className="h-4 w-3/4 bg-slate-300/80 dark:bg-zinc-600/80 rounded-lg" />
          <div className="h-3 w-1/2 bg-slate-200/80 dark:bg-zinc-700/80 rounded-lg" />
          <div className="absolute inset-0 shimmer-gradient animate-shimmer pointer-events-none" />
        </div>
      </div>

      {onCancel && (
        <div className="mt-6 pt-4 border-t border-white/20 dark:border-white/10">
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 liquid-glass hover:bg-white/20 px-4 py-2 rounded-xl transition-all"
          >
            <X className="w-3.5 h-3.5" /> Cancel Request
          </button>
        </div>
      )}
    </div>
  );
};
