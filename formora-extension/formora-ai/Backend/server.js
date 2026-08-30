/**
 * Formora AI Backend Server — 100% Consistent 5-Feature Recommendation Pipeline
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const val = valueParts.join('=').trim();
      if (key && !process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  });
}

const port = Number(process.env.PORT) || 8787;
const MAX_TEXT_LENGTH = 1200;

function json(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Connection': 'keep-alive'
  });
  response.end(JSON.stringify(payload));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => (body += chunk));
    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    request.on('error', reject);
  });
}

const SYSTEM_INSTRUCTION = `You are Formora AI reading assistant. Analyze page text and output valid JSON matching this exact schema:
{
  "summary": "2 concise sentences summarizing key content",
  "suggestions": [
    {
      "title": "Text Font & Size",
      "detail": "Optimal typography recommendation for this page context",
      "patch": {
        "fontSize": "small|medium|large|x-large",
        "fontFamily": "system|sans|serif|dyslexia|mono"
      }
    },
    {
      "title": "Auto-Bold Key Terms",
      "detail": "Auto-bold names, dates, numbers, and important keywords for faster scanning",
      "patch": {
        "autoBoldImportant": true
      }
    },
    {
      "title": "Summarize Paragraphs",
      "detail": "Add collapsible preview blocks under long paragraphs",
      "patch": {
        "summarizeLongParagraphs": true
      }
    },
    {
      "title": "Visual Theme",
      "detail": "Optimal color theme (warm paper, sepia, dark mode, OLED black) for visual comfort",
      "patch": {
        "visualComfort": {
          "background": "default|warm|sepia|soft-gray|dark|black"
        }
      }
    },
    {
      "title": "Focus Mode",
      "detail": "Highlight hovered paragraph reading blocks for distraction-free reading",
      "patch": {
        "focusMode": true
      }
    }
  ]
}
Return exactly 5 suggestions covering all 5 controlled reading tools. Tailor the specific patch values (fontFamily, fontSize, background) to the specific article content provided.`;

async function analyzeWithGroq(prompt) {
  const apiKey = process.env.GROQ_API_KEY;
  const apiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'groq/compound-mini',
      messages: [
        { role: 'system', content: SYSTEM_INSTRUCTION },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 280
    })
  });

  const payload = await apiResponse.json();
  if (!apiResponse.ok) throw new Error(payload?.error?.message || 'Groq API request failed');
  const textOutput = payload.choices?.[0]?.message?.content;
  if (!textOutput) throw new Error('Groq returned no text output');
  const cleanJson = textOutput.replace(/^```json\s*|\s*```$/g, '').trim();
  return JSON.parse(cleanJson);
}

async function analyzeWithGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
  const apiResponse = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${SYSTEM_INSTRUCTION}\n\n${prompt}` }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.1, maxOutputTokens: 280 }
    })
  });
  const payload = await apiResponse.json();
  if (!apiResponse.ok) throw new Error(payload?.error?.message || 'Gemini API request failed');
  const textOutput = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textOutput) throw new Error('Gemini returned no text response');
  return JSON.parse(textOutput.replace(/^```json\s*|\s*```$/g, '').trim());
}

async function analyzeWithOpenAI(prompt) {
  const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_INSTRUCTION },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 280,
      response_format: { type: 'json_object' }
    })
  });
  const payload = await apiResponse.json();
  if (!apiResponse.ok) throw new Error(payload?.error?.message || 'OpenAI request failed');
  const output = payload.choices?.[0]?.message?.content;
  if (!output) throw new Error('The AI returned no text');
  return JSON.parse(output.replace(/^```json\s*|\s*```$/g, '').trim());
}

async function analyze(text, title) {
  const cleanText = (text || '').replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT_LENGTH);
  const prompt = `Page Title: ${title || 'Untitled'}\nPage Text:\n${cleanText}`;

  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey && groqKey !== 'replace_with_your_key') {
    try {
      return await analyzeWithGroq(prompt);
    } catch (err) {
      console.warn('[Groq API Warning]', err.message);
    }
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey !== 'replace_with_your_key') {
    try {
      return await analyzeWithGemini(prompt);
    } catch (err) {
      console.warn('[Gemini API Warning]', err.message);
    }
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey && openaiKey !== 'replace_with_your_key') {
    return await analyzeWithOpenAI(prompt);
  }

  throw new Error('Configure GROQ_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY in Backend/.env');
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'OPTIONS') return json(response, 204, {});
  if (request.method !== 'POST' || request.url !== '/api/analyze') return json(response, 404, { error: 'Not found' });
  try {
    const { text, title } = await readBody(request);
    if (typeof text !== 'string' || text.trim().length < 40) return json(response, 400, { error: 'Provide at least 40 characters of page text' });
    return json(response, 200, await analyze(text, title));
  } catch (error) {
    return json(response, 500, { error: error.message || 'Unexpected server error' });
  }
});

server.keepAliveTimeout = 60000;
server.listen(port, () => console.log(`Formora AI backend listening on http://localhost:${port}`));
