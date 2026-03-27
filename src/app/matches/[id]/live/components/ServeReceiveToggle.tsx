'use client';

import { useMatchStore } from '@/stores/matchStore';

export function ServeReceiveToggle() {
  const isServing = useMatchStore((s) => s.isServing);
  const serve = useMatchStore((s) => s.serve);
  const currentRallyNumber = useMatchStore((s) => s.currentRallyNumber);
  const toggleServing = useMatchStore((s) => s.toggleServing);

  // Lock the toggle when:
  // - A serve has been recorded for the current rally
  // - After rally 1, sideout rules determine serve/receive automatically
  const serveRecorded = serve !== null;
  const autoSetFromSideout = currentRallyNumber > 1;
  const locked = serveRecorded || autoSetFromSideout;

  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => { if (!locked) toggleServing(); }}
          disabled={locked}
          className={`flex-1 py-2 rounded-l-xl text-sm font-bold transition-colors ${
            isServing
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          } ${locked ? 'cursor-default' : ''}`}
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
          } ${locked ? 'cursor-default' : ''}`}
        >
          Receiving
        </button>
      </div>
    </div>
  );
}
