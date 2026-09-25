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
    <div className="w-full bg-slate-900 text-slate-200 border-b border-slate-800 text-xs transition-all">
      <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-300 flex items-center gap-1.5 font-mono text-[11px] sm:text-xs">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            Interview Evaluation Playground: AI Failure Resilience
          </span>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium px-2 py-0.5 rounded hover:bg-slate-800 transition-colors"
        >
          <span>{isOpen ? 'Hide Test Scenarios' : 'Test Failure Modes (20% Rubric)'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-slate-800/80 bg-slate-950/60 px-4 py-3 animate-slide-up">
          <div className="max-w-5xl mx-auto">
            <p className="text-[11px] text-slate-400 mb-2">
              Click any scenario below to verify that CogniStudy gracefully catches unpredictable AI errors without UI crashes or hangs:
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onTriggerChaos('malformed')}
                disabled={isLoading}
                className="px-2.5 py-1.5 rounded-lg bg-amber-950/70 border border-amber-800/80 text-amber-300 hover:bg-amber-900/80 transition-colors font-mono text-[11px] flex items-center gap-1 disabled:opacity-50"
              >
                <Zap className="w-3 h-3" /> Malformed JSON
              </button>

              <button
                onClick={() => onTriggerChaos('wrong_shape')}
                disabled={isLoading}
                className="px-2.5 py-1.5 rounded-lg bg-purple-950/70 border border-purple-800/80 text-purple-300 hover:bg-purple-900/80 transition-colors font-mono text-[11px] flex items-center gap-1 disabled:opacity-50"
              >
                <Zap className="w-3 h-3" /> Wrong JSON Shape
              </button>

              <button
                onClick={() => onTriggerChaos('empty')}
                disabled={isLoading}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors font-mono text-[11px] flex items-center gap-1 disabled:opacity-50"
              >
                <Zap className="w-3 h-3" /> Empty Payload
              </button>

              <button
                onClick={() => onTriggerChaos('slow')}
                disabled={isLoading}
                className="px-2.5 py-1.5 rounded-lg bg-blue-950/70 border border-blue-800/80 text-blue-300 hover:bg-blue-900/80 transition-colors font-mono text-[11px] flex items-center gap-1 disabled:opacity-50"
              >
                <Zap className="w-3 h-3" /> Slow Response (8s)
              </button>

              <button
                onClick={() => onTriggerChaos('server_error')}
                disabled={isLoading}
                className="px-2.5 py-1.5 rounded-lg bg-rose-950/70 border border-rose-800/80 text-rose-300 hover:bg-rose-900/80 transition-colors font-mono text-[11px] flex items-center gap-1 disabled:opacity-50"
              >
                <Zap className="w-3 h-3" /> 500 Server Error
              </button>

              <button
                onClick={onTriggerRaceCondition}
                disabled={isLoading}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-950/70 border border-indigo-800/80 text-indigo-300 hover:bg-indigo-900/80 transition-colors font-mono text-[11px] flex items-center gap-1 disabled:opacity-50"
                title="Fires a slow request followed by a fast request to demonstrate requestId.current protection"
              >
                <Zap className="w-3 h-3" /> Stale Race Condition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
