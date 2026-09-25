import React, { useState } from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  FileText, 
  Share2, 
  Download, 
  Check 
} from 'lucide-react';
import { StudyPackage } from '../types/result';
import { FlashcardDeck } from './FlashcardDeck';
import { QuizView } from './QuizView';
import { RefinementInput } from './RefinementInput';

interface ResultViewProps {
  studyPackage: StudyPackage;
  onToggleMastery: (cardId: string) => void;
  onRefine: (instructions: string) => void;
  isRefining: boolean;
  isMock: boolean;
}

type TabType = 'flashcards' | 'quiz' | 'summary';

export const ResultView: React.FC<ResultViewProps> = ({
  studyPackage,
  onToggleMastery,
  onRefine,
  isRefining,
  isMock,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('flashcards');
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(
      `CogniStudy AI — ${studyPackage.title}\n\nSummary:\n${studyPackage.summary}\n\nGenerated with AI Structured Data.`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(studyPackage, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${studyPackage.title.toLowerCase().replace(/\s+/g, '-')}-study-deck.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-8 animate-fade-in relative z-10">
      {/* Deck Header */}
      <div className="p-6 sm:p-8 liquid-glass specular-card shadow-liquid-card rounded-3xl mb-6 relative overflow-hidden backdrop-blur-2xl border border-white/30 dark:border-white/10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-[280px]">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                Active Study Deck
              </span>
              {!isMock ? (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-liquid-glow" />
                  Live AI (Hugging Face)
                </span>
              ) : (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30" title="Offline Demo Fallback Mode.">
                  Demo Mode
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight leading-tight">
              {studyPackage.title}
            </h2>
            <p className="text-slate-700 dark:text-zinc-300 text-sm mt-3 leading-relaxed max-w-2xl font-medium">
              {studyPackage.summary}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleShare}
              className="px-4 py-2.5 rounded-2xl liquid-glass border border-white/30 dark:border-white/10 hover:border-cyan-400/40 text-slate-700 dark:text-zinc-200 text-xs font-bold flex items-center gap-2 transition-all shadow-liquid-card active:scale-95 hover:bg-white/20 dark:hover:bg-white/10"
              title="Copy Summary to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-cyan-500" />}
              <span>{copied ? 'Copied!' : 'Share'}</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="px-4 py-2.5 rounded-2xl liquid-glass border border-white/30 dark:border-white/10 hover:border-cyan-400/40 text-slate-700 dark:text-zinc-200 text-xs font-bold flex items-center gap-2 transition-all shadow-liquid-card active:scale-95 hover:bg-white/20 dark:hover:bg-white/10"
              title="Export Structured JSON payload"
            >
              <Download className="w-4 h-4 text-cyan-500" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Fluid Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-6 border-t border-white/20 dark:border-white/10 overflow-x-auto">
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'flashcards'
                ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 text-white shadow-liquid-glow scale-[1.02]'
                : 'liquid-glass border border-white/20 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/20 dark:hover:bg-white/10'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Flashcards ({studyPackage.cards.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'quiz'
                ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 text-white shadow-liquid-glow scale-[1.02]'
                : 'liquid-glass border border-white/20 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/20 dark:hover:bg-white/10'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Interactive Quiz ({studyPackage.quiz.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('summary')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'summary'
                ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 text-white shadow-liquid-glow scale-[1.02]'
                : 'liquid-glass border border-white/20 dark:border-white/10 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/20 dark:hover:bg-white/10'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Summary & Cards List</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'flashcards' && (
        <FlashcardDeck
          cards={studyPackage.cards}
          onToggleMastery={onToggleMastery}
        />
      )}

      {activeTab === 'quiz' && (
        <QuizView questions={studyPackage.quiz} />
      )}

      {activeTab === 'summary' && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-6 sm:p-8 liquid-glass specular-card shadow-liquid-card rounded-3xl backdrop-blur-2xl border border-white/30 dark:border-white/10">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
              Topic Synthesis Overview
            </h3>
            <p className="text-slate-700 dark:text-zinc-300 text-sm leading-relaxed mb-6 font-medium">
              {studyPackage.summary}
            </p>

            <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-cyan-400 mb-4">
              All Generated Flashcards ({studyPackage.cards.length})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {studyPackage.cards.map((c, i) => (
                <div 
                  key={c.id}
                  className="p-5 rounded-2xl liquid-glass specular-card border border-white/20 dark:border-white/10 hover:border-cyan-400/40 hover:shadow-liquid-glow transition-all hover:scale-[1.01]"
                >
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 dark:text-zinc-400 mb-2">
                    <span className="font-bold">Card #{i + 1}</span>
                    <span className="text-indigo-700 dark:text-cyan-300 font-sans font-extrabold text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-400/30">
                      {c.category}
                    </span>
                  </div>
                  <p className="font-extrabold text-slate-900 dark:text-zinc-100 text-sm mb-2">{c.front}</p>
                  <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed font-medium">{c.back}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Refinement Loop */}
      <RefinementInput
        activeTopicTitle={studyPackage.title}
        onRefine={onRefine}
        isLoading={isRefining}
      />
    </div>
  );
};
