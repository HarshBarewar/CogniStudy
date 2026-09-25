import React, { useState } from 'react';
import { ShieldAlert, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { ChaosMode } from '../types/result';

interface ChaosTestingBarProps {
  onTriggerChaos: (mode: ChaosMode) => void;
  onTriggerRaceCondition: () => void;
  isLoading: boolean;
}

export const ChaosTestingBar: React.FC<ChaosTestingBarProps> = ({
  onTriggerChaos,
  onTriggerRaceCondition,
  isLoading,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full bg-zinc-950 text-zinc-200 border-b border-white/[0.08] text-xs transition-all backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-emerald-400/50" />
          <span className="font-semibold text-zinc-300 flex items-center gap-1.5 font-mono text-[11px] sm:text-xs">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            Interview Evaluation Playground: AI Failure Resilience
          </span>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold px-2.5 py-1 rounded-lg hover:bg-zinc-800/80 transition-colors"
        >
          <span>{isOpen ? 'Close Failure Scenarios' : 'Test Failure Modes (20% Rubric)'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-zinc-800/80 bg-zinc-950/90 px-4 py-3.5 animate-slide-up">
          <div className="max-w-5xl mx-auto">
            <p className="text-[11px] text-zinc-400 mb-2.5">
              Click any scenario below to verify that CogniStudy gracefully catches unpredictable AI errors without UI crashes or hangs:
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onTriggerChaos('malformed')}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-800/70 text-amber-300 hover:bg-amber-900/60 transition-all font-mono text-[11px] flex items-center gap-1.5 disabled:opacity-40 active:scale-95 shadow-2xs"
              >
                <Zap className="w-3 h-3 text-amber-400" /> Malformed JSON
              </button>

              <button
                onClick={() => onTriggerChaos('wrong_shape')}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-800/70 text-purple-300 hover:bg-purple-900/60 transition-all font-mono text-[11px] flex items-center gap-1.5 disabled:opacity-40 active:scale-95 shadow-2xs"
              >
                <Zap className="w-3 h-3 text-purple-400" /> Wrong JSON Shape
              </button>

              <button
                onClick={() => onTriggerChaos('empty')}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-300 hover:bg-zinc-800 transition-all font-mono text-[11px] flex items-center gap-1.5 disabled:opacity-40 active:scale-95 shadow-2xs"
              >
                <Zap className="w-3 h-3 text-zinc-400" /> Empty Payload
              </button>

              <button
                onClick={() => onTriggerChaos('slow')}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-xl bg-blue-950/60 border border-blue-800/70 text-blue-300 hover:bg-blue-900/60 transition-all font-mono text-[11px] flex items-center gap-1.5 disabled:opacity-40 active:scale-95 shadow-2xs"
              >
                <Zap className="w-3 h-3 text-blue-400" /> Slow Response (8s)
              </button>

              <button
                onClick={() => onTriggerChaos('server_error')}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-xl bg-rose-950/60 border border-rose-800/70 text-rose-300 hover:bg-rose-900/60 transition-all font-mono text-[11px] flex items-center gap-1.5 disabled:opacity-40 active:scale-95 shadow-2xs"
              >
                <Zap className="w-3 h-3 text-rose-400" /> 500 Server Error
              </button>

              <button
                onClick={onTriggerRaceCondition}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-xl bg-indigo-950/60 border border-indigo-800/70 text-indigo-300 hover:bg-indigo-900/60 transition-all font-mono text-[11px] flex items-center gap-1.5 disabled:opacity-40 active:scale-95 shadow-2xs"
                title="Fires a slow request followed by a fast request to demonstrate requestId.current protection"
              >
                <Zap className="w-3 h-3 text-indigo-400" /> Stale Race Condition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
