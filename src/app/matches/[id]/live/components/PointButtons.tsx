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

  // Editing mode
  if (editingRallyIndex !== null) {
    const rally = rallyLog[editingRallyIndex];
    if (!rally) return null;

    return (
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center mb-2">Point</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => flipRallyPoint(editingRallyIndex, false)}
            disabled={isSaving || !rally.pointWon}
            className={`py-4 rounded-xl transition-colors min-h-[52px] ${
              !rally.pointWon
                ? 'bg-red-600 text-white font-bold text-lg shadow-md'
                : 'bg-white border-2 border-red-200 text-red-400 font-medium hover:bg-red-50 hover:text-red-500'
            }`}
          >
            {!rally.pointWon ? 'LOST' : 'Switch to Lost'}
          </button>
          <button
            onClick={() => flipRallyPoint(editingRallyIndex, true)}
            disabled={isSaving || rally.pointWon}
            className={`py-4 rounded-xl transition-colors min-h-[52px] ${
              rally.pointWon
                ? 'bg-green-600 text-white font-bold text-lg shadow-md'
                : 'bg-white border-2 border-green-200 text-green-400 font-medium hover:bg-green-50 hover:text-green-500'
            }`}
          >
            {rally.pointWon ? 'WON' : 'Switch to Won'}
          </button>
        </div>
      </div>
    );
  }

  // Normal mode
  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center mb-2">Point</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => logPoint(false)}
            disabled={isSaving}
            className="py-4 rounded-xl bg-red-600 text-white font-bold text-lg hover:bg-red-700 active:bg-red-800 transition-colors min-h-[52px] disabled:opacity-50"
          >
            LOST
          </button>
          <button
            onClick={() => logPoint(true)}
            disabled={isSaving}
            className="py-4 rounded-xl bg-green-600 text-white font-bold text-lg hover:bg-green-700 active:bg-green-800 transition-colors min-h-[52px] disabled:opacity-50"
          >
            WON
          </button>
        </div>
      </div>
      <button
        onClick={() => ballOver()}
        disabled={isSaving || !hasTouches}
        className="w-full py-3 rounded-xl bg-white border-2 border-gray-300 text-gray-700 font-bold text-base hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-[48px] disabled:opacity-30"
      >
        Ball Over
      </button>
    </div>
  );
}
