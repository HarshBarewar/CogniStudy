// Vercel Serverless Function: GET /api/health
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const model = process.env.HUGGING_FACE_MODEL || 'Qwen/Qwen2.5-Coder-7B-Instruct';
  return res.status(200).json({
    status: 'online',
    provider: 'huggingface',
    model,
    environment: 'vercel-serverless',
    timestamp: new Date().toISOString(),
  });
}
