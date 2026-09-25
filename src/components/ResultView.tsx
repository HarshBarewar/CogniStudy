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
    <div className="w-full max-w-4xl mx-auto my-8 animate-fade-in">
      {/* Deck Header */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-[280px]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400">
                Active Study Deck
              </span>
              {isMock && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60" title="Offline Demo Fallback Mode. Supply GEMINI_API_KEY in .env for live AI.">
                  Demo Mode
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {studyPackage.title}
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm mt-2 leading-relaxed">
              {studyPackage.summary}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleShare}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Copy Summary"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Share'}</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Export Structured JSON"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'flashcards'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Flashcards ({studyPackage.cards.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'quiz'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Interactive Quiz ({studyPackage.quiz.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('summary')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'summary'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
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
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Topic Synthesis Overview
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6">
              {studyPackage.summary}
            </p>

            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
              All Generated Flashcards ({studyPackage.cards.length})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {studyPackage.cards.map((c, i) => (
                <div 
                  key={c.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                >
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
                    <span>Card #{i + 1}</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-sans font-semibold">{c.category}</span>
                  </div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-2">{c.front}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{c.back}</p>
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
