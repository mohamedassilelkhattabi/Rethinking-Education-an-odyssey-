import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface PersonalizeRequestBody {
  question: {
    id: number;
    chapterId: number;
    topic: string;
    difficulty: string;
    title: string;
    story: string[];
    teaching: string;
    objectiveText: string;
    options: { id: string; label: string; explanation: string }[];
    correctOptionId: string;
    hints: string[];
    workedSolution: string[];
  };
  profile: {
    displayName: string;
    ageGroup: string;
    hobbies: string[];
    favoriteCreators: string[];
    musicGenres: string[];
    sportsAndGames: string[];
    personalGoals: string[];
    importedTags: string[];
    learningStyle: string;
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, aiConfigured: Boolean(process.env.GEMINI_API_KEY) });
  });

  app.post('/api/ai/personalize-question', async (req, res) => {
    const ai = getAiClient();
    if (!ai) {
      res.status(503).json({
        error: 'AI personalization is currently unavailable because GEMINI_API_KEY is not configured on the server.',
        code: 'MISSING_API_KEY',
      });
      return;
    }

    const body = req.body as PersonalizeRequestBody | undefined;
    if (!body?.question || !body?.profile) {
      res.status(400).json({ error: 'Missing question or user profile in request body.' });
      return;
    }

    const { question, profile } = body;
    const interestList = [
      ...profile.hobbies,
      ...profile.favoriteCreators,
      ...profile.musicGenres,
      ...profile.sportsAndGames,
      ...profile.personalGoals,
      ...profile.importedTags,
    ]
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 14);

    const prompt = [
      `Rewrite the following Calculus I problem into a vivid, realistic, teen-friendly real-world scenario (ages 15-17) tailored to this student's interests while keeping the EXACT same mathematical core, answer correctness, and pedagogical rigor.`,
      ``,
      `Student Profile:`,
      `- Name: ${profile.displayName || 'Traveler'} (age ${profile.ageGroup || '16'})`,
      `- Interests & Vibes: ${interestList.length ? interestList.join(', ') : 'gaming, viral videos, music production, sports'}`,
      `- Learning Style: ${profile.learningStyle || 'real-world-challenges'}`,
      ``,
      `Original Calculus I Problem (Unit ${question.chapterId} · ${question.topic}):`,
      `- Title: ${question.title}`,
      `- Concept / Teaching: ${question.teaching}`,
      `- Objective: ${question.objectiveText}`,
      `- Options: ${JSON.stringify(question.options)}`,
      `- Correct Option ID: ${question.correctOptionId}`,
      `- Hints: ${JSON.stringify(question.hints)}`,
      `- Worked Solution: ${JSON.stringify(question.workedSolution)}`,
      ``,
      `Requirements:`,
      `1. Keep the EXACT same mathematical computation and correctOptionId ("${question.correctOptionId}") and 4 options (A, B, C, D) matching the original number of options (${question.options.length}) so the math is 100% accurate and verified.`,
      `2. Reframe the story, title, and real-world framing around one or two of the student's actual interests (e.g., viral video view velocity, esports projectile arcs, synth waveform frequency, basketball free-throw optimization, battery drain, or photography framing).`,
      `3. Format EVERY mathematical expression with clean LaTeX using $...$ for inline math (never use raw Unicode fractions or broken LaTeX).`,
      `4. Provide 3 progressive step-by-step hints and a clear multi-step worked solution using $...$ LaTeX.`,
      `5. Keep the tone sharp, encouraging, natural for a 15-17 year old — never cringey or patronizing.`,
    ].join('\n');

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'You are an expert AP Calculus AB / Calculus I curriculum designer who translates rigorous calculus problems into authentic real-world scenarios for 15-17 year old students. Always ensure mathematical accuracy and valid KaTeX-compatible LaTeX wrapped in single $...$ delimiters.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'Catchy short scenario title (4-8 words).' },
              hookTag: { type: Type.STRING, description: 'Short 2-4 word interest connection label, e.g. Viral Video Analytics.' },
              story: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '1-2 short paragraphs setting up the teen real-world scenario.',
              },
              teaching: { type: Type.STRING, description: 'Concise concept refresher with $...$ LaTeX.' },
              objectiveText: { type: Type.STRING, description: 'The exact question prompt with $...$ LaTeX.' },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    label: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                  },
                  required: ['id', 'label', 'explanation'],
                },
              },
              correctOptionId: { type: Type.STRING },
              hints: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3 progressive step-by-step hints using $...$ LaTeX.',
              },
              workedSolution: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3-5 clear step-by-step worked solution lines using $...$ LaTeX.',
              },
            },
            required: ['title', 'hookTag', 'story', 'teaching', 'objectiveText', 'options', 'correctOptionId', 'hints', 'workedSolution'],
          },
        },
      });

      const raw = (response.text ?? '').trim();
      const parsed = JSON.parse(raw);

      if (
        !parsed ||
        !Array.isArray(parsed.options) ||
        parsed.options.length < 3 ||
        !parsed.options.some((o: { id?: string }) => o.id === parsed.correctOptionId)
      ) {
        res.status(502).json({ error: 'AI response failed mathematical option validation. Please retry.' });
        return;
      }

      res.json({
        variant: {
          questionId: question.id,
          title: parsed.title,
          hookTag: parsed.hookTag,
          story: parsed.story,
          teaching: parsed.teaching,
          objectiveText: parsed.objectiveText,
          options: parsed.options,
          correctOptionId: parsed.correctOptionId,
          hints: parsed.hints.slice(0, 3),
          workedSolution: parsed.workedSolution,
          generatedAt: Date.now(),
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown Gemini API error';
      res.status(502).json({
        error: `Could not personalize problem via Gemini API: ${msg}`,
        code: 'AI_UPSTREAM_ERROR',
      });
    }
  });

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, hmr: false, allowedHosts: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.use((_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Odyssey server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
