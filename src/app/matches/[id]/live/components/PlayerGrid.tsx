'use client';

import { useState } from 'react';
import { useMatchStore, usePhase } from '@/stores/matchStore';
import type { Database } from '@/lib/database.types';

type Player = Database['public']['Tables']['players']['Row'];

interface PlayerGridProps {
  players: Player[];
  positions: Record<string, number> | null;
}

const COURT_ORDER = [4, 3, 2, 5, 6, 1];

export function PlayerGrid({ players, positions: initialPositions }: PlayerGridProps) {
  const selectedPlayer = useMatchStore((s) => s.selectedPlayer);
  const subState = useMatchStore((s) => s.subState);
  const activeLineup = useMatchStore((s) => s.activeLineup);
  const courtPositions = useMatchStore((s) => s.courtPositions);
  const selectPlayer = useMatchStore((s) => s.selectPlayer);
  const startSub = useMatchStore((s) => s.startSub);
  const rotateLineup = useMatchStore((s) => s.rotateLineup);
  const swapPositions = useMatchStore((s) => s.swapPositions);
  const selectSubIn = useMatchStore((s) => s.selectSubIn);
  const selectSubOut = useMatchStore((s) => s.selectSubOut);

  const positions = courtPositions ?? initialPositions;
  const lineup = activeLineup.length > 0 ? activeLineup : [];
  const onCourt = players.filter((p) => lineup.includes(p.jersey_number));
  const bench = players.filter((p) => !lineup.includes(p.jersey_number));

  // Swap mode state (local to this component)
  const [swapMode, setSwapMode] = useState(false);
  const [swapFirst, setSwapFirst] = useState<number | null>(null);

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

  // Sub: pick who comes in
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

  // Sub: pick who goes out
  if (subState?.step === 'pick_out') {
    return (
      <div className="space-y-3">
        <p className="text-sm font-bold text-orange-700">#{subState.playerIn} in — who&apos;s going OUT?</p>
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

  // Swap mode: select two players to swap positions
  function handleSwapTap(jersey: number) {
    if (swapFirst === null) {
      setSwapFirst(jersey);
    } else {
      if (jersey !== swapFirst) {
        swapPositions(swapFirst, jersey);
      }
      setSwapFirst(null);
      setSwapMode(false);
    }
  }

  return (
    <div>
      {lineup.length > 0 && !subState && (
        <div className="flex justify-end gap-2 mb-2">
          <button
            onClick={() => { setSwapMode(!swapMode); setSwapFirst(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              swapMode
                ? 'bg-purple-600 text-white'
                : 'border-2 border-purple-300 text-purple-600 hover:bg-purple-50'
            }`}
          >
            Swap
          </button>
          <button
            onClick={() => rotateLineup()}
            className="px-3 py-1.5 rounded-lg border-2 border-blue-300 text-blue-600 text-xs font-bold hover:bg-blue-50 transition-colors"
          >
            Rotate ↻
          </button>
          <button
            onClick={() => startSub()}
            className="px-3 py-1.5 rounded-lg border-2 border-orange-300 text-orange-600 text-xs font-bold hover:bg-orange-50 transition-colors"
          >
            SUB
          </button>
        </div>
      )}

      {swapMode && (
        <p className="text-xs text-purple-600 font-medium text-center mb-1">
          {swapFirst === null ? 'Tap first player to swap' : `Tap second player to swap with #${swapFirst}`}
        </p>
      )}

      {positions && Object.keys(positions).length === 6 && (
        <p className="text-[10px] text-gray-400 text-center mb-1 font-medium uppercase tracking-wider">— net —</p>
      )}
      <div className="grid grid-cols-3 gap-2">
        {orderedPlayers.map((p) => {
          const isSelected = selectedPlayer === p.jersey_number;
          const isSwapSelected = swapFirst === p.jersey_number;

          if (swapMode) {
            return (
              <button
                key={p.id}
                onClick={() => handleSwapTap(p.jersey_number)}
                className={`flex flex-col items-center py-3 rounded-xl transition-all min-h-[64px] ${
                  isSwapSelected
                    ? 'bg-purple-600 text-white shadow-lg scale-[1.03]'
                    : 'bg-white border-2 border-purple-200 text-gray-900 hover:border-purple-400 hover:bg-purple-50'
                }`}
              >
                <span className="text-2xl font-bold tabular-nums">{p.jersey_number}</span>
                <span className={`text-xs font-semibold mt-0.5 ${isSwapSelected ? 'text-purple-200' : 'text-gray-500'}`}>
                  {p.last_name}
                </span>
              </button>
            );
          }

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
