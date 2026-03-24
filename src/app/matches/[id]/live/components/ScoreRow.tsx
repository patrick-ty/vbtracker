'use client';

import { useMatchStore, usePhase } from '@/stores/matchStore';
import { getScoreOptions, getScoreColor } from '@/lib/types';
import type { TouchScore } from '@/lib/types';

const COLOR_CLASSES: Record<string, string> = {
  green: 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100',
  blue: 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100',
  yellow: 'bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100',
  red: 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100',
};

export function ScoreRow() {
  const selectedType = useMatchStore((s) => s.selectedType);
  const selectedPlayer = useMatchStore((s) => s.selectedPlayer);
  const selectScore = useMatchStore((s) => s.selectScore);
  const phase = usePhase();

  // Determine which score options to show
  const effectiveType = phase === 'serve_entry' ? 'serve' : selectedType;
  const options = getScoreOptions(effectiveType);

  // Active when: serve phase + player selected, OR touch phase + player + type selected
  const isActive = phase === 'serve_entry'
    ? selectedPlayer !== null
    : selectedPlayer !== null && selectedType !== null;

  if (options.length === 0) {
    return (
      <div className="grid grid-cols-4 gap-2 opacity-30">
        {[3, 2, 1, 0].map((n) => (
          <div key={n} className="py-4 rounded-xl border-2 border-gray-200 bg-gray-50 text-center min-h-[56px]">
            <span className="text-2xl font-black text-gray-300">{n}</span>
          </div>
        ))}
      </div>
    );
  }

  const cols = options.length <= 2 ? 'grid-cols-2' : options.length === 3 ? 'grid-cols-3' : 'grid-cols-4';
  const showNumbers = effectiveType === 'pass' || effectiveType === 'set' || effectiveType === 'attack';

  return (
    <div className={`grid ${cols} gap-2 ${!isActive ? 'opacity-40' : ''}`}>
      {options.map(({ value, label }) => {
        const color = getScoreColor(value);
        return (
          <button
            key={`${value}-${label}`}
            onClick={() => { if (isActive) selectScore(value); }}
            disabled={!isActive}
            className={`py-4 rounded-xl border-2 text-center transition-all min-h-[56px] ${COLOR_CLASSES[color]}`}
          >
            {showNumbers ? (
              <>
                <span className="text-3xl font-black block leading-none">{value}</span>
                <span className="text-xs font-medium mt-1 block">{label}</span>
              </>
            ) : (
              <span className="text-xl font-bold block">{label}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
