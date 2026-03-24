'use client';

import { useMatchStore } from '@/stores/matchStore';

export function UtilityRow() {
  const undoLastRally = useMatchStore((s) => s.undoLastRally);
  const startSub = useMatchStore((s) => s.startSub);
  const currentRallyNumber = useMatchStore((s) => s.currentRallyNumber);
  const activeLineup = useMatchStore((s) => s.activeLineup);
  const subState = useMatchStore((s) => s.subState);
  const editingRallyIndex = useMatchStore((s) => s.editingRallyIndex);
  const saveEditRally = useMatchStore((s) => s.saveEditRally);
  const cancelEditRally = useMatchStore((s) => s.cancelEditRally);
  const isSaving = useMatchStore((s) => s.isSaving);

  // Editing a completed rally — show save/cancel
  if (editingRallyIndex !== null) {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={() => cancelEditRally()}
          className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors min-h-[44px]"
        >
          Cancel Edit
        </button>
        <button
          onClick={() => saveEditRally()}
          disabled={isSaving}
          className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors min-h-[44px] disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <button
        onClick={() => undoLastRally()}
        disabled={currentRallyNumber <= 1}
        className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors min-h-[44px]"
      >
        Undo Last Rally
      </button>
      {activeLineup.length > 0 && !subState && (
        <button
          onClick={() => startSub()}
          className="px-4 py-2 rounded-lg border-2 border-orange-300 text-orange-600 text-sm font-bold hover:bg-orange-50 transition-colors min-h-[44px]"
        >
          SUB
        </button>
      )}
    </div>
  );
}
