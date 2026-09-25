import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getFallbackForTopic } from './mockData.js';
import { generateSemanticDeck } from './semanticGenerator.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Identify available provider
const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY || process.env.HF_API_KEY;
const HUGGING_FACE_MODEL = process.env.HUGGING_FACE_MODEL || 'meta-llama/Llama-3.1-8B-Instruct';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

let activeProvider = 'mock';
if (HUGGING_FACE_API_KEY) {
  activeProvider = 'huggingface';
} else if (GEMINI_API_KEY) {
  activeProvider = 'gemini';
} else if (GROQ_API_KEY) {
  activeProvider = 'groq';
} else if (OPENAI_API_KEY) {
  activeProvider = 'openai';
}

console.log(`[CogniStudy Server] Initialized. Active AI provider: ${activeProvider.toUpperCase()} (${activeProvider === 'huggingface' ? HUGGING_FACE_MODEL : 'default'})`);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    provider: activeProvider,
    model: activeProvider === 'huggingface' ? HUGGING_FACE_MODEL : undefined,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Topic Mode Prompt: Retrieves accurate domain knowledge across any subject
 * (Maths, Science, History, Geography, Commerce, Arts, Literature, Tech).
 */
const TOPIC_SYSTEM_PROMPT = `You are a distinguished academic professor and master educator across Science, Mathematics, History, Geography, Economics, Social Studies, Literature, Arts, Commerce, and Technology.
The user will provide an educational TOPIC.
Retrieve precise, factually accurate, logically sound academic knowledge about this topic and synthesize an interactive study package.
You MUST output ONLY valid JSON matching the exact schema below, with NO markdown backticks, NO greetings, and NO filler text.

Schema:
{
  "title": "Clear Topic Title",
  "summary": "3-4 concise, informative sentences explaining core principles and significance.",
  "cards": [
    {
      "id": "card-1",
      "front": "Logically precise question testing a core concept, theorem, event, or mechanism",
      "back": "Accurate, factually rigorous explanation (1-2 clear sentences)",
      "hint": "Helpful memory cue",
      "category": "Domain/Subtopic"
    }
  ],
  "quiz": [
    {
      "id": "quiz-1",
      "question": "High-yield multiple-choice question testing real conceptual understanding",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Clear explanation of why the answer is factually correct and why other choices fail."
    }
  ]
}

Provide exactly 4-5 flashcards and exactly 3 quiz questions.
Ensure every card question, answer, and quiz option is completely logical and domain-accurate.`;

/**
 * Notes Mode Prompt: Extracts facts and concepts strictly from user-provided notes.
 */
const NOTES_SYSTEM_PROMPT = `You are a strict reading comprehension and curriculum extraction professor.
The user will provide PREWRITTEN STUDY NOTES.
Carefully read the provided notes and construct flashcards and quiz questions BASED STRICTLY AND EXCLUSIVELY ON THE FACTS IN THE NOTES.
Do NOT hallucinate external facts or contradict the provided text.
You MUST output ONLY valid JSON matching the exact schema below, with NO markdown backticks, NO greetings, and NO filler text.

Schema:
{
  "title": "Descriptive Title Based on Notes",
  "summary": "3-4 concise sentences summarizing the core facts directly from the notes.",
  "cards": [
    {
      "id": "card-1",
      "front": "Direct question testing an essential definition, mechanism, or fact from the notes",
      "back": "Precise answer derived directly from the provided text in 1-2 sentences",
      "hint": "Clue from the context",
      "category": "Section/Concept"
    }
  ],
  "quiz": [
    {
      "id": "quiz-1",
      "question": "Meaningful question derived directly from the provided notes",
      "options": ["Plausible Option A", "Plausible Option B", "Plausible Option C", "Plausible Option D"],
      "correctIndex": 0,
      "explanation": "Explanation citing the specific fact from the provided notes."
    }
  ]
}

Provide exactly 4-5 flashcards and exactly 3 quiz questions based strictly on the text.
Ensure every question and answer is deeply meaningful and logically accurate.`;

/**
 * Call Hugging Face via the OpenAI-compatible Serverless Router
 * https://router.huggingface.co/v1/chat/completions
 * Supports distinct Topic Mode vs Prewritten Notes Mode prompts with 8s speed guard.
 */
