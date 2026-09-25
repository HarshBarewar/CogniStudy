import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  ArrowRight, 
  RotateCcw, 
  Trophy, 
  Sparkles,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { QuizQuestion } from '../types/result';
import { playWaterDrop, playGlassChime, playSoftThud, playFluidWave } from '../utils/soundEffects';

interface QuizViewProps {
  questions: QuizQuestion[];
}

interface AnswerRecord {
  questionId: string;
  selectedOptionIndex: number;
  isCorrect: boolean;
}

export const QuizView: React.FC<QuizViewProps> = ({ questions }) => {
  // Working set of questions (can be full list or filtered wrong answers)
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>(questions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>({});
  const [isQuizComplete, setIsQuizComplete] = useState(false);
  const [isRetestingWrong, setIsRetestingWrong] = useState(false);

  // Sync when prop questions change
  useEffect(() => {
    setActiveQuestions(questions);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setAnswers({});
    setIsQuizComplete(false);
    setIsRetestingWrong(false);
  }, [questions]);

  const currentQ = activeQuestions[currentIndex];

  const handleSelectOption = (index: number) => {
    if (isAnswerSubmitted) return;
    playWaterDrop();
    setSelectedOption(index);
  };

  const handleSubmitAnswer = useCallback(() => {
    if (selectedOption === null || isAnswerSubmitted || !currentQ) return;

    const isCorrect = selectedOption === currentQ.correctIndex;
    setIsAnswerSubmitted(true);

    if (isCorrect) {
      playGlassChime();
    } else {
      playSoftThud();
    }

    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        questionId: currentQ.id,
        selectedOptionIndex: selectedOption,
        isCorrect,
      },
    }));
  }, [selectedOption, isAnswerSubmitted, currentQ]);

  const handleNextQuestion = () => {
    playWaterDrop();
    if (currentIndex < activeQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      setIsQuizComplete(true);
      // Trigger confetti celebration if high score
      const correctCount = Object.values(answers).filter((a) => a.isCorrect).length + (selectedOption === currentQ?.correctIndex ? 1 : 0);
      const totalCount = activeQuestions.length;
      if (correctCount / totalCount >= 0.7) {
        playGlassChime();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }
  };

  // Dedicated "Re-test Wrong Answers" feature
  const handleRetestWrongAnswers = () => {
    playFluidWave();
    const wrongQuestionIds = Object.values(answers)
      .filter((a) => !a.isCorrect)
      .map((a) => a.questionId);

    const filtered = questions.filter((q) => wrongQuestionIds.includes(q.id));

    if (filtered.length > 0) {
      setActiveQuestions(filtered);
      setCurrentIndex(0);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      // Clear answers for the retested set
      const cleanAnswers = { ...answers };
      filtered.forEach((q) => delete cleanAnswers[q.id]);
      setAnswers(cleanAnswers);
      setIsQuizComplete(false);
      setIsRetestingWrong(true);
    }
  };

  const handleRestartFullQuiz = () => {
    playFluidWave();
    setActiveQuestions(questions);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setAnswers({});
    setIsQuizComplete(false);
    setIsRetestingWrong(false);
  };

  // Keyboard navigation for options (1, 2, 3, 4, and Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (!isAnswerSubmitted) {
        if (['1', '2', '3', '4'].includes(e.key)) {
          const optIdx = parseInt(e.key, 10) - 1;
          if (currentQ && optIdx < currentQ.options.length) {
            setSelectedOption(optIdx);
          }
        } else if (e.key === 'Enter' && selectedOption !== null) {
          e.preventDefault();
          handleSubmitAnswer();
        }
      } else {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleNextQuestion();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswerSubmitted, selectedOption, currentQ, handleSubmitAnswer]);

  if (!questions || questions.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        No quiz questions available for this deck.
      </div>
    );
  }

  // QUIZ COMPLETED SUMMARY SCREEN
  if (isQuizComplete) {
    const totalAnswered = activeQuestions.length;
    const correctCount = activeQuestions.filter((q) => answers[q.id]?.isCorrect).length;
    const wrongCount = totalAnswered - correctCount;
    const scorePct = Math.round((correctCount / totalAnswered) * 100);

    return (
      <div className="w-full max-w-2xl mx-auto my-6 p-6 sm:p-8 liquid-glass specular-card rounded-3xl shadow-liquid-card dark:shadow-liquid-card-dark animate-slide-up text-center">
        <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-cyan-400/20 rounded-3xl flex items-center justify-center text-indigo-600 dark:text-cyan-400 border border-indigo-400/40 shadow-liquid-glow animate-float">
          {scorePct >= 80 ? <Trophy className="w-10 h-10 text-amber-400 animate-pulse" /> : <Sparkles className="w-10 h-10 text-cyan-400 animate-pulse" />}
        </div>

        <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">
          {isRetestingWrong ? 'Re-test Mastery Complete!' : 'Quiz Session Complete!'}
        </h3>
        <p className="text-slate-500 dark:text-zinc-400 text-sm mb-6 max-w-md mx-auto leading-relaxed">
          {scorePct === 100 
            ? 'Flawless mastery! Every objective concept verified.' 
            : scorePct >= 70 
            ? 'Great comprehension across core concepts and relationships.' 
            : 'Good effort! Review the concept rationales below to reinforce knowledge gaps.'}
        </p>

        {/* Luminous Score Ring / Pill */}
        <div className="inline-flex items-baseline gap-2.5 px-8 py-3.5 rounded-3xl liquid-glass border border-indigo-400/30 mb-8 shadow-liquid-glow">
          <span className={`text-5xl font-black tracking-tight ${scorePct >= 70 ? 'bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent' : 'bg-gradient-to-r from-indigo-500 to-cyan-400 bg-clip-text text-transparent'}`}>
            {scorePct}%
          </span>
          <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">
            ({correctCount} of {totalAnswered} correct)
          </span>
        </div>

        {/* Question Breakdown List */}
        <div className="text-left space-y-3.5 mb-8">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400 px-1">
            Question Review & Rationales
          </h4>
          {activeQuestions.map((q, idx) => {
            const isRight = answers[q.id]?.isCorrect;
            return (
              <div 
                key={q.id}
                className={`p-5 rounded-2xl border text-sm transition-all ${
                  isRight 
                    ? 'liquid-glass border-emerald-400/40 bg-emerald-500/[0.04]' 
                    : 'liquid-glass border-rose-400/40 bg-rose-500/[0.04]'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {isRight ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-slate-900 dark:text-white leading-snug">
                      {idx + 1}. {q.question}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-zinc-300 mt-1.5 font-medium">
                      <span className="font-bold text-slate-800 dark:text-white">Correct Answer: </span> 
                      {q.options[q.correctIndex]}
                    </p>
                    <div className="text-xs text-slate-600 dark:text-zinc-300 mt-2.5 p-3 rounded-xl bg-white/60 dark:bg-zinc-900/60 border border-white/20 dark:border-white/10 shadow-2xs">
                      <span className="font-bold text-indigo-600 dark:text-cyan-400">💡 Explanation: </span>
                      {q.explanation}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {wrongCount > 0 && (
            <button
              onClick={handleRetestWrongAnswers}
              className="flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:brightness-110 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.35)] transition-all active:scale-[0.98]"
            >
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
              <span>Re-test Missed Questions ({wrongCount})</span>
            </button>
          )}

          <button
            onClick={handleRestartFullQuiz}
            className="flex items-center gap-2 px-6 py-3 liquid-glass hover:brightness-105 text-slate-700 dark:text-zinc-200 font-bold text-xs sm:text-sm rounded-2xl transition-all active:scale-[0.98] shadow-2xs"
          >
            <RotateCcw className="w-4 h-4 text-indigo-500" />
            <span>Restart Entire Quiz</span>
          </button>
        </div>
      </div>
    );
  }

  // ACTIVE QUESTION SCREEN
  const progressPct = Math.round(((currentIndex + 1) / activeQuestions.length) * 100);

  return (
    <div className="w-full max-w-2xl mx-auto my-4 animate-fade-in">
      {/* Top Banner if in Re-test Mode */}
      {isRetestingWrong && (
        <div className="mb-4 p-3.5 liquid-glass border border-amber-400/50 rounded-2xl flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 animate-slide-up shadow-sm">
          <span className="flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 text-amber-500 animate-pulse" />
            Adaptive Drilling Mode: Focusing exclusively on missed questions
          </span>
          <button
            onClick={handleRestartFullQuiz}
            className="underline hover:text-amber-700 dark:hover:text-amber-100 font-extrabold"
          >
            Exit to Full Quiz
          </button>
        </div>
      )}

      {/* Progress & Counter */}
      <div className="flex items-center justify-between px-2 mb-2 text-xs font-bold text-slate-500 dark:text-zinc-400">
        <span className="font-mono text-[11px] liquid-glass px-2.5 py-1 rounded-lg">
          Question {currentIndex + 1} of {activeQuestions.length}
        </span>
        <span className="font-bold">{progressPct}% Completed</span>
      </div>

      <div className="w-full h-2 bg-slate-200/50 dark:bg-zinc-800/60 rounded-full mb-6 overflow-hidden p-[1px] backdrop-blur-xs">
        <div 
          className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(99,102,241,0.6)]"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="p-6 sm:p-8 liquid-glass specular-card rounded-3xl shadow-liquid-card dark:shadow-liquid-card-dark">
        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-snug tracking-tight mb-6">
          {currentQ.question}
        </h3>

        {/* 4 Multiple Choice Options */}
        <div className="space-y-3">
          {currentQ.options.map((option, idx) => {
            let optionStyles = 'liquid-glass hover:border-cyan-400/50 hover:shadow-liquid-glow text-slate-800 dark:text-zinc-200';
            
            if (isAnswerSubmitted) {
              if (idx === currentQ.correctIndex) {
                optionStyles = 'border-2 border-emerald-400 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-950 dark:text-emerald-100 font-bold shadow-[0_0_20px_rgba(16,185,129,0.35)]';
              } else if (idx === selectedOption) {
                optionStyles = 'border-2 border-rose-400 bg-gradient-to-r from-rose-500/20 to-red-500/20 text-rose-950 dark:text-rose-100 font-bold shadow-[0_0_20px_rgba(244,63,94,0.35)]';
              } else {
                optionStyles = 'opacity-30 border-white/10 bg-slate-50/30 dark:bg-zinc-900/30';
              }
            } else if (selectedOption === idx) {
              optionStyles = 'border-2 border-indigo-400 bg-gradient-to-r from-indigo-500/20 via-purple-500/15 to-cyan-500/20 text-indigo-950 dark:text-cyan-200 font-bold shadow-liquid-glow ring-2 ring-indigo-400/25';
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectOption(idx)}
                disabled={isAnswerSubmitted}
                className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all duration-200 active:scale-[0.99] disabled:active:scale-100 shadow-2xs ${optionStyles}`}
              >
                <div className="flex items-center gap-3.5">
                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-mono font-extrabold transition-colors ${
                    selectedOption === idx 
                      ? 'bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-2xs' 
                      : 'liquid-glass text-slate-700 dark:text-zinc-300'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="text-sm sm:text-base leading-snug">{option}</span>
                </div>

                {isAnswerSubmitted && idx === currentQ.correctIndex && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                )}
                {isAnswerSubmitted && idx === selectedOption && idx !== currentQ.correctIndex && (
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation Banner (shown after submission) */}
        {isAnswerSubmitted && (
          <div className="mt-6 p-5 rounded-2xl liquid-glass border border-cyan-400/40 shadow-liquid-glow animate-fade-in">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-cyan-400 mb-1">
                  Concept Rationale
                </p>
                <p className="text-xs sm:text-sm text-slate-800 dark:text-zinc-200 leading-relaxed font-medium">
                  {currentQ.explanation}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Submission / Next Action */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/20 dark:border-white/10">
          <div className="text-xs text-slate-400 dark:text-zinc-400 hidden sm:block font-medium">
            <span>Shortcut: Press </span>
            <kbd className="px-2 py-0.5 liquid-glass rounded font-mono text-[11px] border border-white/20 text-slate-700 dark:text-zinc-300">1-4</kbd>
            <span> then </span>
            <kbd className="px-2 py-0.5 liquid-glass rounded font-mono text-[11px] border border-white/20 text-slate-700 dark:text-zinc-300">Enter</kbd>
          </div>

          {!isAnswerSubmitted ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={selectedOption === null}
              className="ml-auto px-6 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:brightness-110 disabled:opacity-40 text-white font-extrabold text-xs sm:text-sm rounded-2xl transition-all shadow-liquid-glow active:scale-95 disabled:shadow-none"
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="ml-auto inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:brightness-110 text-white font-extrabold text-xs sm:text-sm rounded-2xl transition-all shadow-liquid-glow active:scale-95"
            >
              <span>{currentIndex < activeQuestions.length - 1 ? 'Next Question' : 'View Results'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
