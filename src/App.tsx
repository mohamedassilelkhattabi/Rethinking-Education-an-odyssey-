import { lazy, Suspense, useState } from 'react';
import { SurvivalApp } from './survival/ui/SurvivalApp';

const ClassicApp = lazy(() => import('./ClassicApp'));

const EDITION_KEY = 'odyssey/edition';

function readEdition(): 'survival' | 'classic' {
  try {
    return localStorage.getItem(EDITION_KEY) === 'classic' ? 'classic' : 'survival';
  } catch {
    return 'survival';
  }
}

/** Two editions share the same question and evaluation engine: the pixel-art survival game (default) and the classic map edition. */
export default function App() {
  const [edition, setEdition] = useState(readEdition);
  const choose = (e: 'survival' | 'classic') => {
    try {
      localStorage.setItem(EDITION_KEY, e);
    } catch {
      /* ignore */
    }
    setEdition(e);
  };
  if (edition === 'classic') {
    return (
      <Suspense fallback={<div className="min-h-screen bg-midnight" />}>
        <ClassicApp onSurvival={() => choose('survival')} />
      </Suspense>
    );
  }
  return <SurvivalApp onClassic={() => choose('classic')} />;
}
