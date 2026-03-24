'use client';

import { useMatchStore } from '@/stores/matchStore';

export function PointButtons() {
  const logPoint = useMatchStore((s) => s.logPoint);
  const ballOver = useMatchStore((s) => s.ballOver);
  const isSaving = useMatchStore((s) => s.isSaving);
  const completedTouches = useMatchStore((s) => s.completedTouches);
  const editingRallyIndex = useMatchStore((s) => s.editingRallyIndex);

  // Hide when editing an old rally
  if (editingRallyIndex !== null) return null;

  const hasTouches = completedTouches.length > 0;

  return (
    <div className="grid grid-cols-3 gap-2">
      <button
        onClick={() => logPoint(false)}
        disabled={isSaving}
        className="py-4 rounded-xl bg-red-50 border-2 border-red-300 text-red-700 font-bold text-base hover:bg-red-100 active:bg-red-200 transition-colors min-h-[56px] disabled:opacity-50"
      >
        Their Point
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
        Our Point
      </button>
    </div>
  );
}
