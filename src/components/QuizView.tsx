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
      <div className="w-full max-w-2xl mx-auto my-6 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm animate-slide-up text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-indigo-50 dark:bg-indigo-950/60 rounded-3xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          {scorePct >= 80 ? <Trophy className="w-8 h-8 text-amber-500" /> : <Sparkles className="w-8 h-8" />}
        </div>

        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
          {isRetestingWrong ? 'Re-test Completed!' : 'Quiz Completed!'}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
          {scorePct === 100 
            ? 'Outstanding! You answered every question correctly.' 
            : scorePct >= 70 
            ? 'Great job! Solid comprehension across core objectives.' 
            : 'Good effort! Review the explanations below to reinforce gaps.'}
        </p>

        {/* Score Ring / Pill */}
        <div className="inline-flex items-baseline gap-2 px-6 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 mb-8">
          <span className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">{scorePct}%</span>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            ({correctCount} of {totalAnswered} correct)
          </span>
        </div>

        {/* Question Breakdown List */}
        <div className="text-left space-y-3 mb-8">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
            Question Review
          </h4>
          {activeQuestions.map((q, idx) => {
            const isRight = answers[q.id]?.isCorrect;
            return (
              <div 
                key={q.id}
                className={`p-4 rounded-2xl border text-sm transition-colors ${
                  isRight 
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60' 
                    : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                }`}
              >
                <div className="flex items-start gap-3">
                  {isRight ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {idx + 1}. {q.question}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Correct: </span> 
                      {q.options[q.correctIndex]}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 italic bg-white/70 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200/50 dark:border-slate-800">
                      💡 {q.explanation}
                    </p>
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
              className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm rounded-2xl shadow-sm hover:shadow transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Re-test Wrong Answers ({wrongCount})</span>
            </button>
          )}

          <button
            onClick={handleRestartFullQuiz}
            className="flex items-center gap-2 px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm rounded-2xl transition-all active:scale-95"
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
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl flex items-center justify-between text-xs text-amber-800 dark:text-amber-200 animate-slide-up">
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
      <div className="flex items-center justify-between px-2 mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <span className="font-mono">
          Question {currentIndex + 1} of {activeQuestions.length}
        </span>
        <span>{progressPct}% Completed</span>
      </div>

      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mb-6 overflow-hidden">
        <div 
          className="h-full bg-indigo-600 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 leading-snug mb-6">
          {currentQ.question}
        </h3>

        {/* 4 Multiple Choice Options */}
        <div className="space-y-3">
          {currentQ.options.map((option, idx) => {
            let optionStyles = 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200';
            
            if (isAnswerSubmitted) {
              if (idx === currentQ.correctIndex) {
                optionStyles = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-medium';
              } else if (idx === selectedOption) {
                optionStyles = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100';
              } else {
                optionStyles = 'border-slate-200 dark:border-slate-800 opacity-50 bg-white dark:bg-slate-900';
              }
            } else if (selectedOption === idx) {
              optionStyles = 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-100 ring-2 ring-indigo-500/20';
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectOption(idx)}
                disabled={isAnswerSubmitted}
                className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all duration-150 ${optionStyles}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {idx + 1}
                  </span>
                  <span className="text-sm sm:text-base">{option}</span>
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
          <div className="mt-6 p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 animate-fade-in">
            <div className="flex items-start gap-2.5">
              <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-1">
                  Explanation
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {currentQ.explanation}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Submission / Next Action */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="text-xs text-slate-400 hidden sm:block">
            <span>Shortcut: Press </span>
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono">1-4</kbd>
            <span> then </span>
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono">Enter</kbd>
          </div>

          {!isAnswerSubmitted ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={selectedOption === null}
              className="ml-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 font-semibold text-sm rounded-xl transition-all shadow-sm active:scale-95 disabled:scale-100"
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="ml-auto inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all shadow-sm active:scale-95"
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
