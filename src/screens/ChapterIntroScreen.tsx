import { motion } from 'motion/react';
import { ArrowLeft, Flame, Swords } from 'lucide-react';
import { Divider, Meander } from '../components/Ornaments';
import { ChapterBackdrop } from '../components/Scenes';
import { useQuietFocus } from '../components/useQuietFocus';
import type { Chapter } from '../game/types';

interface Props {
  chapter: Chapter;
  attempts: number;
  replay: boolean;
  onStart: () => void;
  onBack: () => void;
}

export function ChapterIntroScreen({ chapter, attempts, replay, onStart, onBack }: Props) {
  const startRef = useQuietFocus<HTMLButtonElement>();
  return (
    <main className="relative flex min-h-[calc(100vh-56px)] items-center justify-center px-4 py-8">
      <ChapterBackdrop theme={chapter.theme} dim={0.35} />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="w-full max-w-3xl">
        <div className="text-center">
          <motion.p initial={{ opacity: 0, scale: 1.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }} className="font-display text-7xl font-black text-gold-gradient text-shadow-deep md:text-8xl">
            {chapter.numeral}
          </motion.p>
          <p className="font-display mt-1 text-xs font-bold uppercase tracking-[0.5em] text-aegean-light">
            Chapter {chapter.numeral} · {chapter.difficulty}
          </p>
          <h1 className="font-display mt-2 text-3xl font-black text-parchment text-shadow-deep md:text-5xl">{chapter.title}</h1>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {chapter.focus.map((f) => (
              <span key={f} className="rounded-full border border-gold/30 bg-midnight/60 px-3 py-1 text-xs font-semibold text-gold-light">
                {f}
              </span>
            ))}
          </div>
        </div>

        <article className="parchment mt-6 p-6 md:p-8">
          <Meander ink className="mb-4" />
          <div className="font-serif space-y-2 text-xl leading-snug text-ink md:text-2xl">
            {chapter.intro.map((p, i) => (
              <motion.p key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.35 }}>
                {p}
              </motion.p>
            ))}
          </div>
          <Meander ink className="mt-4" />
        </article>

        <div className="panel mt-5 flex flex-col items-center gap-3 p-5 text-center">
          <p className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.2em] text-danger">
            <Flame className="h-4 w-4" aria-hidden /> The trial of three
          </p>
          <p className="max-w-lg text-sm text-parchment/80">
            Answer <strong className="text-parchment">three challenges in a row</strong> without a single mistake. One wrong decision and this chapter begins anew from the first question.
          </p>
          {replay && <p className="text-xs font-semibold text-gold-light">Practice voyage — this chapter is already complete, so no XP or resources are at stake.</p>}
          {attempts > 0 && !replay && <p className="text-xs text-parchment/50">Previous attempts: {attempts}</p>}
          <Divider className="w-64" />
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" className="btn btn-ghost px-5 py-2.5 text-xs" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" aria-hidden /> Back to map
            </button>
            <button ref={startRef} type="button" className="btn btn-gold px-8 py-3 text-sm" onClick={onStart}>
              <Swords className="h-4 w-4" aria-hidden /> {attempts > 0 ? `Begin attempt ${attempts + 1}` : 'Face the trial'}
            </button>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
