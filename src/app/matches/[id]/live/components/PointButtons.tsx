'use client';

import { useMatchStore } from '@/stores/matchStore';

export function PointButtons() {
  const logPoint = useMatchStore((s) => s.logPoint);
  const ballOver = useMatchStore((s) => s.ballOver);
  const flipRallyPoint = useMatchStore((s) => s.flipRallyPoint);
  const isSaving = useMatchStore((s) => s.isSaving);
  const completedTouches = useMatchStore((s) => s.completedTouches);
  const editingRallyIndex = useMatchStore((s) => s.editingRallyIndex);
  const rallyLog = useMatchStore((s) => s.rallyLog);

  const hasTouches = completedTouches.length > 0;

  // Editing mode — show flip point buttons
  if (editingRallyIndex !== null) {
    const rally = rallyLog[editingRallyIndex];
    if (!rally) return null;

    return (
      <div>
        <p className="text-xs text-gray-500 mb-2 font-medium">
          Currently: <span className={rally.pointWon ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
            {rally.pointWon ? 'Won Point' : 'Lost Point'}
          </span> — tap to change:
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => flipRallyPoint(editingRallyIndex, false)}
            disabled={isSaving || !rally.pointWon}
            className={`py-3 rounded-xl font-bold text-base transition-colors min-h-[52px] ${
              !rally.pointWon
                ? 'bg-red-600 border-2 border-red-700 text-white'
                : 'bg-red-50 border-2 border-red-300 text-red-700 hover:bg-red-100'
            } disabled:opacity-50`}
          >
            Lost Point
          </button>
          <button
            onClick={() => flipRallyPoint(editingRallyIndex, true)}
            disabled={isSaving || rally.pointWon}
            className={`py-3 rounded-xl font-bold text-base transition-colors min-h-[52px] ${
              rally.pointWon
                ? 'bg-green-600 border-2 border-green-700 text-white'
                : 'bg-green-50 border-2 border-green-300 text-green-700 hover:bg-green-100'
            } disabled:opacity-50`}
          >
            Won Point
          </button>
        </div>
      </div>
    );
  }

  // Normal mode
  return (
    <div className="grid grid-cols-3 gap-2">
      <button
        onClick={() => logPoint(false)}
        disabled={isSaving}
        className="py-4 rounded-xl bg-red-50 border-2 border-red-300 text-red-700 font-bold text-base hover:bg-red-100 active:bg-red-200 transition-colors min-h-[56px] disabled:opacity-50"
      >
        Lost Point
      </button>
      <button
        onClick={() => ballOver()}
        disabled={isSaving || !hasTouches}
        className="py-4 rounded-xl bg-gray-50 border-2 border-gray-300 text-gray-700 font-bold text-base hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-[56px] disabled:opacity-30"
      >
        Ball Over
      </button>
      <button
        onClick={() => logPoint(true)}
        disabled={isSaving}
        className="py-4 rounded-xl bg-green-50 border-2 border-green-300 text-green-700 font-bold text-base hover:bg-green-100 active:bg-green-200 transition-colors min-h-[56px] disabled:opacity-50"
      >
        Won Point
      </button>
    </div>
  );
}
