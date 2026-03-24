'use client';

import { useMatchStore, usePhase } from '@/stores/matchStore';

export function ServeReceiveToggle() {
  const isServing = useMatchStore((s) => s.isServing);
  const serve = useMatchStore((s) => s.serve);
  const toggleServing = useMatchStore((s) => s.toggleServing);

  const locked = serve !== null; // Can't toggle after serve is recorded

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => { if (!locked) toggleServing(); }}
        disabled={locked}
        className={`flex-1 py-2 rounded-l-xl text-sm font-bold transition-colors ${
          isServing
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        } ${locked ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        Serving
      </button>
      <button
        onClick={() => { if (!locked) toggleServing(); }}
        disabled={locked}
        className={`flex-1 py-2 rounded-r-xl text-sm font-bold transition-colors ${
          !isServing
            ? 'bg-gray-700 text-white'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        } ${locked ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        Receiving
      </button>
    </div>
  );
}
