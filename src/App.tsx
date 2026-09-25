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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Top Chaos Testing Bar for Interviewers */}
      <ChaosTestingBar
        onTriggerChaos={(mode) => handleGenerate(currentPrompt || 'Sample topic for failure testing', currentMode, mode)}
        onTriggerRaceCondition={handleSimulateRaceCondition}
        isLoading={isLoading}
      />

      {/* Main Navbar */}
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setStudyPackage(null)}>
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  CogniStudy <span className="text-indigo-600 dark:text-indigo-400">AI</span>
                </h1>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:block">
                Structured Study Assistant & Quiz Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Saved Sessions Button */}
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Sessions</span>
              {savedSessions.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[10px] font-mono flex items-center justify-center">
                  {savedSessions.length}
                </span>
              )}
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        {/* HERO / INPUT SECTION */}
        <section className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-3 border border-indigo-100 dark:border-indigo-900/50">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Structured Data · 3D Flashcards · Adaptive Quiz</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
            Turn Raw Notes into Interactive Mastery
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xl mx-auto mb-6">
            Paste syllabus topics, lecture notes, or technical concepts. CogniStudy parses unpredictable AI responses into dependable, resilient study tools.
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

        {/* EMPTY STATE (Before first submission) */}
        {!studyPackage && !isLoading && !error && (
          <div className="max-w-2xl mx-auto my-12 p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-indigo-50 dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base mb-1">
              Ready to Study
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Type or paste notes above, or click one of the quick samples to experience real-time structured data generation.
            </p>
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

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Flam Frontend Internship Assignment · Built with React & Node Proxy</span>
          <span className="font-mono text-[11px]">Strict JSON Schema · Race Condition Guarded</span>
        </div>
      </footer>
    </div>
  );
};
