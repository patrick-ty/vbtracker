'use client';

import { useMatchStore } from '@/stores/matchStore';

export function UtilityRow() {
  const editingRallyIndex = useMatchStore((s) => s.editingRallyIndex);
  const saveEditRally = useMatchStore((s) => s.saveEditRally);
  const cancelEditRally = useMatchStore((s) => s.cancelEditRally);
  const isSaving = useMatchStore((s) => s.isSaving);

  // Only show when editing a completed rally
  if (editingRallyIndex === null) return null;

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
