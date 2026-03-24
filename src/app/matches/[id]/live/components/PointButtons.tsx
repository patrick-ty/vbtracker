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
            {rally.pointWon ? 'Point Won' : 'Point Lost'}
          </span> — tap to change:
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => flipRallyPoint(editingRallyIndex, false)}
            disabled={isSaving || !rally.pointWon}
            className={`py-3 rounded-xl transition-colors min-h-[52px] border-2 ${
              !rally.pointWon
                ? 'bg-red-600 border-red-600 text-white font-bold text-lg shadow-md'
                : 'bg-red-50 border-red-200 text-red-400 font-medium text-sm border-dashed hover:bg-red-100 hover:text-red-500'
            }`}
          >
            {!rally.pointWon ? <>Point<br />Lost</> : 'Switch to Lost'}
          </button>
          <button
            onClick={() => flipRallyPoint(editingRallyIndex, true)}
            disabled={isSaving || rally.pointWon}
            className={`py-3 rounded-xl transition-colors min-h-[52px] border-2 ${
              rally.pointWon
                ? 'bg-green-600 border-green-600 text-white font-bold text-lg shadow-md'
                : 'bg-green-50 border-green-200 text-green-400 font-medium text-sm border-dashed hover:bg-green-100 hover:text-green-500'
            }`}
          >
            {rally.pointWon ? <>Point<br />Won</> : 'Switch to Won'}
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
        className="py-4 rounded-xl bg-red-600 border-2 border-red-600 text-white font-bold text-base hover:bg-red-700 active:bg-red-800 transition-colors min-h-[56px] disabled:opacity-50"
      >
        Point<br />Lost
      </button>
      <button
        onClick={() => ballOver()}
        disabled={isSaving || !hasTouches}
        className="py-4 rounded-xl bg-white border-2 border-gray-300 text-gray-700 font-bold text-base hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-[56px] disabled:opacity-30"
      >
        Ball Over
      </button>
      <button
        onClick={() => logPoint(true)}
        disabled={isSaving}
        className="py-4 rounded-xl bg-green-600 border-2 border-green-600 text-white font-bold text-base hover:bg-green-700 active:bg-green-800 transition-colors min-h-[56px] disabled:opacity-50"
      >
        Point<br />Won
      </button>
    </div>
  );
}
