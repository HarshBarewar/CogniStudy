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
    <div className="w-full max-w-2xl mx-auto my-8 p-6 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-2xl shadow-sm text-center animate-slide-up">
      <div className="w-14 h-14 mx-auto mb-4 bg-rose-50 dark:bg-rose-950/50 rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-400">
        <AlertTriangle className="w-7 h-7" />
      </div>

      <div className="inline-block px-3 py-1 mb-2 text-xs font-mono font-medium rounded-full border shadow-2xs">
        <span className={`inline-block px-2.5 py-0.5 rounded-full border ${getBadgeStyle()}`}>
          {error.type}
        </span>
      </div>

      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
        {error.title}
      </h3>

      <p className="text-slate-600 dark:text-slate-300 text-sm max-w-md mx-auto mb-6">
        {error.message}
      </p>

      {error.isRetryable && (
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl transition-all shadow-sm hover:shadow active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Retrying Generation...' : 'Retry Request'}
        </button>
      )}

      {/* Technical Diagnostics Accordion for Interview Review */}
      {hasDiagnostics && (
        <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 text-left">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-mono py-1"
          >
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-slate-400" />
              Technical Error Diagnostics & Raw AI Payload
            </span>
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showDetails && (
            <div className="mt-3 p-3.5 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono overflow-x-auto space-y-2 border border-slate-800">
              {error.details && (
                <div>
                  <span className="text-rose-400 font-semibold">Error Details: </span>
                  <span>{error.details}</span>
                </div>
              )}
              {error.rawPayload !== undefined && error.rawPayload !== null && (
                <div>
                  <span className="text-amber-400 font-semibold block mb-1 flex items-center gap-1">
                    <Bug className="w-3 h-3" /> Raw Returned AI Payload:
                  </span>
                  <pre className="p-2.5 bg-black/50 rounded-lg text-emerald-400 text-[11px] whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
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
