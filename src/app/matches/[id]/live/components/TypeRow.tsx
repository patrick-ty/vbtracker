'use client';

import { useMatchStore, usePhase } from '@/stores/matchStore';
import { RALLY_TOUCH_TYPES, TOUCH_TYPE_LABELS } from '@/lib/types';

export function TypeRow() {
  const selectedType = useMatchStore((s) => s.selectedType);
  const selectedPlayer = useMatchStore((s) => s.selectedPlayer);
  const selectType = useMatchStore((s) => s.selectType);
  const phase = usePhase();

  // In serve phase, type row is not needed (serve score handles it)
  if (phase === 'serve_entry') return null;

  const isActive = selectedPlayer !== null;

  return (
    <div className={`grid grid-cols-5 gap-2 ${!isActive ? 'opacity-40' : ''}`}>
      {RALLY_TOUCH_TYPES.map((type) => {
        const isSelected = selectedType === type;
        return (
          <button
            key={type}
            onClick={() => { if (isActive) selectType(type); }}
            disabled={!isActive}
            className={`py-3 rounded-xl text-center transition-all min-h-[52px] ${
              isSelected
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white border-2 border-gray-200 text-gray-800 hover:border-blue-400 hover:bg-blue-50'
            }`}
          >
            <span className="text-base font-bold block">{TOUCH_TYPE_LABELS[type]}</span>
            <span className={`text-[10px] capitalize ${isSelected ? 'text-blue-200' : 'text-gray-400'}`}>{type}</span>
          </button>
        );
      })}
    </div>
  );
}