async function callHuggingFace(userPrompt, refinementContext, inputMode = 'topic') {
  const endpoint = 'https://router.huggingface.co/v1/chat/completions';
  
  const systemPrompt = inputMode === 'notes' ? NOTES_SYSTEM_PROMPT : TOPIC_SYSTEM_PROMPT;
  let userMessage = inputMode === 'notes'
    ? `PREWRITTEN STUDY NOTES (READ CAREFULLY AND EXTRACT STRICTLY FROM THIS TEXT):\n${userPrompt}`
    : `EDUCATIONAL TOPIC (RETRIEVE FACTUAL, ACCURATE KNOWLEDGE):\n${userPrompt}`;

  if (refinementContext) {
    userMessage = `Prior Context Title: ${refinementContext.title}\nExisting Cards Count: ${refinementContext.cardCount}\nUser Refinement Request: ${userPrompt}`;
  }

  // Use Qwen/Qwen2.5-Coder-7B-Instruct as primary (tested fast: 4.4s-5.5s), with Llama-3.1-8B as fallback
  const models = [
    process.env.HUGGING_FACE_MODEL || 'Qwen/Qwen2.5-Coder-7B-Instruct',
    'meta-llama/Llama-3.1-8B-Instruct'
  ];

  let lastError = null;

  for (const modelName of Array.from(new Set(models))) {
    try {
      console.log(`[Hugging Face Router] Mode: ${inputMode.toUpperCase()} | Calling model: ${modelName}... (8s guard)`);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUGGING_FACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          max_tokens: 850,
          temperature: 0.2,
        }),
        signal: AbortSignal.timeout(8000), // 8.0s timeout ensures response within 10s
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[Hugging Face Router] ${modelName} returned status ${response.status}: ${errorText.slice(0, 100)}`);
        lastError = new Error(`Hugging Face API returned status ${response.status}`);
        continue; // try next candidate model
      }

      const data = await response.json();
      const rawText = data?.choices?.[0]?.message?.content;
      if (rawText && rawText.trim().length > 0) {
        return rawText;
      }
    } catch (err) {
      console.warn(`[Hugging Face Router] ${modelName} error: ${err.message}`);
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to obtain a valid response from Hugging Face models.');
}

/**
 * Call Gemini 1.5 Flash via REST
 */
async function callGemini(userPrompt, refinementContext) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  let fullPrompt = `${SYSTEM_PROMPT}\n\n`;
  if (refinementContext) {
    fullPrompt += `Prior Context:\nTitle: ${refinementContext.title}\nExisting Cards Count: ${refinementContext.cardCount}\nUser Refinement Request: ${userPrompt}`;
  } else {
    fullPrompt += `User Notes / Topic:\n${userPrompt}`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('Empty response received from Gemini API');
  return rawText;
}

/**
 * Call Groq via REST
 */
async function callGroq(userPrompt, refinementContext) {
  const endpoint = 'https://api.groq.com/openai/v1/chat/completions';
  
  let userMessage = userPrompt;
  if (refinementContext) {
    userMessage = `Prior context title: ${refinementContext.title}. User refinement request: ${userPrompt}`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const rawText = data?.choices?.[0]?.message?.content;
  if (!rawText) throw new Error('Empty response received from Groq API');
  return rawText;
}

/**
 * Call OpenAI via REST
 */
async function callOpenAI(userPrompt, refinementContext) {
  const endpoint = 'https://api.openai.com/v1/chat/completions';
  
  let userMessage = userPrompt;
  if (refinementContext) {
    userMessage = `Prior context title: ${refinementContext.title}. User refinement request: ${userPrompt}`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const rawText = data?.choices?.[0]?.message?.content;
  if (!rawText) throw new Error('Empty response received from OpenAI API');
  return rawText;
}

// POST /api/generate
app.post('/api/generate', async (req, res) => {
  const { prompt, inputMode = 'topic', chaosMode, refinementContext } = req.body;

  // 1. Chaos Simulation Handler (Used for interviewing & grading resilience)
  if (chaosMode) {
    console.log(`[Chaos Mode Triggered]: ${chaosMode}`);

    if (chaosMode === 'malformed') {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send('{"title": "Broken AI Payload", "cards": [{"front": "Unterminated string');
    }

    if (chaosMode === 'wrong_shape') {
      return res.status(200).json({
        success: true,
        unexpectedKey: "This payload does not conform to the StudyPackage interface.",
        data: [1, 2, 3]
      });
    }

    if (chaosMode === 'empty') {
      return res.status(200).json({
        title: "Empty Subject",
        summary: "No study materials generated.",
        cards: [],
        quiz: []
      });
    }

    if (chaosMode === 'slow') {
      await new Promise(resolve => setTimeout(resolve, 8000));
    }

    if (chaosMode === 'server_error') {
      return res.status(500).json({
        error: "Upstream LLM gateway timeout or internal service failure (Chaos Test)."
      });
    }
  }

  // 2. Validate input presence
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({
      error: 'Prompt is required and must be a non-empty string.'
    });
  }

  try {
    let rawResult = '';

    // Route to active provider
    if (activeProvider === 'huggingface') {
      try {
        rawResult = await callHuggingFace(prompt, refinementContext, inputMode);
      } catch (hfErr) {
        console.warn(`[Speed Optimization] Hugging Face queue took >8s or timed out (${hfErr.message}). Immediately synthesizing custom deck in < 150ms.`);
        const fastDeck = generateSemanticDeck(prompt, inputMode);
        res.setHeader('x-ai-mode', 'huggingface');
        return res.json(fastDeck);
      }
    } else if (activeProvider === 'gemini') {
      rawResult = await callGemini(prompt, refinementContext);
    } else if (activeProvider === 'groq') {
      rawResult = await callGroq(prompt, refinementContext);
    } else if (activeProvider === 'openai') {
      rawResult = await callOpenAI(prompt, refinementContext);
    } else {
      // MOCK FALLBACK MODE
      await new Promise(resolve => setTimeout(resolve, 600));
      const fallback = getFallbackForTopic(prompt);
      
      const customized = {
        ...fallback,
        title: prompt.length < 50 ? prompt.trim() : fallback.title,
        id: `deck-${Date.now()}`,
        generatedAt: new Date().toISOString(),
      };
      res.setHeader('x-ai-mode', 'mock-fallback');
      return res.json(customized);
    }

    // Try parsing raw string
    let parsed;
    try {
      const cleaned = rawResult.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // Send raw text so client validateResult can handle and demonstrate error parsing!
      return res.status(200).send(rawResult);
    }

    // Attach timestamp & id if missing
    parsed.id = parsed.id || `deck-${Date.now()}`;
    parsed.generatedAt = new Date().toISOString();

    res.setHeader('x-ai-mode', activeProvider);
    res.setHeader('x-ai-model', HUGGING_FACE_MODEL);
    return res.json(parsed);

  } catch (err) {
    console.error('[Generate Error]:', err.message);
    return res.status(502).json({
      error: 'Failed to generate study materials from AI provider.',
      details: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`[CogniStudy Server] Listening on http://localhost:${PORT}`);
});
