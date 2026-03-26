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
      <div className="rounded-xl border-2 border-gray-200 overflow-hidden">
        <div className="bg-gray-100 text-center py-1.5">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Point</span>
        </div>
        <div className="grid grid-cols-2">
          <button
            onClick={() => flipRallyPoint(editingRallyIndex, false)}
            disabled={isSaving || !rally.pointWon}
            className={`py-3 transition-colors min-h-[48px] border-r border-gray-200 ${
              !rally.pointWon
                ? 'bg-red-600 text-white font-bold text-lg shadow-inner'
                : 'bg-white text-red-400 font-medium text-sm hover:bg-red-50 hover:text-red-500'
            }`}
          >
            {!rally.pointWon ? 'LOST' : 'Switch to Lost'}
          </button>
          <button
            onClick={() => flipRallyPoint(editingRallyIndex, true)}
            disabled={isSaving || rally.pointWon}
            className={`py-3 transition-colors min-h-[48px] ${
              rally.pointWon
                ? 'bg-green-600 text-white font-bold text-lg shadow-inner'
                : 'bg-white text-green-400 font-medium text-sm hover:bg-green-50 hover:text-green-500'
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
    <div className="flex gap-2 items-stretch">
      <div className="flex-1 rounded-xl border-2 border-gray-200 overflow-hidden">
        <div className="bg-gray-100 text-center py-1.5">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Point</span>
        </div>
        <div className="grid grid-cols-2">
          <button
            onClick={() => logPoint(false)}
            disabled={isSaving}
            className="py-4 bg-red-600 text-white font-bold text-lg hover:bg-red-700 active:bg-red-800 transition-colors min-h-[52px] disabled:opacity-50 border-r border-red-700"
          >
            LOST
          </button>
          <button
            onClick={() => logPoint(true)}
            disabled={isSaving}
            className="py-4 bg-green-600 text-white font-bold text-lg hover:bg-green-700 active:bg-green-800 transition-colors min-h-[52px] disabled:opacity-50"
          >
            WON
          </button>
        </div>
      </div>
      <button
        onClick={() => ballOver()}
        disabled={isSaving || !hasTouches}
        className="px-4 rounded-xl bg-white border-2 border-gray-300 text-gray-600 font-bold text-sm hover:bg-gray-100 active:bg-gray-200 transition-colors disabled:opacity-30"
      >
        Ball<br />Over
      </button>
    </div>
  );
}
