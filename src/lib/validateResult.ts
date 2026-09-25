import { StudyPackage, Flashcard, QuizQuestion, AppError } from '../types/result';

/**
 * Defensive Parser and Validator for AI Structured Output.
 * 
 * Separated into its own pure utility so shape validation is testable,
 * isolated, and easy to explain in code review.
 * 
 * Guarantees that:
 * 1. Markdown code fences are stripped.
 * 2. Malformed JSON throws a friendly, descriptive AppError instead of crashing the UI.
 * 3. Incomplete, corrupt, or unexpected shapes are caught structurally.
 * 4. Missing secondary attributes (like IDs or hints) are safely backfilled rather than crashing.
 */
export function validateAndParseResult(raw: unknown): { 
  data: StudyPackage | null; 
  error: AppError | null 
} {
  // 1. Guard against null or undefined
  if (raw === null || raw === undefined) {
    return {
      data: null,
      error: {
        type: 'EMPTY_DATA',
        title: 'Empty Response Received',
        message: 'The AI model returned an empty payload.',
        isRetryable: true,
      },
    };
  }

  // 2. Parse JSON if raw is a string
  let parsed: unknown = raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) {
      return {
        data: null,
        error: {
          type: 'EMPTY_DATA',
          title: 'Empty AI Response',
          message: 'The model returned an empty text string.',
          isRetryable: true,
        },
      };
    }

    try {
      // Clean up common LLM artifacts: ```json ... ``` or loose backticks
      const sanitized = trimmed
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();

      parsed = JSON.parse(sanitized);
    } catch (parseErr) {
      return {
        data: null,
        error: {
          type: 'MALFORMED_JSON',
          title: 'Malformed JSON Output',
          message: 'The AI returned unparseable text instead of valid JSON.',
          details: (parseErr as Error).message,
          rawPayload: trimmed.slice(0, 300) + (trimmed.length > 300 ? '...' : ''),
          isRetryable: true,
        },
      };
    }
  }

  // 3. Structural Object Type Check
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return {
      data: null,
      error: {
        type: 'INVALID_SHAPE',
        title: 'Unexpected Output Structure',
        message: 'Expected a root JSON object containing cards and quiz collections.',
        details: `Received type: ${Array.isArray(parsed) ? 'Array' : typeof parsed}`,
        rawPayload: parsed,
        isRetryable: true,
      },
    };
  }

  const candidate = parsed as Record<string, unknown>;

  // 4. Validate 'cards' array
  if (!Array.isArray(candidate.cards)) {
    return {
      data: null,
      error: {
        type: 'INVALID_SHAPE',
        title: 'Missing Flashcards Structure',
        message: 'The response is missing the required "cards" array.',
        rawPayload: candidate,
        isRetryable: true,
      },
    };
  }

  // 5. Check for empty study package
  if (candidate.cards.length === 0 && (!Array.isArray(candidate.quiz) || candidate.quiz.length === 0)) {
    return {
      data: null,
      error: {
        type: 'EMPTY_DATA',
        title: 'Empty Study Set',
        message: 'The model returned 0 flashcards and 0 quiz questions for this prompt.',
        isRetryable: true,
      },
    };
  }

  // 6. Defensively validate and sanitize each Flashcard
  const validatedCards: Flashcard[] = [];
  for (let i = 0; i < candidate.cards.length; i++) {
    const card = candidate.cards[i];
    if (typeof card !== 'object' || card === null) continue;

    const cardObj = card as Record<string, unknown>;
    const front = typeof cardObj.front === 'string' ? cardObj.front.trim() : (cardObj.question as string || '');
    const back = typeof cardObj.back === 'string' ? cardObj.back.trim() : (cardObj.answer as string || '');

    // Skip totally blank cards
    if (!front || !back) continue;

    validatedCards.push({
      id: typeof cardObj.id === 'string' && cardObj.id ? cardObj.id : `card-${i + 1}-${Date.now()}`,
      front,
      back,
      hint: typeof cardObj.hint === 'string' ? cardObj.hint.trim() : undefined,
      category: typeof cardObj.category === 'string' ? cardObj.category.trim() : 'Core Concept',
      mastered: false,
    });
  }

  if (validatedCards.length === 0) {
    return {
      data: null,
      error: {
        type: 'INVALID_SHAPE',
        title: 'Corrupted Flashcard Data',
        message: 'The model provided flashcards, but none contained valid "front" and "back" strings.',
        rawPayload: candidate.cards,
        isRetryable: true,
      },
    };
  }

  // 7. Defensively validate and sanitize Quiz Questions
  const validatedQuiz: QuizQuestion[] = [];
  if (Array.isArray(candidate.quiz)) {
    for (let i = 0; i < candidate.quiz.length; i++) {
      const q = candidate.quiz[i];
      if (typeof q !== 'object' || q === null) continue;

      const qObj = q as Record<string, unknown>;
      const question = typeof qObj.question === 'string' ? qObj.question.trim() : '';
      
      // Ensure options is an array of strings
      let options: string[] = [];
      if (Array.isArray(qObj.options)) {
        options = qObj.options.map(opt => String(opt || '').trim()).filter(Boolean);
      }

      // Quiz requires at least 2 distinct options
      if (!question || options.length < 2) continue;

      // Ensure valid integer correctIndex
      let correctIndex = typeof qObj.correctIndex === 'number' ? Math.floor(qObj.correctIndex) : 0;
      // Handle edge cases where LLMs provide 1-based indexing (1..options.length)
      if (correctIndex === options.length) {
        correctIndex = options.length - 1;
      } else if (correctIndex < 0 || correctIndex >= options.length) {
        correctIndex = 0;
      }

      validatedQuiz.push({
        id: typeof qObj.id === 'string' && qObj.id ? qObj.id : `quiz-${i + 1}-${Date.now()}`,
        question,
        options,
        correctIndex,
        explanation: typeof qObj.explanation === 'string' && qObj.explanation.trim() 
          ? qObj.explanation.trim() 
          : 'Correct answer based on key learning objectives.',
      });
    }
  }

  // 8. Construct clean, dependable StudyPackage
  const sanitizedPackage: StudyPackage = {
    id: typeof candidate.id === 'string' && candidate.id ? candidate.id : `deck-${Date.now()}`,
    title: typeof candidate.title === 'string' && candidate.title.trim() 
      ? candidate.title.trim() 
      : 'Interactive Study Deck',
    summary: typeof candidate.summary === 'string' && candidate.summary.trim()
      ? candidate.summary.trim()
      : 'Custom generated study materials tailored to your provided notes.',
    cards: validatedCards,
    quiz: validatedQuiz,
    generatedAt: typeof candidate.generatedAt === 'string' ? candidate.generatedAt : new Date().toISOString(),
  };

  return {
    data: sanitizedPackage,
    error: null,
  };
}
