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
    <div className="bg-blue-700 text-white shrink-0">
      {/* Top bar: Exit + Undo */}
      <div className="flex items-center justify-between px-6 pt-1.5 pb-1">
        <Link href={`/matches/${match.id}`} className="text-blue-300 hover:text-white text-sm font-medium">
          &larr; Exit
        </Link>
        <UndoButton />
      </div>

      {/* Main header: context (33%) + scoreboard (66%) */}
      <div className="flex items-stretch px-6 pb-2">
        {/* Left 33%: Event, date, match info */}
        <div className="w-1/3 flex flex-col justify-center pr-4 border-r border-blue-600/50">
          {eventName && (
            <p className="text-base font-semibold text-white leading-tight">{eventName}</p>
          )}
          <p className="text-xs text-blue-300 mt-0.5">
            {new Date(match.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          <p className="text-xs text-blue-300 mt-0.5">
            vs {opponent}
          </p>
        </div>

        {/* Right 66%: Scoreboard */}
        <div className="w-2/3 pl-6">
          {/* Team scores */}
          <div className="flex items-end justify-center gap-8">
            <div className="text-center">
              <p className="text-xs font-semibold text-blue-200 uppercase tracking-wide">{teamName}</p>
              <p className="text-5xl font-black tabular-nums leading-none mt-1">{ourScore}</p>
            </div>
            <div className="text-blue-400 text-xl font-light pb-2">–</div>
            <div className="text-center">
              <p className="text-xs font-semibold text-blue-200 uppercase tracking-wide">{opponent}</p>
              <p className="text-5xl font-black tabular-nums leading-none mt-1">{theirScore}</p>
            </div>
          </div>

          {/* Set scores row */}
          <div className="flex items-center justify-center gap-2 mt-1.5">
            {allSets.map((s) => {
              const isActive = s.setNumber === setNumber;
              const displayOur = isActive ? ourScore : s.ourScore;
              const displayTheir = isActive ? theirScore : s.theirScore;
              return (
                <span
                  key={s.setNumber}
                  className={`text-xs tabular-nums px-2.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white font-bold'
                      : 'text-blue-300'
                  }`}
                >
                  S{s.setNumber} {displayOur}-{displayTheir}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
