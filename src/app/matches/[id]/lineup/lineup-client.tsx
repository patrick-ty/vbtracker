'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveLineup, updateMatch } from '../../actions';
import { POSITION_LABELS, type PlayerPosition } from '@/lib/types';
import type { Database } from '@/lib/database.types';

type Player = Database['public']['Tables']['players']['Row'];
type Match = Database['public']['Tables']['matches']['Row'];

// Volleyball court positions (bird's eye, standard numbering):
//   4 --- 3 --- 2   (front row, left to right from team's perspective)
//   5 --- 6 --- 1   (back row, left to right from team's perspective)
// Net is at the top

const COURT_POSITIONS: { pos: number; label: string; x: number; y: number }[] = [
  { pos: 4, label: 'Front Left',   x: 60,  y: 80 },
  { pos: 3, label: 'Front Center', x: 180, y: 80 },
  { pos: 2, label: 'Front Right',  x: 300, y: 80 },
  { pos: 5, label: 'Back Left',    x: 60,  y: 220 },
  { pos: 6, label: 'Back Center',  x: 180, y: 220 },
  { pos: 1, label: 'Back Right',   x: 300, y: 220 },
];

interface LineupClientProps {
  match: Match;
  players: Player[];
}

export function LineupClient({ match, players }: LineupClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lineup, setLineup] = useState<Record<number, string>>({});
  const [selectingPosition, setSelectingPosition] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

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

  function handleSave() {
    setError(null);

    // Convert lineup (pos → playerId) to positions (pos → jersey_number) for the DB
    const positions: Record<string, number> = {};
    for (const [pos, playerId] of Object.entries(lineup)) {
      const player = players.find((p) => p.id === playerId);
      if (player) positions[pos] = player.jersey_number;
    }

    startTransition(async () => {
      try {
        await saveLineup(match.id, positions);
        router.push(`/`);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong');
      }
    });
  }

  function getPlayerForPosition(pos: number): Player | undefined {
    const playerId = lineup[pos];
    if (!playerId) return undefined;
    return players.find((p) => p.id === playerId);
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="bg-blue-700 text-white px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="hover:text-blue-200 transition-colors">&larr;</a>
            <div>
            <h1 className="text-xl font-bold tracking-tight">Starting Lineup</h1>
            <p className="text-blue-200 text-xs mt-0.5">
              {match.opponent_name ? `vs ${match.opponent_name}` : 'Opponent TBD'}
              {' \u00B7 '}{filledCount}/6 positions filled
            </p>
          </div>
          </div>
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-200 hover:text-white transition-colors"
          >
            {showDetails ? 'Hide Details' : 'Edit Details'}
          </button>
        </div>
      </header>

      {/* Collapsible match details */}
      {showDetails && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
          <form
            action={(fd) => {
              startTransition(async () => {
                try {
                  await updateMatch(fd);
                  setShowDetails(false);
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Something went wrong');
                }
              });
            }}
            className="max-w-2xl mx-auto space-y-3"
          >
            <input type="hidden" name="id" value={match.id} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Opponent</label>
                <input
                  name="opponent_name"
                  type="text"
                  defaultValue={match.opponent_name}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[44px]"
                  placeholder="Team name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                <input
                  name="date"
                  type="date"
                  defaultValue={match.date}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Location</label>
                <input
                  name="location"
                  type="text"
                  defaultValue={match.location}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[44px]"
                  placeholder="Gym or venue"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="block text-xs font-medium text-gray-500">Serving first?</label>
              <div className="flex gap-2">
                <label className="cursor-pointer">
                  <input type="radio" name="is_serving_first" value="true" defaultChecked={match.is_serving_first} className="peer sr-only" />
                  <span className="px-3 py-1 rounded-lg border border-gray-300 text-sm peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-700">Yes</span>
                </label>
                <label className="cursor-pointer">
                  <input type="radio" name="is_serving_first" value="false" defaultChecked={!match.is_serving_first} className="peer sr-only" />
                  <span className="px-3 py-1 rounded-lg border border-gray-300 text-sm peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-700">No</span>
                </label>
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium min-h-[44px] disabled:opacity-50"
              >
                {isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      <main className="flex-1 p-5 max-w-5xl mx-auto w-full space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Court + Player picker — side by side on tablet */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-4 items-start">
          {/* Court diagram */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <svg viewBox="0 0 360 310" className="w-full">
              {/* Court background */}
              <rect x="10" y="10" width="340" height="290" rx="4" fill="#e8f5e9" stroke="#4caf50" strokeWidth="2" />

              {/* Net */}
              <line x1="10" y1="150" x2="350" y2="150" stroke="#333" strokeWidth="3" strokeDasharray="8,4" />
              <text x="180" y="165" textAnchor="middle" fontSize="11" fill="#666">NET</text>

              {/* Center line labels */}
              <text x="180" y="40" textAnchor="middle" fontSize="11" fill="#666" fontWeight="500">Front Row</text>
              <text x="180" y="280" textAnchor="middle" fontSize="11" fill="#666" fontWeight="500">Back Row</text>

              {/* Position slots */}
              {COURT_POSITIONS.map(({ pos, x, y }) => {
                const player = getPlayerForPosition(pos);
                const isSelecting = selectingPosition === pos;

                return (
                  <g key={pos} onClick={() => {
                    if (player) {
                      removeFromPosition(pos);
                    } else {
                      setSelectingPosition(isSelecting ? null : pos);
                    }
                  }} className="cursor-pointer">
                    <circle
                      cx={x}
                      cy={y}
                      r="32"
                      fill={player ? '#2563eb' : isSelecting ? '#dbeafe' : '#f3f4f6'}
                      stroke={isSelecting ? '#2563eb' : player ? '#1d4ed8' : '#d1d5db'}
                      strokeWidth={isSelecting ? 3 : 2}
                    />

                    {player ? (
                      <>
                        <text x={x} y={y - 4} textAnchor="middle" fontSize="18" fontWeight="bold" fill="white">
                          {player.jersey_number}
                        </text>
                        <text x={x} y={y + 12} textAnchor="middle" fontSize="9" fill="white">
                          {player.last_name.slice(0, 8)}
                        </text>
                      </>
                    ) : (
                      <text x={x} y={y + 5} textAnchor="middle" fontSize="16" fontWeight="bold" fill="#9ca3af">
                        {pos}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Player picker — always visible on right side */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {selectingPosition !== null
                ? `Position ${selectingPosition}`
                : 'Tap a court position'}
            </h3>
            {selectingPosition === null ? (
              <p className="text-gray-400 text-sm py-4 text-center">
                Tap an empty position on the court to assign a player
              </p>
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
                    {player.avatar_url ? (
                      <img
                        src={player.avatar_url}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 text-xs font-semibold flex items-center justify-center shrink-0">
                        {player.first_name[0]}{player.last_name[0]}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div>
                        <span className="font-bold text-blue-700 mr-1">#{player.jersey_number}</span>
                        <span className="font-medium text-sm">{player.first_name} {player.last_name}</span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {POSITION_LABELS[player.position as PlayerPosition]}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={isPending}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors active:scale-[0.98] min-h-[44px] disabled:opacity-50"
        >
          {isPending ? 'Saving...' : filledCount === 6 ? 'Start Match' : filledCount > 0 ? `Start Match (${filledCount}/6)` : 'Skip Lineup'}
        </button>
      </main>
    </div>
  );
}
