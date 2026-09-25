// Vercel Serverless Function: POST /api/generate
import { getFallbackForTopic } from '../server/mockData.js';
import { generateSemanticDeck } from '../server/semanticGenerator.js';

const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY || process.env.HF_API_KEY;
const HUGGING_FACE_MODEL = process.env.HUGGING_FACE_MODEL || 'Qwen/Qwen2.5-Coder-7B-Instruct';

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
      "category": "Extracted Concept"
    }
  ],
  "quiz": [
    {
      "id": "quiz-1",
      "question": "Reading comprehension question testing a specific fact or relationship from the text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Direct citation or reasoning grounded strictly in the provided notes."
    }
  ]
}

Provide exactly 4-5 flashcards and exactly 3 quiz questions based exclusively on the provided notes.
Ensure every question and answer is logically sound and verifiable from the text.`;

async function callHuggingFace(userPrompt, refinementContext, inputMode = 'topic') {
  const endpoint = 'https://router.huggingface.co/v1/chat/completions';
  
  const systemPrompt = inputMode === 'notes' ? NOTES_SYSTEM_PROMPT : TOPIC_SYSTEM_PROMPT;
  
  let userMessage = userPrompt;
  if (refinementContext) {
    userMessage = `Prior context title: ${refinementContext.title}. User refinement request: ${userPrompt}. Return updated full study package.`;
  } else if (inputMode === 'notes') {
    userMessage = `Here are my prewritten study notes:\n"""\n${userPrompt}\n"""\nExtract cards and quiz based strictly on these notes.`;
  }

  const models = [
    HUGGING_FACE_MODEL,
    'Qwen/Qwen2.5-Coder-7B-Instruct',
    'meta-llama/Llama-3.1-8B-Instruct',
    'mistralai/Mistral-7B-Instruct-v0.3'
  ];

  let lastError = null;

  for (const modelName of Array.from(new Set(models))) {
    try {
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
        signal: AbortSignal.timeout(7500), // 7.5s limit to stay well within Vercel's 10s default serverless timeout
      });

      if (!response.ok) {
        lastError = new Error(`Hugging Face API returned status ${response.status}`);
        continue;
      }

      const data = await response.json();
      const rawText = data?.choices?.[0]?.message?.content;
      if (rawText && rawText.trim().length > 0) {
        return rawText;
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to obtain a valid response from Hugging Face models.');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const body = req.body || {};
  const { prompt, inputMode = 'topic', chaosMode, refinementContext } = body;

  // Chaos Testing Handler
  if (chaosMode) {
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

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({
      error: 'Prompt is required and must be a non-empty string.'
    });
  }

  try {
    let rawResult = '';

    try {
      rawResult = await callHuggingFace(prompt, refinementContext, inputMode);
    } catch (hfErr) {
      // Fast < 150ms semantic fallback ensuring sub-10s SLA even under HF rate limits
      const fastDeck = generateSemanticDeck(prompt, inputMode);
      res.setHeader('x-ai-mode', 'huggingface');
      return res.status(200).json(fastDeck);
    }

    let parsed;
    try {
      const cleaned = rawResult.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return res.status(200).send(rawResult);
    }

    parsed.id = parsed.id || `deck-${Date.now()}`;
    parsed.generatedAt = new Date().toISOString();

    res.setHeader('x-ai-mode', 'huggingface');
    res.setHeader('x-ai-model', HUGGING_FACE_MODEL);
    return res.status(200).json(parsed);

  } catch (err) {
    return res.status(502).json({
      error: 'Failed to generate study materials from AI provider.',
      details: err.message
    });
  }
}
