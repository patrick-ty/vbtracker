'use client';

import { useEffect, useRef } from 'react';
import { useMatchStore } from '@/stores/matchStore';
import { RallyCard } from './RallyCard';
import { CurrentRallyCard } from './CurrentRallyCard';

export function RallyLog() {
  const rallyLog = useMatchStore((s) => s.rallyLog);
  const serve = useMatchStore((s) => s.serve);
  const completedTouches = useMatchStore((s) => s.completedTouches);
  const editingRallyIndex = useMatchStore((s) => s.editingRallyIndex);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [rallyLog.length, serve, completedTouches.length]);

  const hasCurrentRally = serve || completedTouches.length > 0;
  const isEditingOldRally = editingRallyIndex !== null;

  return (
    <div className="flex flex-col h-full p-4 overflow-y-auto space-y-2">
      {rallyLog.length === 0 && !hasCurrentRally && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-300 text-lg font-medium">Rally log</p>
        </div>
      )}

      {rallyLog.map((r, idx) => (
        <RallyCard key={`${r.rallyNumber}-${idx}`} rally={r} index={idx} />
      ))}

      {/* Only show current rally card when NOT editing an old rally */}
      {!isEditingOldRally && <CurrentRallyCard />}

      <div ref={endRef} />
    </div>
  );
}
