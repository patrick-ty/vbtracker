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
      <div className="flex items-center">
        {/* Col 1: Exit */}
        <div className="w-16 shrink-0 text-center">
          <Link href={`/matches/${match.id}`} className="text-blue-300 hover:text-white text-sm font-medium">
            &larr;
          </Link>
        </div>

        {/* Col 2: Middle — split into event info + scoreboard */}
        <div className="flex-1 flex items-center">
          {/* Left half: Event + Date */}
          <div className="w-1/3 pr-6 flex flex-col justify-center">
            {eventName && (
              <p className="text-xl font-bold text-white leading-tight">{eventName}</p>
            )}
            <p className="text-sm text-blue-300 mt-1">
              {new Date(match.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          {/* Right half: Scoreboard + sets */}
          <div className="w-2/3">
            {/* Score */}
            <div className="flex items-end justify-center gap-8">
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

            {/* Set scores below scoreboard */}
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

        {/* Col 3: spacer to balance */}
        <div className="w-16 shrink-0" />
      </div>
    </div>
  );
}
