import React from 'react';
import { History, Trash2, BookOpen, Clock, ArrowUpRight, X } from 'lucide-react';
import { StudyPackage } from '../types/result';
import { playWaterDrop } from '../utils/soundEffects';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-fade-in">
      <div 
        className="w-full max-w-lg liquid-glass specular-card rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-up backdrop-blur-2xl border border-white/30 dark:border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/20 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl liquid-glass flex items-center justify-center text-cyan-400 border border-cyan-400/30 shadow-liquid-glow">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">
                Saved Study Sessions
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-zinc-400 font-medium">
                {savedSessions.length} {savedSessions.length === 1 ? 'deck' : 'decks'} stored in workspace
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl liquid-glass hover:bg-white/20 text-slate-400 hover:text-slate-800 dark:hover:text-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sessions List */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-3 flex-1">
          {savedSessions.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-zinc-500 text-sm">
              <BookOpen className="w-9 h-9 mx-auto mb-2.5 opacity-40 text-cyan-500" />
              <p className="font-bold text-slate-800 dark:text-zinc-200">No saved study decks yet</p>
              <p className="text-xs text-slate-400 dark:text-zinc-400 mt-1">Generated decks are automatically saved to your local workspace.</p>
            </div>
          ) : (
            savedSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => {
                  playWaterDrop();
                  onSelectSession(session);
                  onClose();
                }}
                className="group p-4.5 rounded-2xl liquid-glass specular-card border border-white/20 dark:border-white/10 hover:border-cyan-400/50 hover:shadow-liquid-glow cursor-pointer transition-all flex items-start justify-between gap-3 shadow-2xs hover:scale-[1.01]"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm truncate group-hover:text-cyan-400 transition-colors">
                    {session.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-zinc-300 line-clamp-1 mt-1 leading-relaxed font-medium">
                    {session.summary}
                  </p>
                  <div className="flex items-center gap-2.5 mt-2.5 text-[11px] text-slate-400 dark:text-zinc-400 font-mono">
                    <span className="liquid-glass border border-white/20 px-2 py-0.5 rounded-md font-bold text-cyan-500 dark:text-cyan-300">
                      {session.cards.length} cards
                    </span>
                    <span>•</span>
                    <span>{session.quiz.length} questions</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-sans font-medium">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(session.generatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 pt-0.5">
                  <button
                    onClick={(e) => onDeleteSession(session.id, e)}
                    className="p-2 rounded-xl opacity-0 group-hover:opacity-100 liquid-glass hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all border border-transparent hover:border-rose-400/30"
                    title="Delete session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:text-cyan-400 transition-colors" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {savedSessions.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-white/20 dark:border-white/10 flex justify-end">
            <button
              onClick={onClearAll}
              className="text-xs text-rose-500 hover:text-rose-400 flex items-center gap-1.5 font-bold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All History
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
