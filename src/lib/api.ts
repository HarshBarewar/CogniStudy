import { StudyPackage, AppError, GenerateOptions } from '../types/result';
import { validateAndParseResult } from './validateResult';

const API_TIMEOUT_MS = 15000; // 15 seconds max wait

export interface ApiResponse {
  data: StudyPackage | null;
  error: AppError | null;
  isMock: boolean;
}

/**
 * Communicates with the small backend proxy server.
 * Ensures the browser NEVER communicates directly with third-party LLM providers.
 */
export async function generateStudyPackage(
  prompt: string,
  options: GenerateOptions = {}
): Promise<ApiResponse> {
  const { chaosMode, refinementContext, signal } = options;

  // Setup abort controller for timeout unless external signal supplied
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  // Link external abort signal if provided
  if (signal) {
    signal.addEventListener('abort', () => controller.abort());
  }

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        chaosMode: chaosMode !== 'none' ? chaosMode : undefined,
        refinementContext,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Read header indicating whether backend is operating in mock mode
    const isMock = response.headers.get('x-ai-mode') === 'mock-fallback';

    // Handle HTTP error statuses
    if (!response.ok) {
      let errorMsg = `Server responded with status ${response.status}`;
      let errorDetails: string | undefined;

      try {
        const errorBody = await response.json();
        errorMsg = errorBody.error || errorMsg;
        errorDetails = errorBody.details;
      } catch {
        // Response wasn't JSON
      }

      return {
        data: null,
        error: {
          type: response.status >= 500 ? 'SERVER_ERROR' : 'NETWORK_ERROR',
          title: response.status >= 500 ? 'AI Service Unavailable' : 'Request Failed',
          message: errorMsg,
          details: errorDetails,
          isRetryable: true,
        },
        isMock,
      };
    }

    // Read payload as text first, so validateAndParseResult handles raw JSON or syntax mistakes
    const rawText = await response.text();
    const { data, error } = validateAndParseResult(rawText);

    return {
      data,
      error,
      isMock,
    };

  } catch (err: unknown) {
    clearTimeout(timeoutId);

    if (err instanceof DOMException && err.name === 'AbortError') {
      return {
        data: null,
        error: {
          type: 'TIMEOUT',
          title: 'Request Timed Out',
          message: `The AI model took longer than ${API_TIMEOUT_MS / 1000} seconds to respond.`,
          details: 'You can retry or test with a shorter topic description.',
          isRetryable: true,
        },
        isMock: false,
      };
    }

    return {
      data: null,
      error: {
        type: 'NETWORK_ERROR',
        title: 'Connection Error',
        message: 'Could not connect to the CogniStudy backend proxy.',
        details: (err as Error).message || 'Check if server is running on port 3001.',
        isRetryable: true,
      },
      isMock: false,
    };
  }
}
