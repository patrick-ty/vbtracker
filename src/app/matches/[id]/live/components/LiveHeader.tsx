'use client';

import Link from 'next/link';
import { useMatchStore } from '@/stores/matchStore';
import type { Database } from '@/lib/database.types';

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
    <div className="bg-blue-700 text-white shrink-0 py-3">
      <div className="grid grid-cols-[60px_1fr_2fr] items-center">
        {/* Col 1: Exit */}
        <div className="flex items-center justify-center">
          <Link href={`/matches/${match.id}`} className="text-blue-300 hover:text-white text-sm font-medium">
            &larr;
          </Link>
        </div>

        {/* Col 2: Event info */}
        <div className="flex flex-col justify-center px-6 border-l border-r border-blue-500/30">
          {eventName && (
            <p className="text-xl font-bold text-white leading-tight">{eventName}</p>
          )}
          <p className="text-sm text-blue-300 mt-1">
            {new Date(match.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Col 3: Scoreboard */}
        <div className="px-6">
          <div className="flex items-end justify-center gap-10">
            <div className="text-center">
              <p className="text-sm font-semibold text-blue-200 uppercase tracking-wide">{teamName}</p>
              <p className="text-5xl font-black tabular-nums leading-none mt-1">{ourScore}</p>
            </div>
            <div className="text-blue-400 text-2xl font-light pb-3">–</div>
            <div className="text-center">
              <p className="text-sm font-semibold text-blue-200 uppercase tracking-wide">{opponent}</p>
              <p className="text-5xl font-black tabular-nums leading-none mt-1">{theirScore}</p>
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
                  className={`text-sm tabular-nums px-3 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white font-bold'
                      : 'text-blue-300 font-medium'
                  }`}
                >
                  {isActive ? `Set ${s.setNumber}` : `S${s.setNumber} ${displayOur}–${displayTheir}`}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
