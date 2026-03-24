'use client';

import Link from 'next/link';
import { useMatchStore } from '@/stores/matchStore';
import type { Database } from '@/lib/database.types';

type Match = Database['public']['Tables']['matches']['Row'];

interface LiveHeaderProps {
  match: Match;
  teamName: string;
  eventName: string | null;
}

export function LiveHeader({ match, teamName, eventName }: LiveHeaderProps) {
  const currentSet = useMatchStore((s) => s.currentSet);
  const currentRallyNumber = useMatchStore((s) => s.currentRallyNumber);

  const ourScore = currentSet?.ourScore ?? 0;
  const theirScore = currentSet?.theirScore ?? 0;
  const setNumber = currentSet?.setNumber ?? 1;
  const opponent = match.opponent_name || 'Opponent';

  return (
    <div className="bg-blue-700 text-white shrink-0">
      {/* Context bar */}
      <div className="flex items-center justify-between px-6 pt-2">
        <Link href={`/matches/${match.id}`} className="text-blue-300 hover:text-white font-medium">
          &larr; Exit
        </Link>
        <p className="text-xs text-blue-300">
          {eventName && <span>{eventName} &middot; </span>}
          {new Date(match.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </p>
        <span className="w-12" />
      </div>

      {/* Score */}
      <div className="flex items-end justify-center gap-10 py-2">
        <div className="text-center w-36">
          <p className="text-sm font-semibold text-blue-200 uppercase tracking-wide">{teamName}</p>
          <p className="text-5xl font-black tabular-nums leading-none mt-1">{ourScore}</p>
        </div>
        <div className="text-blue-400 text-2xl font-light pb-3">–</div>
        <div className="text-center w-36">
          <p className="text-sm font-semibold text-blue-200 uppercase tracking-wide">{opponent}</p>
          <p className="text-5xl font-black tabular-nums leading-none mt-1">{theirScore}</p>
        </div>
      </div>

      {/* Set / Rally bar */}
      <div className="bg-blue-800/50 px-6 py-1.5 flex items-center justify-center gap-6">
        <span className="text-sm text-blue-300">Set <span className="text-white font-bold">{setNumber}</span></span>
        <span className="text-blue-600">|</span>
        <span className="text-sm text-blue-300">Rally <span className="text-white font-bold">{currentRallyNumber}</span></span>
      </div>
    </div>
  );
}
