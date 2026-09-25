import React from 'react';
import { History, Trash2, BookOpen, Clock, ArrowUpRight, X } from 'lucide-react';
import { StudyPackage } from '../types/result';

interface SessionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  savedSessions: StudyPackage[];
  onSelectSession: (session: StudyPackage) => void;
  onDeleteSession: (sessionId: string, e: React.MouseEvent) => void;
  onClearAll: () => void;
}

export const SessionHistory: React.FC<SessionHistoryProps> = ({
  isOpen,
  onClose,
  savedSessions,
  onSelectSession,
  onDeleteSession,
  onClearAll,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">
                Saved Study Sessions
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                {savedSessions.length} {savedSessions.length === 1 ? 'deck' : 'decks'} stored in browser
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sessions List */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-3 flex-1">
          {savedSessions.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-zinc-500 text-sm">
              <BookOpen className="w-9 h-9 mx-auto mb-2.5 opacity-40 text-indigo-500" />
              <p className="font-semibold text-slate-700 dark:text-zinc-300">No saved study decks yet</p>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Generated decks are automatically saved to your local workspace.</p>
            </div>
          ) : (
            savedSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => {
                  onSelectSession(session);
                  onClose();
                }}
                className="group p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800/90 hover:border-indigo-400 dark:hover:border-indigo-600 bg-slate-50/50 dark:bg-zinc-800/40 hover:bg-white dark:hover:bg-zinc-800/80 cursor-pointer transition-all flex items-start justify-between gap-3 shadow-2xs hover:shadow-card-subtle"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {session.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-1 mt-0.5 leading-relaxed">
                    {session.summary}
                  </p>
                  <div className="flex items-center gap-2.5 mt-2.5 text-[11px] text-slate-400 dark:text-zinc-500 font-mono">
                    <span className="bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md font-semibold text-slate-600 dark:text-zinc-300">
                      {session.cards.length} cards
                    </span>
                    <span>•</span>
                    <span>{session.quiz.length} questions</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-sans">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(session.generatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 pt-0.5">
                  <button
                    onClick={(e) => onDeleteSession(session.id, e)}
                    className="p-2 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-all"
                    title="Delete session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ArrowUpRight className="w-4 h-4 text-slate-300 dark:text-zinc-600 group-hover:text-indigo-500 transition-colors" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {savedSessions.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-950/50 flex justify-end">
            <button
              onClick={onClearAll}
              className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1.5 font-semibold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All History
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
