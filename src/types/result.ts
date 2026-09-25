/**
 * Structured Data Schemas for CogniStudy AI
 * 
 * Turning unpredictable AI output into reliable, strongly-typed UI requires
 * clear structural contracts.
 */

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint?: string;
  category?: string;
  mastered?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface StudyPackage {
  id: string;
  title: string;
  summary: string;
  cards: Flashcard[];
  quiz: QuizQuestion[];
  generatedAt: string;
  isMock?: boolean;
  topic?: string;
}

export type ErrorType = 
  | 'MALFORMED_JSON'
  | 'INVALID_SHAPE'
  | 'EMPTY_DATA'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'STALE_REQUEST'
  | 'SERVER_ERROR';

export interface AppError {
  type: ErrorType;
  title: string;
  message: string;
  details?: string;
  isRetryable: boolean;
  rawPayload?: unknown;
}

export type ChaosMode = 
  | 'none'
  | 'malformed'
  | 'wrong_shape'
  | 'empty'
  | 'slow'
  | 'server_error';

export interface GenerateOptions {
  chaosMode?: ChaosMode;
  refinementContext?: {
    title: string;
    cardCount: number;
  };
  signal?: AbortSignal;
}
