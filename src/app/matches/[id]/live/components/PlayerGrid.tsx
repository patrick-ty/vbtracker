'use client';

import { useMatchStore, usePhase } from '@/stores/matchStore';
import type { Database } from '@/lib/database.types';

type Player = Database['public']['Tables']['players']['Row'];

interface PlayerGridProps {
  players: Player[];
  positions: Record<string, number> | null; // court position -> jersey number
}

// Court layout: positions 4,3,2 (front L,C,R) then 5,6,1 (back L,C,R)
const COURT_ORDER = [4, 3, 2, 5, 6, 1];

export function PlayerGrid({ players, positions }: PlayerGridProps) {
  const selectedPlayer = useMatchStore((s) => s.selectedPlayer);
  const subState = useMatchStore((s) => s.subState);
  const activeLineup = useMatchStore((s) => s.activeLineup);
  const selectPlayer = useMatchStore((s) => s.selectPlayer);
  const selectSubIn = useMatchStore((s) => s.selectSubIn);
  const selectSubOut = useMatchStore((s) => s.selectSubOut);

  const lineup = activeLineup.length > 0 ? activeLineup : [];
  const onCourt = players.filter((p) => lineup.includes(p.jersey_number));
  const bench = players.filter((p) => !lineup.includes(p.jersey_number));

  // Arrange by court position if positions are available
  let orderedPlayers: Player[];
  if (positions && Object.keys(positions).length === 6) {
    orderedPlayers = COURT_ORDER.map((pos) => {
      const jersey = positions[String(pos)];
      return players.find((p) => p.jersey_number === jersey);
    }).filter(Boolean) as Player[];
  } else {
    orderedPlayers = onCourt.length > 0 ? onCourt : players;
  }

  const isSubMode = subState !== null;

  // Sub mode: picking who comes in (bench)
  if (subState?.step === 'pick_in') {
    return (
      <div className="space-y-3">
        <p className="text-sm font-bold text-green-700">Who&apos;s coming IN?</p>
        <div className="grid grid-cols-3 gap-2">
          {bench.map((p) => (
            <button key={p.id} onClick={() => selectSubIn(p.jersey_number)}
              className="flex flex-col items-center py-3 rounded-xl bg-green-50 border-2 border-green-200 hover:bg-green-100 transition-colors min-h-[64px]">
              <span className="text-2xl font-bold">{p.jersey_number}</span>
              <span className="text-xs font-semibold text-gray-500 mt-0.5">{p.last_name}</span>
            </button>
          ))}
        </div>
        <button onClick={() => useMatchStore.getState().cancelSub()} className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>
      </div>
    );
  }

  // Sub mode: picking who goes out (on court)
  if (subState?.step === 'pick_out') {
    return (
      <div className="space-y-3">
        <p className="text-sm font-bold text-orange-700">
          #{subState.playerIn} in — who&apos;s going OUT?
        </p>
        <div className="grid grid-cols-3 gap-2">
          {orderedPlayers.map((p) => (
            <button key={p.id} onClick={() => selectSubOut(p.jersey_number)}
              className="flex flex-col items-center py-3 rounded-xl bg-orange-50 border-2 border-orange-200 hover:bg-orange-100 transition-colors min-h-[64px]">
              <span className="text-2xl font-bold">{p.jersey_number}</span>
              <span className="text-xs font-semibold text-gray-500 mt-0.5">{p.last_name}</span>
            </button>
          ))}
        </div>
        <button onClick={() => useMatchStore.getState().cancelSub()} className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>
      </div>
    );
  }

  // Normal mode: player selection
  return (
    <div>
      {positions && Object.keys(positions).length === 6 && (
        <p className="text-[10px] text-gray-400 text-center mb-1 font-medium uppercase tracking-wider">— net —</p>
      )}
      <div className="grid grid-cols-3 gap-2">
        {orderedPlayers.map((p, i) => {
          const isSelected = selectedPlayer === p.jersey_number;
          return (
            <button
              key={p.id}
              onClick={() => selectPlayer(p.jersey_number)}
              className={`flex flex-col items-center py-3 rounded-xl transition-all min-h-[64px] ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-lg scale-[1.03]'
                  : 'bg-white border-2 border-gray-200 text-gray-900 hover:border-blue-400 hover:bg-blue-50 active:bg-blue-100'
              }`}
            >
              <span className="text-2xl font-bold tabular-nums">{p.jersey_number}</span>
              <span className={`text-xs font-semibold mt-0.5 ${isSelected ? 'text-blue-200' : 'text-gray-500'}`}>
                {p.last_name}
              </span>
            </button>
          );
        })}
      </div>
      {positions && Object.keys(positions).length === 6 && (
        <p className="text-[10px] text-gray-400 text-center mt-1 font-medium uppercase tracking-wider">— back —</p>
      )}
    </div>
  );
}
