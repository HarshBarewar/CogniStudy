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
    setSelectedOption(index);
  };

  const handleSubmitAnswer = useCallback(() => {
    if (selectedOption === null || isAnswerSubmitted || !currentQ) return;

    const isCorrect = selectedOption === currentQ.correctIndex;
    setIsAnswerSubmitted(true);

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
      <div className="w-full max-w-2xl mx-auto my-6 p-6 sm:p-8 bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-3xl shadow-card-subtle animate-slide-up text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-indigo-50 dark:bg-indigo-950/60 rounded-3xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100/60 dark:border-indigo-900/50 shadow-xs">
          {scorePct >= 80 ? <Trophy className="w-8 h-8 text-amber-500" /> : <Sparkles className="w-8 h-8 text-indigo-500" />}
        </div>

        <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">
          {isRetestingWrong ? 'Re-test Completed!' : 'Quiz Completed!'}
        </h3>
        <p className="text-slate-500 dark:text-zinc-400 text-sm mb-6 max-w-md mx-auto">
          {scorePct === 100 
            ? 'Outstanding! Flawless recall across all curriculum points.' 
            : scorePct >= 70 
            ? 'Great comprehension! Key theories and relationships mastered.' 
            : 'Good effort! Review the explanations below to reinforce knowledge gaps.'}
        </p>

        {/* Score Ring / Pill */}
        <div className="inline-flex items-baseline gap-2.5 px-6 py-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700/80 mb-8 shadow-xs">
          <span className={`text-4xl font-extrabold tracking-tight ${scorePct >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
            {scorePct}%
          </span>
          <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
            ({correctCount} of {totalAnswered} correct)
          </span>
        </div>

        {/* Question Breakdown List */}
        <div className="text-left space-y-3.5 mb-8">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 px-1">
            Question Review & Rationales
          </h4>
          {activeQuestions.map((q, idx) => {
            const isRight = answers[q.id]?.isCorrect;
            return (
              <div 
                key={q.id}
                className={`p-4 sm:p-5 rounded-2xl border text-sm transition-all ${
                  isRight 
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/50' 
                    : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {isRight ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 dark:text-zinc-100 leading-snug">
                      {idx + 1}. {q.question}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-zinc-300 mt-1.5">
                      <span className="font-semibold text-slate-800 dark:text-white">Correct Answer: </span> 
                      {q.options[q.correctIndex]}
                    </p>
                    <div className="text-xs text-slate-600 dark:text-zinc-300 mt-2 p-3 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-slate-200/60 dark:border-zinc-800/80 shadow-2xs">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">💡 Explanation: </span>
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
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-xs sm:text-sm rounded-2xl shadow-sm hover:shadow-xs transition-all active:scale-[0.98]"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Re-test Wrong Answers ({wrongCount})</span>
            </button>
          )}

          <button
            onClick={handleRestartFullQuiz}
            className="flex items-center gap-2 px-5 py-3 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-semibold text-xs sm:text-sm rounded-2xl transition-all active:scale-[0.98] border border-slate-200/50 dark:border-white/[0.04]"
          >
            <RotateCcw className="w-4 h-4" />
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
        <div className="mb-4 p-3 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl flex items-center justify-between text-xs text-amber-800 dark:text-amber-200 animate-slide-up shadow-2xs">
          <span className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            Re-testing Mode: Drilling previously missed questions
          </span>
          <button
            onClick={handleRestartFullQuiz}
            className="underline hover:text-amber-950 dark:hover:text-amber-100 font-semibold"
          >
            Exit to Full Quiz
          </button>
        </div>
      )}

      {/* Progress & Counter */}
      <div className="flex items-center justify-between px-2 mb-2 text-xs font-semibold text-slate-500 dark:text-zinc-400">
        <span className="font-mono text-[11px] bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg">
          Question {currentIndex + 1} of {activeQuestions.length}
        </span>
        <span className="font-medium">{progressPct}% Completed</span>
      </div>

      <div className="w-full h-1.5 bg-slate-200/70 dark:bg-zinc-800 rounded-full mb-6 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="p-6 sm:p-8 bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-3xl shadow-card-subtle">
        <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-zinc-100 leading-snug tracking-tight mb-6">
          {currentQ.question}
        </h3>

        {/* 4 Multiple Choice Options */}
        <div className="space-y-3">
          {currentQ.options.map((option, idx) => {
            let optionStyles = 'border-slate-200/90 dark:border-zinc-800 hover:border-indigo-400 hover:bg-slate-50/50 dark:hover:bg-zinc-800/50 bg-white dark:bg-zinc-900/60 text-slate-800 dark:text-zinc-200';
            
            if (isAnswerSubmitted) {
              if (idx === currentQ.correctIndex) {
                optionStyles = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 font-semibold ring-2 ring-emerald-500/20';
              } else if (idx === selectedOption) {
                optionStyles = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100 font-semibold ring-2 ring-rose-500/20';
              } else {
                optionStyles = 'border-slate-200/50 dark:border-zinc-800 opacity-40 bg-slate-50/50 dark:bg-zinc-900/40';
              }
            } else if (selectedOption === idx) {
              optionStyles = 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-100 font-medium ring-2 ring-indigo-500/25';
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectOption(idx)}
                disabled={isAnswerSubmitted}
                className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all duration-150 active:scale-[0.99] disabled:active:scale-100 shadow-2xs ${optionStyles}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-mono font-bold transition-colors ${
                    selectedOption === idx 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="text-sm sm:text-base leading-snug">{option}</span>
                </div>

                {isAnswerSubmitted && idx === currentQ.correctIndex && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                )}
                {isAnswerSubmitted && idx === selectedOption && idx !== currentQ.correctIndex && (
                  <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation Banner (shown after submission) */}
        {isAnswerSubmitted && (
          <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 animate-fade-in shadow-2xs">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-1">
                  Concept Explanation
                </p>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">
                  {currentQ.explanation}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Submission / Next Action */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-zinc-800/80">
          <div className="text-xs text-slate-400 dark:text-zinc-500 hidden sm:block">
            <span>Shortcut: Press </span>
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded font-mono text-[11px] border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300">1-4</kbd>
            <span> then </span>
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded font-mono text-[11px] border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300">Enter</kbd>
          </div>

          {!isAnswerSubmitted ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={selectedOption === null}
              className="ml-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-zinc-800 text-white disabled:text-slate-400 dark:disabled:text-zinc-600 font-semibold text-xs sm:text-sm rounded-2xl transition-all shadow-sm active:scale-95 disabled:scale-100"
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="ml-auto inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm rounded-2xl transition-all shadow-sm hover:shadow-glow-brand active:scale-95"
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
