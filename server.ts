import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
function readArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx >= 0 && idx + 1 < process.argv.length) return process.argv[idx + 1];
  const prefix = `${flag}=`;
  const match = process.argv.find((a) => a.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

const PORT = Number(readArg('--port') ?? process.env.PORT) || 3000;
const HOST = readArg('--host') ?? process.env.HOST ?? '0.0.0.0';
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

  app.post('/api/ai/personalize-quest', async (req, res) => {
    const ai = getAiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Live AI personalization is offline (no GEMINI_API_KEY configured). Using curated real-world scenario.',
        code: 'MISSING_API_KEY',
      });
      return;
    }

    const { quest, profile } = req.body ?? {};
    if (!quest || !profile) {
      res.status(400).json({ error: 'Missing quest or compass profile.' });
      return;
    }

    const interests = Array.isArray(profile.interests) && profile.interests.length > 0
      ? profile.interests.slice(0, 8).join(', ')
      : 'gaming, music production, sports, creative design';

    const prompt = [
      `Re-skin this Calculus I visual exploration into an authentic, calm, curiosity-driven real-world scenario for a 15–17 year old student.`,
      `Keep the exact mathematical meaning and physical goal intact — NEVER make it feel like a stressful school exam.`,
      ``,
      `Player Compass:`,
      `- Name: ${profile.displayName || 'Voyager'}`,
      `- Motivation Archetype: ${profile.archetype || 'explorer'}`,
      `- Interests: ${interests}`,
      ``,
      `Quest Context:`,
      `- Concept: ${quest.conceptName} (Realm ${quest.realmId})`,
      `- Original Title: ${quest.title}`,
      `- Physical Goal: ${quest.physicalGoal}`,
      `- Symbolic Bridge: ${quest.symbolicEquation}`,
      `- Intuition: ${quest.symbolicBridgeNote}`,
      ``,
      `Rules:`,
      `1. Ground the story in one of the player's actual interests (e.g., audio synth waveforms, esports trajectories, basketball arcs, video editing curves, robotics).`,
      `2. Format math cleanly with single $...$ KaTeX delimiters.`,
      `3. Keep copy concise, warm, respectful, and natural for ages 15–17 (2–3 sentences for story).`,
    ].join('\n');

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'You are a warm, calm Calculus I experience designer crafting stealth real-world transfer scenarios for teens aged 15-17. Never use test jargon or harsh language.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              hookTag: { type: Type.STRING, description: 'Short 2-4 word interest connection label.' },
              title: { type: Type.STRING, description: 'Natural 4-7 word title.' },
              story: { type: Type.STRING, description: '2-3 vivid, calm sentences connecting the visual puzzle to the student interest.' },
              symbolicNote: { type: Type.STRING, description: '1-2 sentences tying the visual motion to the $...$ equation.' },
              realWorldTakeaway: { type: Type.STRING, description: '1 memorable sentence summarizing the real-world intuition.' },
            },
            required: ['hookTag', 'title', 'story', 'symbolicNote', 'realWorldTakeaway'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json({
        skin: {
          questId: quest.id,
          hookTag: parsed.hookTag || quest.conceptName,
          title: parsed.title || quest.title,
          story: parsed.story || quest.invitation,
          symbolicNote: parsed.symbolicNote || quest.symbolicBridgeNote,
          realWorldTakeaway: parsed.realWorldTakeaway || quest.symbolicBridgeNote,
          source: 'gemini',
          generatedAt: Date.now(),
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upstream AI error';
      res.status(502).json({ error: `Could not fetch live AI transfer: ${msg}`, code: 'AI_UPSTREAM_ERROR' });
    }
  });

  app.post('/api/ai/oracle-nudge', async (req, res) => {
    const ai = getAiClient();
    if (!ai) {
      res.status(503).json({ error: 'AI Oracle offline', code: 'MISSING_API_KEY' });
      return;
    }

    const { questTitle, conceptName, hideFormula, physicalGoal, direction, readout, calmChallengeDial } = req.body ?? {};
    const prompt = [
      `Give ONE gentle, calm, curiosity-sparking visual nudge (1-2 short sentences max) for a player experimenting with a Calculus I physics sandbox.`,
      `Quest: ${questTitle} (${conceptName})`,
      `Physical Goal: ${physicalGoal}`,
      `Current State: ${readout} (currently ${direction === 'low' ? 'below target' : direction === 'high' ? 'past target' : 'already aligned'})`,
      `Scaffolding preference: ${Number(calmChallengeDial) <= 45 ? 'Gentle & reassuring' : 'Light, open-ended curiosity cue'}`,
      hideFormula
        ? `CRITICAL: Do NOT mention formulas, equations, or textbook calculus terminology yet — talk purely about the visual motion (waves, ropes, ships, slopes, water).`
        : `You may gently connect the visual motion to the underlying idea without giving away the raw number.`,
    ].join('\n');

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'You are a calm Mediterranean navigator offering gentle visual intuition nudges. Zero stress, zero lecturing, max 2 short sentences.',
        },
      });
      res.json({ nudge: (response.text ?? '').trim() });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upstream error';
      res.status(502).json({ error: msg });
    }
  });

  let viteServer: { middlewares: express.RequestHandler; close: () => Promise<void> } | null = null;

  if (!isProd) {
    const viteReady = import('vite').then(({ createServer }) =>
      createServer({
        server: { middlewareMode: true, hmr: false, ws: false, allowedHosts: true },
        appType: 'spa',
      }),
    );

    viteReady
      .then((vite) => {
        viteServer = vite;
      })
      .catch((err) => {
        console.error('Failed to initialize Vite dev middleware:', err);
      });

    app.use(async (req, res, next) => {
      try {
        const vite = viteServer ?? (await viteReady);
        vite.middlewares(req, res, next);
      } catch (err) {
        next(err);
      }
    });
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.use((_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const server = app.listen(PORT, HOST, () => {
    console.log(`Odyssey server listening on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  });

  const shutdown = () => {
    server.close(() => {
      Promise.resolve(viteServer?.close()).finally(() => process.exit(0));
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
