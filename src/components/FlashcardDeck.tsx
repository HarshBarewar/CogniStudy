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

  // 3D Gyroscopic Parallax Tilt & Specular Light Sheen (Flam 3D Feel)
  const [tilt, setTilt] = useState({ x: 0, y: 0, glareX: 50, glareY: 50, isHovering: false });

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    // Calculate tilt angles (max +/- 10 degrees)
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;
    setTilt({
      x: rotateX,
      y: rotateY,
      glareX: (x / rect.width) * 100,
      glareY: (y / rect.height) * 100,
      isHovering: true,
    });
  };

  const handleCardMouseLeave = () => {
    setTilt({ x: 0, y: 0, glareX: 50, glareY: 50, isHovering: false });
  };

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
      <div className="w-full flex items-center justify-between px-2 mb-3 text-xs font-medium text-slate-500 dark:text-zinc-400">
        <div className="flex items-center gap-2.5">
          <span className="px-3.5 py-1.5 liquid-glass rounded-xl font-mono text-[11px] font-bold text-indigo-600 dark:text-cyan-400 shadow-2xs">
            Card {currentIndex + 1} of {deck.length}
          </span>
          <span className="hidden sm:inline-block text-slate-300 dark:text-zinc-700">•</span>
          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-bold text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {masteredCount} Mastered
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShuffle}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl liquid-glass hover:brightness-105 text-slate-700 dark:text-zinc-300 transition-all active:scale-95 text-xs font-semibold shadow-2xs"
            title="Shuffle Deck"
          >
            <Shuffle className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Shuffle</span>
          </button>
        </div>
      </div>

      {/* Fluid Glowing Progress Bar */}
      <div className="w-full h-2 bg-slate-200/50 dark:bg-zinc-800/60 rounded-full mb-6 overflow-hidden p-[1px] backdrop-blur-xs">
        <div 
          className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(99,102,241,0.6)]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 3D Gyroscopic Holographic Flip Card */}
      <div 
        onClick={handleFlip}
        onMouseMove={handleCardMouseMove}
        onMouseLeave={handleCardMouseLeave}
        tabIndex={0}
        role="button"
        aria-label={`Flashcard: ${isFlipped ? 'Answer side' : 'Question side'}. Press Space to flip.`}
        className="w-full h-88 sm:h-96 perspective-1000 cursor-pointer focus:outline-none focus:ring-4 focus:ring-indigo-500/20 rounded-3xl"
      >
        <div 
          className="relative w-full h-full preserve-3d rounded-3xl shadow-liquid-card dark:shadow-liquid-card-dark transition-transform duration-300 ease-out"
          style={{
            transform: isFlipped 
              ? `rotateY(180deg) rotateX(${tilt.x * 0.7}deg) rotateZ(${tilt.y * 0.3}deg)` 
              : `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transition: tilt.isHovering ? 'transform 0.15s ease-out' : 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          {/* FRONT SIDE */}
          <div className="absolute inset-0 backface-hidden w-full h-full liquid-glass specular-card rounded-3xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden">
            {/* Dynamic Specular Light Glare (Holographic reflection) */}
            <div 
              className="pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-200"
              style={{
                opacity: tilt.isHovering ? 0.35 : 0.1,
                background: `radial-gradient(400px circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.7) 0%, rgba(99,102,241,0.1) 40%, transparent 80%)`
              }}
            />

            {/* Subtle floating chromatic orb in card background */}
            <div className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-indigo-500/10 to-cyan-400/10 rounded-full blur-2xl" />

            <div className="flex items-center justify-between relative z-10">
              <span className="text-xs uppercase tracking-wider font-extrabold px-3.5 py-1 rounded-full bg-gradient-to-r from-indigo-500/15 to-cyan-500/15 text-indigo-600 dark:text-cyan-400 border border-indigo-400/30 flex items-center gap-1.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                {currentCard.category || 'Core Concept'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => speakText(currentCard.front, e)}
                  title="Read question aloud"
                  className="p-2 rounded-xl liquid-glass hover:brightness-110 text-slate-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-cyan-300 transition-all"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                {currentCard.mastered && (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/30 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mastered
                  </span>
                )}
              </div>
            </div>

            <div className="my-auto text-center px-2 sm:px-6 relative z-10">
              <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-snug tracking-tight">
                {currentCard.front}
              </p>

              {/* Collapsible Hint */}
              {currentCard.hint && (
                <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                  {!showHint ? (
                    <button
                      onClick={() => setShowHint(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:brightness-110 px-3.5 py-1.5 rounded-xl liquid-glass border border-amber-400/40 shadow-2xs transition-all active:scale-95"
                    >
                      <HelpCircle className="w-3.5 h-3.5" /> Need a hint?
                    </button>
                  ) : (
                    <div className="inline-block p-3.5 liquid-glass border border-amber-400/50 rounded-2xl text-xs text-amber-900 dark:text-amber-200 animate-fade-in max-w-sm text-left shadow-md">
                      <span className="font-bold">💡 Hint: </span>{currentCard.hint}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-zinc-400 pt-3 border-t border-white/20 dark:border-white/10 relative z-10 font-medium">
              <span className="flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5 text-indigo-500 animate-spin-slow" /> Click or Space to flip
              </span>
              <span className="font-mono text-[11px] font-bold">Side 1 / 2</span>
            </div>
          </div>

          {/* BACK SIDE (Luminous Obsidian Ocean) */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 w-full h-full bg-gradient-to-br from-indigo-950 via-[#0a0d18] to-[#170a2c] text-white border-2 border-indigo-400/30 rounded-3xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-2xl">
            {/* Dynamic Specular Glare on Back */}
            <div 
              className="pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-200"
              style={{
                opacity: tilt.isHovering ? 0.3 : 0.08,
                background: `radial-gradient(400px circle at ${100 - tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.4) 0%, rgba(168,85,247,0.15) 50%, transparent 80%)`
              }}
            />

            <div className="flex items-center justify-between relative z-10">
              <span className="text-xs uppercase tracking-wider font-extrabold px-3.5 py-1 rounded-full bg-white/10 text-cyan-200 backdrop-blur-md border border-white/15 flex items-center gap-1.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Explanation & Rationale
              </span>
              <button
                onClick={(e) => speakText(currentCard.back, e)}
                title="Read answer aloud"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-cyan-200 hover:text-white transition-all backdrop-blur-md"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <div className="my-auto text-center px-2 sm:px-6 overflow-y-auto max-h-48 py-2 relative z-10">
              <p className="text-base sm:text-lg font-medium text-indigo-50 leading-relaxed">
                {currentCard.back}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-indigo-200/80 pt-3 border-t border-white/10 relative z-10 font-medium">
              <span className="flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5 text-cyan-400" /> Click or Space to flip back
              </span>
              <span className="font-mono text-[11px] text-cyan-300 font-bold">Side 2 / 2</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Interactive Controls */}
      <div className="w-full flex items-center justify-between mt-6 px-2">
        <button
          onClick={handlePrev}
          className="flex items-center gap-1.5 px-4 py-2.5 liquid-glass hover:brightness-105 text-slate-700 dark:text-zinc-200 rounded-2xl shadow-2xs transition-all active:scale-95 text-xs sm:text-sm font-bold"
        >
          <ChevronLeft className="w-4 h-4 text-indigo-500" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Mastered Toggle */}
        <button
          onClick={() => onToggleMastery(currentCard.id)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-95 ${
            currentCard.mastered
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/25'
              : 'liquid-glass hover:border-emerald-500/50 hover:text-emerald-500 text-slate-700 dark:text-zinc-200'
          }`}
        >
          <CheckCircle2 className={`w-4 h-4 ${currentCard.mastered ? 'text-white' : 'text-emerald-500'}`} />
          <span>{currentCard.mastered ? 'Mastered!' : 'Mark Mastered'}</span>
        </button>

        <button
          onClick={handleNext}
          className="flex items-center gap-1.5 px-4 py-2.5 liquid-glass hover:brightness-105 text-slate-700 dark:text-zinc-200 rounded-2xl shadow-2xs transition-all active:scale-95 text-xs sm:text-sm font-bold"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4 text-indigo-500" />
        </button>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="mt-5 text-center text-xs text-slate-400 dark:text-zinc-400 flex items-center justify-center gap-2">
        <span className="hidden sm:inline font-medium">Shortcuts:</span>
        <kbd className="px-2 py-0.5 liquid-glass rounded-md text-[11px] font-mono border border-white/20 text-slate-700 dark:text-zinc-300 shadow-2xs">Space</kbd> Flip · 
        <kbd className="px-2 py-0.5 liquid-glass rounded-md text-[11px] font-mono border border-white/20 text-slate-700 dark:text-zinc-300 shadow-2xs">←</kbd> Prev · 
        <kbd className="px-2 py-0.5 liquid-glass rounded-md text-[11px] font-mono border border-white/20 text-slate-700 dark:text-zinc-300 shadow-2xs">→</kbd> Next
      </div>
    </div>
  );
};
