import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getFallbackForTopic, mockStudyPackages } from './mockData.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Identify available provider
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const activeProvider = GEMINI_API_KEY ? 'gemini' : (GROQ_API_KEY ? 'groq' : (OPENAI_API_KEY ? 'openai' : 'mock'));

console.log(`[CogniStudy Server] Initialized. Active AI provider: ${activeProvider.toUpperCase()}`);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    provider: activeProvider,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Strict System Prompt ensuring JSON-only output without conversational fluff or markdown fences.
 */
const SYSTEM_PROMPT = `You are a high-level educational curriculum generator.
Your job is to parse the user's notes, concepts, or topic and convert them into a structured Study Package.
You MUST output strictly valid JSON matching the exact schema below.
DO NOT wrap the response in markdown blocks (e.g. no \`\`\`json).
DO NOT include conversational greetings, explanations, or conclusions.

Required JSON Schema:
{
  "title": string (engaging title for the topic),
  "summary": string (concise 2-3 sentence overview of the topic),
  "cards": [
    {
      "id": string (unique identifier like "card-1"),
      "front": string (clear question, term, or prompt),
      "back": string (accurate, comprehensive answer or definition),
      "hint": string (helpful memory cue or association),
      "category": string (subtopic or category)
    }
  ],
  "quiz": [
    {
      "id": string (unique identifier like "quiz-1"),
      "question": string (multiple choice question),
      "options": [string, string, string, string] (exactly 4 distinct plausible options),
      "correctIndex": number (0, 1, 2, or 3 corresponding to the correct option index),
      "explanation": string (why the answer is correct and why common distractors fail)
    }
  ]
}

Provide between 4 to 8 flashcards and between 3 to 6 quiz questions. Ensure quality, accuracy, and pedagogical depth.`;

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
 * Call Groq (llama-3.3-70b-versatile) via REST
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
 * Call OpenAI (gpt-4o-mini) via REST
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
  const { prompt, chaosMode, refinementContext } = req.body;

  // 1. Chaos Simulation Handler (Used for interviewing & grading resilience)
  if (chaosMode) {
    console.log(`[Chaos Mode Triggered]: ${chaosMode}`);

    if (chaosMode === 'malformed') {
      // Intentionally returns invalid JSON syntax
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send('{"title": "Broken AI Payload", "cards": [{"front": "Unterminated string');
    }

    if (chaosMode === 'wrong_shape') {
      // Valid JSON but completely missing required 'cards' and 'quiz' shape
      return res.status(200).json({
        success: true,
        unexpectedKey: "This payload does not conform to the StudyPackage interface.",
        data: [1, 2, 3]
      });
    }

    if (chaosMode === 'empty') {
      // Empty collections
      return res.status(200).json({
        title: "Empty Subject",
        summary: "No study materials generated.",
        cards: [],
        quiz: []
      });
    }

    if (chaosMode === 'slow') {
      // Simulates an 8-second slow upstream response
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
    if (activeProvider === 'gemini') {
      rawResult = await callGemini(prompt, refinementContext);
    } else if (activeProvider === 'groq') {
      rawResult = await callGroq(prompt, refinementContext);
    } else if (activeProvider === 'openai') {
      rawResult = await callOpenAI(prompt, refinementContext);
    } else {
      // MOCK FALLBACK MODE:
      // Provide realistic simulated latency (600ms) and return high-fidelity mock data
      await new Promise(resolve => setTimeout(resolve, 600));
      const fallback = getFallbackForTopic(prompt);
      
      // If user typed something custom, tailor title dynamically
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
      // Remove any accidental markdown backticks if provider slipped them in
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
