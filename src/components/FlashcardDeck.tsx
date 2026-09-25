import React, { useState, useEffect, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  RotateCw, 
  CheckCircle2, 
  HelpCircle, 
  Shuffle, 
  Volume2
} from 'lucide-react';
import { Flashcard } from '../types/result';

interface FlashcardDeckProps {
  cards: Flashcard[];
  onToggleMastery: (cardId: string) => void;
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({ cards, onToggleMastery }) => {
  const [deck, setDeck] = useState<Flashcard[]>(cards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Sync internal deck when cards prop changes
  useEffect(() => {
    setDeck(cards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
  }, [cards]);

  const currentCard = deck[currentIndex];

  const handleNext = useCallback(() => {
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex((prev) => (prev + 1) % deck.length);
  }, [deck.length]);

  const handlePrev = useCallback(() => {
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex((prev) => (prev - 1 + deck.length) % deck.length);
  }, [deck.length]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleShuffle = () => {
    const shuffled = [...deck].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleNext, handlePrev]);

  // Audio speech synthesis helper for accessibility and polish
  const speakText = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  if (!currentCard) return null;

  const masteredCount = deck.filter((c) => c.mastered).length;
  const progressPercent = Math.round(((currentIndex + 1) / deck.length) * 100);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center select-none animate-fade-in">
      {/* Top Deck Stats & Controls */}
      <div className="w-full flex items-center justify-between px-2 mb-4 text-xs font-medium text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg font-mono">
            Card {currentIndex + 1} of {deck.length}
          </span>
          <span className="hidden sm:inline-block text-slate-400 dark:text-slate-600">•</span>
          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {masteredCount} Mastered
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShuffle}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            title="Shuffle Deck"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Shuffle</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mb-6 overflow-hidden">
        <div 
          className="h-full bg-indigo-600 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 3D Flip Flashcard */}
      <div 
        onClick={handleFlip}
        tabIndex={0}
        role="button"
        aria-label={`Flashcard: ${isFlipped ? 'Answer side' : 'Question side'}. Press Space to flip.`}
        className="w-full h-80 sm:h-96 perspective-1000 cursor-pointer focus:outline-none focus:ring-4 focus:ring-indigo-500/20 rounded-3xl"
      >
        <div 
          className={`relative w-full h-full duration-500 preserve-3d transition-transform rounded-3xl shadow-md hover:shadow-xl ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* FRONT SIDE */}
          <div className="absolute inset-0 backface-hidden w-full h-full bg-white dark:bg-slate-900 border-2 border-indigo-100 dark:border-slate-800 rounded-3xl p-8 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400">
                {currentCard.category || 'Concept'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => speakText(currentCard.front, e)}
                  title="Read aloud"
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                {currentCard.mastered && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mastered
                  </span>
                )}
              </div>
            </div>

            <div className="my-auto text-center px-4">
              <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 leading-snug">
                {currentCard.front}
              </p>

              {/* Collapsible Hint */}
              {currentCard.hint && (
                <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                  {!showHint ? (
                    <button
                      onClick={() => setShowHint(true)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      <HelpCircle className="w-3.5 h-3.5" /> Need a hint?
                    </button>
                  ) : (
                    <div className="inline-block p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-800 dark:text-amber-200 animate-fade-in max-w-sm">
                      <span className="font-bold">Hint: </span>{currentCard.hint}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1">
                <RotateCw className="w-3.5 h-3.5" /> Click or Space to reveal answer
              </span>
              <span className="font-mono text-[11px]">Side 1 / 2</span>
            </div>
          </div>

          {/* BACK SIDE */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 w-full h-full bg-gradient-to-br from-indigo-900 to-slate-900 text-white border-2 border-indigo-700/50 rounded-3xl p-8 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full bg-white/10 text-indigo-200">
                Answer & Key Takeaway
              </span>
              <button
                onClick={(e) => speakText(currentCard.back, e)}
                title="Read aloud"
                className="p-1.5 rounded-full hover:bg-white/10 text-indigo-200 hover:text-white transition-colors"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <div className="my-auto text-center px-4 overflow-y-auto max-h-48">
              <p className="text-lg sm:text-xl font-medium text-indigo-50 leading-relaxed">
                {currentCard.back}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-indigo-200/70">
              <span className="flex items-center gap-1">
                <RotateCw className="w-3.5 h-3.5" /> Click or Space to flip back
              </span>
              <span className="font-mono text-[11px]">Side 2 / 2</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Interactive Controls */}
      <div className="w-full flex items-center justify-between mt-6 px-2">
        <button
          onClick={handlePrev}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl shadow-xs transition-all active:scale-95 text-sm font-semibold"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Mastered Toggle */}
        <button
          onClick={() => onToggleMastery(currentCard.id)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all shadow-xs active:scale-95 ${
            currentCard.mastered
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 text-slate-700 dark:text-slate-200'
          }`}
        >
          <CheckCircle2 className={`w-4 h-4 ${currentCard.mastered ? 'text-white' : 'text-emerald-500'}`} />
          <span>{currentCard.mastered ? 'Mastered!' : 'Mark Mastered'}</span>
        </button>

        <button
          onClick={handleNext}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl shadow-xs transition-all active:scale-95 text-sm font-semibold"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
        <span className="hidden sm:inline">Shortcuts: </span>
        <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[11px] font-mono border border-slate-200 dark:border-slate-700">Space</kbd> Flip · 
        <kbd className="ml-1 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[11px] font-mono border border-slate-200 dark:border-slate-700">←</kbd> Prev · 
        <kbd className="ml-1 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[11px] font-mono border border-slate-200 dark:border-slate-700">→</kbd> Next
      </div>
    </div>
  );
};
