'use client';

import Link from 'next/link';
import { useMatchStore } from '@/stores/matchStore';
import type { Database } from '@/lib/database.types';

function UndoButton() {
  const undoLastRally = useMatchStore((s) => s.undoLastRally);
  const currentRallyNumber = useMatchStore((s) => s.currentRallyNumber);

  return (
    <button
      onClick={() => undoLastRally()}
      disabled={currentRallyNumber <= 1}
      className="text-blue-200 hover:text-white font-medium disabled:opacity-30 transition-colors"
    >
      Undo
    </button>
  );
}

type Match = Database['public']['Tables']['matches']['Row'];

interface SetSummary {
  setNumber: number;
  ourScore: number;
  theirScore: number;
  status: 'in-progress' | 'completed';
}

interface LiveHeaderProps {
  match: Match;
  teamName: string;
  eventName: string | null;
  allSets: SetSummary[];
}

export function LiveHeader({ match, teamName, eventName, allSets }: LiveHeaderProps) {
  const currentSet = useMatchStore((s) => s.currentSet);

  const ourScore = currentSet?.ourScore ?? 0;
  const theirScore = currentSet?.theirScore ?? 0;
  const setNumber = currentSet?.setNumber ?? 1;
  const opponent = match.opponent_name || 'Opponent';

  return (
    <div className="bg-blue-700 text-white shrink-0 px-8 py-3">
      {/* Row 1: Exit, context, scoreboard, undo */}
      <div className="flex items-start justify-between gap-6">
        {/* Left: Exit + event info */}
        <div className="w-48 shrink-0">
          <Link href={`/matches/${match.id}`} className="text-blue-300 hover:text-white text-sm font-medium">
            &larr; Exit
          </Link>
          <div className="mt-2">
            {eventName && (
              <p className="text-sm font-semibold text-white leading-snug">{eventName}</p>
            )}
            <p className="text-xs text-blue-300 mt-1">
              {new Date(match.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Center: Scoreboard */}
        <div className="flex-1 text-center">
          <div className="flex items-center justify-center gap-12">
            <div className="text-right min-w-[120px]">
              <p className="text-sm font-bold text-blue-200 uppercase tracking-wide">{teamName}</p>
              <p className="text-6xl font-black tabular-nums leading-none mt-1">{ourScore}</p>
            </div>
            <div className="text-blue-400 text-3xl font-light">–</div>
            <div className="text-left min-w-[120px]">
              <p className="text-sm font-bold text-blue-200 uppercase tracking-wide">{opponent}</p>
              <p className="text-6xl font-black tabular-nums leading-none mt-1">{theirScore}</p>
            </div>
          </div>

          {/* Set scores */}
          <div className="flex items-center justify-center gap-3 mt-2">
            {allSets.map((s) => {
              const isActive = s.setNumber === setNumber;
              const displayOur = isActive ? ourScore : s.ourScore;
              const displayTheir = isActive ? theirScore : s.theirScore;
              return (
                <span
                  key={s.setNumber}
                  className={`text-sm tabular-nums px-3 py-1 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white font-bold'
                      : 'text-blue-300 font-medium'
                  }`}
                >
                  S{s.setNumber} {displayOur}–{displayTheir}
                </span>
              );
            })}
          </div>
        </div>

        {/* Right: Undo */}
        <div className="w-48 shrink-0 text-right">
          <UndoButton />
        </div>
      </div>
    </div>
  );
}
