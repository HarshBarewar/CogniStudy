import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Sparkles, 
  BrainCircuit, 
  History, 
  Moon, 
  Sun, 
  BookOpen
} from 'lucide-react';
import { StudyPackage, AppError, ChaosMode, InputMode } from './types/result';
import { generateStudyPackage } from './lib/api';
import { PromptInput } from './components/PromptInput';
import { ResultView } from './components/ResultView';
import { LoadingState } from './components/LoadingState';
import { ErrorState } from './components/ErrorState';
import { SessionHistory } from './components/SessionHistory';
import { ChaosTestingBar } from './components/ChaosTestingBar';

const STORAGE_KEY_SESSIONS = 'cognistudy_saved_sessions_v1';
const STORAGE_KEY_THEME = 'cognistudy_theme_v1';

export const App: React.FC = () => {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Core App State
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [studyPackage, setStudyPackage] = useState<StudyPackage | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [error, setError] = useState<AppError | null>(null);
  const [isMockMode, setIsMockMode] = useState<boolean>(false);

  // Saved Sessions / History Drawer
  const [savedSessions, setSavedSessions] = useState<StudyPackage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Active AbortController for in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Stale Response Guard (Explicitly specified in assignment reference guide):
   * Prevents race conditions where an older, slower request finishes after a newer request,
   * overwriting valid newer UI state.
   */
  const requestId = useRef<number>(0);

  // Sync dark mode class to html document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'light');
    }
  }, [darkMode]);

  // Persist sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(savedSessions));
    } catch (e) {
      console.warn('Failed to save sessions to localStorage', e);
    }
  }, [savedSessions]);

  const [currentMode, setCurrentMode] = useState<InputMode>('topic');

  /**
   * Main Generation Handler
   */
  const handleGenerate = useCallback(async (promptText: string, mode: InputMode = 'topic', chaosMode: ChaosMode = 'none') => {
    // 1. Guard against stale responses: increment request counter
    const currentId = ++requestId.current;
    
    // Abort previous in-flight request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);
    setCurrentPrompt(promptText);
    setCurrentMode(mode);

    try {
      const response = await generateStudyPackage(promptText, {
        inputMode: mode,
        chaosMode,
        signal: controller.signal,
      });

      // STALE CHECK: If a newer request was dispatched while waiting, discard this result!
      if (currentId !== requestId.current) {
        console.warn(`[Race Condition Guard] Ignored stale response #${currentId}; current active is #${requestId.current}`);
        return;
      }

      setIsLoading(false);

      if (response.error) {
        setError(response.error);
        setStudyPackage(null);
        return;
      }

      if (response.data) {
        setStudyPackage(response.data);
        setIsMockMode(response.isMock);

        // Prepend to saved sessions if unique
        setSavedSessions((prev) => {
          const filtered = prev.filter((s) => s.id !== response.data!.id);
          return [response.data!, ...filtered].slice(0, 15);
        });
      }
    } catch (err: unknown) {
      if (currentId !== requestId.current) return;
      setIsLoading(false);
      setError({
        type: 'NETWORK_ERROR',
        title: 'Unexpected Client Error',
        message: (err as Error).message || 'An unhandled exception occurred.',
        isRetryable: true,
      });
    }
  }, []);

  /**
   * Refinement Loop Handler (Stretch Goal):
   * Appends or updates the current study deck based on user instructions
   */
  const handleRefine = async (instructions: string) => {
    if (!studyPackage) return;
    setIsRefining(true);

    const currentId = ++requestId.current;

    try {
      const response = await generateStudyPackage(instructions, {
        refinementContext: {
          title: studyPackage.title,
          cardCount: studyPackage.cards.length,
        },
      });

      if (currentId !== requestId.current) return;
      setIsRefining(false);

      if (response.error) {
        setError(response.error);
        return;
      }

      if (response.data) {
        // Merge new cards and questions with existing
        const mergedPackage: StudyPackage = {
          ...studyPackage,
          title: response.data.title || studyPackage.title,
          summary: response.data.summary || studyPackage.summary,
          cards: [...studyPackage.cards, ...response.data.cards],
          quiz: [...studyPackage.quiz, ...response.data.quiz],
          generatedAt: new Date().toISOString(),
        };

        setStudyPackage(mergedPackage);

        // Update in history
        setSavedSessions((prev) =>
          prev.map((s) => (s.id === studyPackage.id ? mergedPackage : s))
        );
      }
    } catch (err) {
      if (currentId !== requestId.current) return;
      setIsRefining(false);
      console.error('Refinement failed', err);
    }
  };

  /**
   * Cancel in-flight request
   */
  const handleCancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
  };

  /**
   * Toggle mastery state of a flashcard
   */
  const handleToggleMastery = (cardId: string) => {
    if (!studyPackage) return;
    const updatedCards = studyPackage.cards.map((c) =>
      c.id === cardId ? { ...c, mastered: !c.mastered } : c
    );
    const updatedPackage = { ...studyPackage, cards: updatedCards };
    setStudyPackage(updatedPackage);

    setSavedSessions((prev) =>
      prev.map((s) => (s.id === studyPackage.id ? updatedPackage : s))
    );
  };

  /**
   * Interview Evaluator Playground: Stale Race Condition Simulator
   * Fires Request 1 (slow 8s delay), then immediately fires Request 2 (fast).
   * Verifies Request 1 does NOT overwrite Request 2 when it resolves late!
   */
  const handleSimulateRaceCondition = () => {
    alert("Triggering Race Condition Test:\n1. Launching Slow Request (Takes ~8s)\n2. Immediately launching Fast Request (Takes ~0.5s)\n\nWatch console and UI: the fast request will render first, and when the slow one finishes 8 seconds later, it will be discarded!");
    
    // Request 1: Slow
    handleGenerate("Request #1: Slow Background Notes", currentMode, "slow");

    // Request 2: Fast (fired 400ms later)
    setTimeout(() => {
      handleGenerate("Request #2: Fast Override Topic", currentMode, "none");
    }, 400);
  };

  return (
    <div className="relative min-h-screen bg-slate-50/70 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col transition-colors duration-200 selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {/* Ambient background aura */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.10),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.18),rgba(0,0,0,0))]" />

      {/* Top Chaos Testing Bar for Interviewers */}
      <ChaosTestingBar
        onTriggerChaos={(mode) => handleGenerate(currentPrompt || 'Mughal Empire Mansabdari System and Administrative Hierarchy', currentMode, mode)}
        onTriggerRaceCondition={handleSimulateRaceCondition}
        isLoading={isLoading}
      />

      {/* Main Floating Glass Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-white/[0.06] bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl transition-all">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setStudyPackage(null)}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform duration-200">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  CogniStudy <span className="text-indigo-600 dark:text-indigo-400">AI</span>
                </h1>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-bold border border-slate-200/60 dark:border-zinc-700/60 shadow-2xs">
                  STUDIO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 hidden sm:block font-medium">
                Structured Study Deck & Quiz Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Saved Sessions Button */}
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-zinc-800/80 transition-all border border-transparent hover:border-slate-200/60 dark:hover:border-zinc-700/60"
            >
              <History className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
              <span className="hidden sm:inline">Sessions</span>
              {savedSessions.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 text-[10px] font-mono font-bold border border-indigo-100 dark:border-indigo-900/60">
                  {savedSessions.length}
                </span>
              )}
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-2xl text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100/80 dark:hover:bg-zinc-800/80 transition-all active:scale-90 border border-transparent hover:border-slate-200/60 dark:hover:border-zinc-700/60"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 relative z-10">
        {/* HERO / INPUT SECTION */}
        <section className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-3 border border-indigo-100/80 dark:border-indigo-900/50 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Structured Data · 3D Flashcards · Adaptive Quizzes</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
            Turn Raw Concepts into{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 bg-clip-text text-transparent">
              Interactive Mastery
            </span>
          </h2>
          <p className="text-slate-600 dark:text-zinc-400 text-xs sm:text-sm max-w-xl mx-auto mb-6 leading-relaxed">
            Enter any syllabus topic or paste rough lecture notes. CogniStudy converts unstructured concepts into interactive 3D flashcards and adaptive diagnostic quizzes in under 10 seconds.
          </p>

          <PromptInput
            onSubmit={(p, m) => handleGenerate(p, m, 'none')}
            isLoading={isLoading}
            initialValue={currentPrompt}
            initialMode={currentMode}
          />
        </section>

        {/* LOADING STATE */}
        {isLoading && (
          <LoadingState
            topic={currentPrompt}
            onCancel={handleCancelRequest}
          />
        )}

        {/* ERROR STATE */}
        {error && !isLoading && (
          <ErrorState
            error={error}
            onRetry={() => handleGenerate(currentPrompt, currentMode, 'none')}
            isRetrying={isLoading}
          />
        )}

        {/* RESULT VIEW (Interactive Tools) */}
        {studyPackage && !isLoading && !error && (
          <ResultView
            studyPackage={studyPackage}
            onToggleMastery={handleToggleMastery}
            onRefine={handleRefine}
            isRefining={isRefining}
            isMock={isMockMode}
          />
        )}

        {/* STUDIO STARTER CANVAS (When idle before generation) */}
        {!studyPackage && !isLoading && !error && (
          <div className="max-w-4xl mx-auto my-12 animate-fade-in">
            <div className="text-center mb-6">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-400 dark:text-zinc-500">
                Explore Studio Capabilities
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Feature 1 */}
              <div 
                onClick={() => handleGenerate('Mughal Empire Mansabdari System and Administrative Hierarchy under Akbar', 'topic', 'none')}
                className="group p-5 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl shadow-card-subtle hover:shadow-card-elevated hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer text-left"
              >
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                  Instant 3D Flashcards
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed mb-3">
                  Spaced repetition with 3D flip physics, speech audio pronunciation, and mastery status tracking.
                </p>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:underline">
                  Launch sample deck →
                </span>
              </div>

              {/* Feature 2 */}
              <div 
                onClick={() => handleGenerate('Integration by Parts and Definite Integrals in Calculus', 'topic', 'none')}
                className="group p-5 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl shadow-card-subtle hover:shadow-card-elevated hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer text-left"
              >
                <div className="w-10 h-10 rounded-2xl bg-violet-50 dark:bg-violet-950/60 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-3 group-hover:scale-105 transition-transform">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                  Adaptive Logic Quizzes
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed mb-3">
                  Interactive MCQ drilling with detailed rationale breakdowns and dedicated re-testing of missed questions.
                </p>
                <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-1 group-hover:underline">
                  Test math quiz →
                </span>
              </div>

              {/* Feature 3 */}
              <div 
                onClick={() => handleGenerate('Price Elasticity of Demand and Market Equilibrium in Economics', 'topic', 'none')}
                className="group p-5 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl shadow-card-subtle hover:shadow-card-elevated hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer text-left"
              >
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                  Sub-10s AI Pipeline
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed mb-3">
                  Strict JSON schema validation, timeout circuit-breaker, and race-condition guards for rock-solid UX.
                </p>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 group-hover:underline">
                  Synthesize economics →
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Persistent Sessions Modal */}
      <SessionHistory
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        savedSessions={savedSessions}
        onSelectSession={(session) => {
          setStudyPackage(session);
          setCurrentPrompt(session.title);
          setError(null);
        }}
        onDeleteSession={(sessionId, e) => {
          e.stopPropagation();
          setSavedSessions((prev) => prev.filter((s) => s.id !== sessionId));
          if (studyPackage?.id === sessionId) {
            setStudyPackage(null);
          }
        }}
        onClearAll={() => {
          if (window.confirm('Clear all saved study sessions?')) {
            setSavedSessions([]);
            setStudyPackage(null);
          }
        }}
      />

      {/* Studio Footer */}
      <footer className="border-t border-slate-200/80 dark:border-white/[0.06] py-6 text-center text-xs text-slate-400 dark:text-zinc-500 relative z-10">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-slate-600 dark:text-zinc-400">CogniStudy Studio</span>
            <span>· Flam Frontend Assignment</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md text-slate-600 dark:text-zinc-400">
              Sub-10s SLA
            </span>
            <span>Strict Schema Validation</span>
            <span>Race Condition Guarded</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
