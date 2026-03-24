'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { saveSetLineup } from './actions';
import { POSITION_LABELS, type PlayerPosition } from '@/lib/types';
import type { Database } from '@/lib/database.types';

type Player = Database['public']['Tables']['players']['Row'];

const COURT_POSITIONS: { pos: number; label: string; x: number; y: number }[] = [
  { pos: 4, label: 'Front Left',   x: 60,  y: 80 },
  { pos: 3, label: 'Front Center', x: 180, y: 80 },
  { pos: 2, label: 'Front Right',  x: 300, y: 80 },
  { pos: 5, label: 'Back Left',    x: 60,  y: 220 },
  { pos: 6, label: 'Back Center',  x: 180, y: 220 },
  { pos: 1, label: 'Back Right',   x: 300, y: 220 },
];

interface SetLineupClientProps {
  matchId: string;
  setId: string;
  setNumber: number;
  opponentName: string;
  players: Player[];
  existingPositions: Record<string, number> | null;
}

export function SetLineupClient({ matchId, setId, setNumber, opponentName, players, existingPositions }: SetLineupClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectingPosition, setSelectingPosition] = useState<number | null>(null);

  // Initialize lineup from existing positions (jersey number → find player id)
  const [lineup, setLineup] = useState<Record<number, string>>(() => {
    if (!existingPositions) return {};
    const initial: Record<number, string> = {};
    for (const [pos, jersey] of Object.entries(existingPositions)) {
      const player = players.find((p) => p.jersey_number === jersey);
      if (player) initial[Number(pos)] = player.id;
    }
    return initial;
  });

  const assignedPlayerIds = new Set(Object.values(lineup));
  const availablePlayers = players.filter((p) => !assignedPlayerIds.has(p.id));
  const filledCount = Object.keys(lineup).length;

  function assignPlayer(position: number, playerId: string) {
    setLineup((prev) => ({ ...prev, [position]: playerId }));
    setSelectingPosition(null);
  }

  function removeFromPosition(position: number) {
    setLineup((prev) => {
      const next = { ...prev };
      delete next[position];
      return next;
    });
  }

  function getPlayerForPosition(pos: number): Player | undefined {
    const playerId = lineup[pos];
    if (!playerId) return undefined;
    return players.find((p) => p.id === playerId);
  }

  function handleSave() {
    setError(null);
    const positions: Record<string, number> = {};
    for (const [pos, playerId] of Object.entries(lineup)) {
      const player = players.find((p) => p.id === playerId);
      if (player) positions[pos] = player.jersey_number;
    }

    startTransition(async () => {
      try {
        await saveSetLineup(setId, positions);
        router.push(`/matches/${matchId}/sets/${setNumber}`);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong');
      }
    });
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="bg-blue-700 text-white px-6 py-3">
        <div className="flex items-center gap-4">
          <Link href={`/matches/${matchId}/sets/${setNumber}`} className="hover:text-blue-200 transition-colors">&larr;</Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Set {setNumber} Lineup</h1>
            <p className="text-blue-200 text-xs">
              {opponentName ? `vs ${opponentName}` : 'Match'}
              {' \u00B7 '}{filledCount}/6
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-5 max-w-5xl mx-auto w-full space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-4 items-start">
          {/* Court */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <svg viewBox="0 0 360 310" className="w-full">
              <rect x="10" y="10" width="340" height="290" rx="4" fill="#e8f5e9" stroke="#4caf50" strokeWidth="2" />
              <line x1="10" y1="150" x2="350" y2="150" stroke="#333" strokeWidth="3" strokeDasharray="8,4" />
              <text x="180" y="165" textAnchor="middle" fontSize="11" fill="#666">NET</text>
              <text x="180" y="40" textAnchor="middle" fontSize="11" fill="#666" fontWeight="500">Front Row</text>
              <text x="180" y="280" textAnchor="middle" fontSize="11" fill="#666" fontWeight="500">Back Row</text>

              {COURT_POSITIONS.map(({ pos, x, y }) => {
                const player = getPlayerForPosition(pos);
                const isSelecting = selectingPosition === pos;
                return (
                  <g key={pos} onClick={() => {
                    if (player) removeFromPosition(pos);
                    else setSelectingPosition(isSelecting ? null : pos);
                  }} className="cursor-pointer">
                    <circle cx={x} cy={y} r="32"
                      fill={player ? '#2563eb' : isSelecting ? '#dbeafe' : '#f3f4f6'}
                      stroke={isSelecting ? '#2563eb' : player ? '#1d4ed8' : '#d1d5db'}
                      strokeWidth={isSelecting ? 3 : 2}
                    />
                    {player ? (
                      <>
                        <text x={x} y={y - 4} textAnchor="middle" fontSize="18" fontWeight="bold" fill="white">{player.jersey_number}</text>
                        <text x={x} y={y + 12} textAnchor="middle" fontSize="9" fill="white">{player.last_name.slice(0, 8)}</text>
                      </>
                    ) : (
                      <text x={x} y={y + 5} textAnchor="middle" fontSize="16" fontWeight="bold" fill="#9ca3af">{pos}</text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Player picker */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {selectingPosition !== null ? `Position ${selectingPosition}` : 'Tap a court position'}
            </h3>
            {selectingPosition === null ? (
              <p className="text-gray-400 text-sm py-4 text-center">Tap an empty position on the court to assign a player</p>
            ) : availablePlayers.length === 0 ? (
              <p className="text-gray-400 text-sm py-4 text-center">All players assigned</p>
            ) : (
              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                {availablePlayers.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => assignPlayer(selectingPosition, player.id)}
                    className="flex items-center gap-3 w-full p-2.5 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors active:bg-blue-100 min-h-[44px] text-left"
                  >
                    <span className="font-bold text-blue-700 mr-1">#{player.jersey_number}</span>
                    <span className="font-medium text-sm">{player.first_name} {player.last_name}</span>
                    <span className="text-xs text-gray-400 ml-auto">{POSITION_LABELS[player.position as PlayerPosition]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isPending}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors active:scale-[0.98] min-h-[44px] disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Save Lineup'}
        </button>
      </main>
    </div>
  );
}
