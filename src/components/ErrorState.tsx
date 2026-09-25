import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Bug, Terminal } from 'lucide-react';
import { AppError } from '../types/result';

interface ErrorStateProps {
  error: AppError;
  onRetry: () => void;
  isRetrying?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry, isRetrying = false }) => {
  const [showDetails, setShowDetails] = useState(false);

  // Friendly badge color depending on error classification
  const getBadgeStyle = () => {
    switch (error.type) {
      case 'MALFORMED_JSON':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300';
      case 'INVALID_SHAPE':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300';
      case 'TIMEOUT':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300';
      case 'EMPTY_DATA':
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300';
      default:
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300';
    }
  };

  const hasDiagnostics = Boolean(error.details || error.rawPayload);

  return (
    <div className="w-full max-w-2xl mx-auto my-8 p-6 sm:p-8 bg-white dark:bg-zinc-900 border border-rose-200/80 dark:border-rose-900/50 rounded-3xl shadow-card-subtle text-center animate-slide-up">
      <div className="w-14 h-14 mx-auto mb-4 bg-rose-50 dark:bg-rose-950/50 rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40 shadow-xs">
        <AlertTriangle className="w-7 h-7" />
      </div>

      <div className="mb-2">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-mono font-bold border ${getBadgeStyle()}`}>
          {error.type}
        </span>
      </div>

      <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
        {error.title}
      </h3>

      <p className="text-slate-600 dark:text-zinc-300 text-sm max-w-md mx-auto mb-6 leading-relaxed">
        {error.message}
      </p>

      {error.isRetryable && (
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm rounded-2xl transition-all shadow-sm hover:shadow-glow-brand active:scale-[0.98] disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
          <span>{isRetrying ? 'Retrying Generation...' : 'Retry Request'}</span>
        </button>
      )}

      {/* Technical Diagnostics Accordion for Interview Review */}
      {hasDiagnostics && (
        <div className="mt-8 pt-5 border-t border-slate-100 dark:border-zinc-800/80 text-left">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between text-xs text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 font-mono py-1 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-indigo-500" />
              Technical Error Diagnostics & Raw AI Payload
            </span>
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showDetails && (
            <div className="mt-3 p-4 bg-slate-950 text-slate-200 rounded-2xl text-xs font-mono overflow-x-auto space-y-2.5 border border-zinc-800 shadow-inner">
              {error.details && (
                <div>
                  <span className="text-rose-400 font-bold">Error Details: </span>
                  <span className="text-slate-300">{error.details}</span>
                </div>
              )}
              {error.rawPayload !== undefined && error.rawPayload !== null && (
                <div>
                  <span className="text-amber-400 font-bold block mb-1.5 flex items-center gap-1.5">
                    <Bug className="w-3.5 h-3.5" /> Raw Returned AI Payload:
                  </span>
                  <pre className="p-3 bg-black/60 rounded-xl text-emerald-400 text-[11px] whitespace-pre-wrap break-all max-h-48 overflow-y-auto border border-zinc-800">
                    {typeof error.rawPayload === 'string'
                      ? error.rawPayload
                      : JSON.stringify(error.rawPayload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
