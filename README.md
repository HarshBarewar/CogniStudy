# CogniStudy AI — Interactive Study Assistant

> **Frontend Internship Assignment** for **Flam**  
> An AI-powered study assistant built with React, TypeScript, and a Node.js proxy backend that transforms unstructured notes into interactive 3D flashcards and adaptive quizzes, with resilient defensive parsing and failure handling.

---

## 🚀 Quick Start (One-Command Setup)

Everything runs with a single command. The backend proxy and Vite frontend start concurrently.

```bash
# 1. Clone the repository and install dependencies
npm install

# 2. (Optional) Configure an AI Provider API Key in .env
# By default, CogniStudy includes a built-in Mock Fallback Provider,
# meaning it runs out-of-the-box even without an API key!
cp .env.example .env

# 3. Start both the Backend Proxy (Port 3001) and Frontend (Port 5173)
npm start
```

Visit **`http://localhost:5173`** in your browser.

---

## 🎯 Chosen Project Idea & Core Philosophy

**Project: Study Assistant** (Option 1 from the specification)

### The Core Problem with AI in Frontend Engineering
Calling an LLM API is simple (`fetch('https://api...')`). The hard part is turning unpredictable, nondeterministic model output into a rock-solid, stateful user interface. LLMs frequently:
- Wrap JSON in conversational markdown fences (```` ```json ````).
- Truncate strings mid-flight or emit malformed syntax.
- Omit required properties (e.g. returning `question` instead of `front`).
- Produce delayed responses that resolve out-of-order when users submit new requests rapidly.

CogniStudy addresses every one of these failure modes explicitly, preventing UI crashes and stale overwrites.

---

## 🏗️ Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (React UI)                     │
│  - Free-form Prompt Input (Syllabus, Notes, Concepts)       │
│  - 3D Flip Flashcard Deck (Keyboard nav, Audio, Mastery)    │
│  - Adaptive Quiz Engine ("Re-test Wrong Answers" Mode)       │
│  - Chaos Mode Testing Bar (Instant Failure Simulator)       │
└──────────────────────────────▲──────────────────────────────┘
                               │
                [Clean Typed State / AppError]
                               │
┌──────────────────────────────┴──────────────────────────────┐
│       Defensive Validation Layer (lib/validateResult.ts)    │
│  - Strip markdown fences & sanitize JSON                    │
│  - Catch SyntaxError -> classify as MALFORMED_JSON          │
│  - Structural schema checks -> classify as INVALID_SHAPE    │
│  - Backfill missing optional attributes & normalize IDs     │
└──────────────────────────────▲──────────────────────────────┘
                               │
               [Raw API Payload / HTTP Status]
                               │
┌──────────────────────────────┴──────────────────────────────┐
│             Client API Gateway (src/lib/api.ts)             │
│  - 15s AbortController timeout protection                  │
│  - Passes Chaos Mode simulation flags                       │
│  - Translates network failures into friendly AppErrors      │
└──────────────────────────────▲──────────────────────────────┘
                               │ HTTP /api/generate
┌──────────────────────────────┴──────────────────────────────┐
│           Node.js / Express Proxy (server/index.js)         │
│  - Shields API key from browser bundles                     │
│  - Auto-routes to Gemini 1.5 Flash, Groq, or OpenAI         │
│  - Fallback Mock Provider if no API key is provided         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Handling Bad AI Output (20% Evaluation Rubric)

We built a dedicated **Chaos Testing Bar** directly into the top of the UI so interviewers can test failure modes with a single click.

| Failure Mode | How It Is Triggered | How CogniStudy Handles It Gracefully |
| :--- | :--- | :--- |
| **Malformed JSON** | Model truncates syntax or returns broken brackets | Caught by `validateAndParseResult()`. Categorized as `MALFORMED_JSON`. Shows clean `ErrorState` with retry button and technical syntax diagnostics without crashing. |
| **Wrong Shape** | Model returns valid JSON but missing `cards` or `quiz` | Structural type validation checks properties. Flags missing fields as `INVALID_SHAPE`, explaining the exact issue in diagnostics. |
| **Empty Payload** | Model returns 0 cards or empty text | Caught as `EMPTY_DATA`. Prevents blank white screens; prompts the user to add more detail. |
| **Slow Response** | Upstream model takes 8+ seconds | Dynamic loading indicator cycles through informative stages (*"Extracting concepts..."*, *"Validating JSON..."*). Built-in 15s timeout with manual **Cancel Request** button. |
| **Server / 500 Error** | Upstream provider outage or rate limit | Intercepted in `src/lib/api.ts`. Translated to friendly `SERVER_ERROR` with retry capability. |
| **Stale Race Condition** | User triggers a slow request, then rapidly submits a second request | Guarded using `requestId = useRef(0)`. Slower earlier requests are automatically dropped if a newer request was dispatched. |

### The Stale Response Race Condition Guard
```typescript
// App.tsx
const requestId = useRef<number>(0);

const handleGenerate = async (promptText: string) => {
  const currentId = ++requestId.current; // Increment active ID
  
  const response = await generateStudyPackage(promptText);

  // If a newer request was started while this one was in-flight, discard it!
  if (currentId !== requestId.current) {
    console.warn(`[Race Guard] Dropped stale response #${currentId}`);
    return;
  }

  setStudyPackage(response.data);
};
```

---

## ✨ Features Walkthrough

### 1. Interactive 3D Flashcard Deck
- **Perspective Flip**: Real 3D CSS transform (`preserve-3d`, `rotate-y-180`) on click or keyboard press.
- **Keyboard Shortcuts**:
  - `Space` or `Enter`: Flip card front/back
  - `ArrowLeft` / `ArrowRight`: Navigate previous / next card
- **Mastery Tracking**: Mark cards as *"Mastered"* or *"Need Review"*; live progress counter tracks retention.
- **Audio Read-Aloud**: Uses browser `speechSynthesis` API for auditory learners.
- **Hint Reveal**: Optional hint accordion provides a clue without spoiling the answer.
- **Deck Shuffle**: Randomizes card sequence for spaced repetition.

### 2. Interactive Quiz & "Re-test Wrong Answers"
- **Real-time Feedback**: Color-coded option selection (green for correct, red for incorrect).
- **In-depth Explanations**: Teaches *why* an answer is right and why distractors fail.
- **Score Celebration**: Confetti explosion powered by `canvas-confetti` when scoring ≥ 70%.
- **Re-test Wrong Answers**:
  - One of the standout requirements from the specification.
  - After completing a quiz, if any questions were answered incorrectly, a **"Re-test Wrong Answers"** button appears.
  - Clicking it isolates *only* the questions missed, resets their selection state, and allows targeted drilling until mastery is achieved.

### 3. Refinement Loop (Stretch Goal)
- Follow-up input allows users to instruct the AI to adapt the existing study deck (e.g., *"Make questions harder"* or *"Add 3 cards about Calvin Cycle"*).
- The backend incorporates previous context and merges the new items seamlessly into the active session.

### 4. Saved Sessions & History (Stretch Goal)
- Automatically synchronizes generated decks to `localStorage`.
- History drawer lets users browse, reload, or delete previous study sessions.

### 5. UI / UX Polish
- Dark / Light mode toggle with persistent preference.
- 100% mobile-responsive layout tested on 375px viewports.
- Sample prompt pills for one-click testing during demonstrations.

---

## 📁 Project Structure

```
flam-frontend-assignment/
├── src/
│   ├── components/
│   │   ├── PromptInput.tsx       # Free-form input with sample pills & char count
│   │   ├── ResultView.tsx        # Tab router for Cards, Quiz, Summary & Refinement
│   │   ├── FlashcardDeck.tsx     # 3D interactive flip cards, mastery state, audio
│   │   ├── QuizView.tsx          # Adaptive quiz engine with "Re-test wrong answers"
│   │   ├── RefinementInput.tsx   # Follow-up refinement prompt loop
│   │   ├── SessionHistory.tsx    # Saved sessions drawer backed by localStorage
│   │   ├── ChaosTestingBar.tsx   # Interviewer evaluation bar to simulate failures
│   │   ├── ErrorState.tsx        # Shared error component with retry & diagnostics
│   │   └── LoadingState.tsx      # Skeleton & multi-stage status indicator
│   ├── lib/
│   │   ├── api.ts                # Frontend API gateway with timeout & signal handling
│   │   └── validateResult.ts     # Defensive JSON parser and structural validator
│   ├── types/
│   │   └── result.ts             # TypeScript contracts for StudyPackage, Cards, Quiz
│   ├── App.tsx                   # Main state container & stale request guard
│   ├── index.css                 # Tailwind directives & 3D flip card utilities
│   └── main.tsx                  # App entrypoint
├── server/
│   ├── index.js                  # Express backend proxy holding LLM API key
│   └── mockData.js               # High-fidelity mock study decks for zero-config testing
├── .env.example                  # Environment template
├── package.json                  # Concurrently runs server and client via npm start
├── vite.config.ts                # Vite config with /api proxy target
└── README.md                     # Documentation & interview guide
```

---

## 🤖 AI Usage Note (Honest Disclosure)

In accordance with the assignment guidelines:
- **What AI was used for**:
  - Scaffolding TypeScript boilerplate interfaces and mock datasets for offline mode.
  - Crafting the strict system prompt for structured JSON formatting.
  - Tailoring Tailwind CSS classes for the 3D card flip perspective.
- **What was handcrafted & designed deliberately**:
  - The defensive validation pipeline in `src/lib/validateResult.ts` (handling unescaped code fences, index out-of-bounds, and backfilling).
  - The `useRef` stale request race condition guard in `App.tsx`.
  - The "Re-test Wrong Answers" state filtering logic in `QuizView.tsx`.
  - The Chaos Testing Playground specifically designed for the interview evaluation.

---

## ⚠️ Known Limitations & Future Roadmap

1. **Streaming JSON**: Currently, the backend awaits the full structured payload before validating. A future enhancement could use streaming JSON parsers (e.g. `json-stream-parser`) to render cards incrementally as they are synthesized.
2. **Export to Anki / Quizlet**: Add `.apkg` or `.csv` export to import flashcards directly into Anki.
3. **Spaced Repetition Algorithm**: Integrate the SM-2 algorithm to schedule review intervals based on past quiz performance.

---

## ⏱️ Time Spent Breakdown

- **Architecture & Schema Design**: ~45 mins
- **Backend Proxy & Provider Adapters**: ~1 hour
- **Defensive Parsing & Resilience Layer**: ~1.5 hours
- **Flashcard Deck & Quiz Interactive UI**: ~2 hours
- **Re-test Wrong Answers & Chaos Testing Bar**: ~1 hour
- **Styling Polish, Keyboard Shortcuts & Accessibility**: ~45 mins
- **Testing, Build Verification & Documentation**: ~30 mins
- **Total Time**: ~7 hours (within the 8-hour target cap).
