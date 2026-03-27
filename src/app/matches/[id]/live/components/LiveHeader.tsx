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
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        {/* Col 1: Exit */}
        <div style={{ width: 60, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Link href={`/matches/${match.id}`} className="text-blue-200 hover:text-white text-2xl font-bold transition-colors">
            &larr;
          </Link>
        </div>

        {/* Col 2: Event info + Set cards below */}
        <div style={{ flex: 1, padding: '0 24px', borderLeft: '1px solid rgba(96,165,250,0.3)', borderRight: '1px solid rgba(96,165,250,0.3)' }}>
          {eventName && (
            <p className="text-xl font-bold text-white leading-tight">{eventName}</p>
          )}
          <p className="text-sm text-blue-300 mt-1">
            {new Date(match.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>

          {/* Set cards — horizontal row */}
          {(() => {
            // TODO: remove mock sets after testing
            const mockSets = [
              { setNumber: 1, ourScore: 25, theirScore: 20, status: 'completed' as const },
              { setNumber: 2, ourScore: 19, theirScore: 25, status: 'completed' as const },
              { setNumber: 3, ourScore: 25, theirScore: 23, status: 'completed' as const },
              { setNumber: 4, ourScore: 22, theirScore: 25, status: 'completed' as const },
              ...allSets.map((s) => ({ ...s, setNumber: 5 })),
            ];
            const displaySets = mockSets.length > allSets.length ? mockSets : allSets;
            return displaySets.length > 0 && (
              <div className="flex gap-1.5 mt-2">
                {displaySets.map((s) => {
                  const isActive = s.setNumber === setNumber;
                  const displayOur = isActive ? ourScore : s.ourScore;
                  const displayTheir = isActive ? theirScore : s.theirScore;
                  return (
                    <div
                      key={s.setNumber}
                      className={`px-2 py-0.5 rounded text-[11px] tabular-nums whitespace-nowrap ${
                        isActive
                          ? 'bg-white text-blue-700 font-black'
                          : 'bg-blue-800/40 text-blue-300'
                      }`}
                    >
                      {isActive
                        ? <span>S{s.setNumber}</span>
                        : <><span className="font-semibold">S{s.setNumber}</span> {displayOur}-{displayTheir}</>
                      }
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Col 3: Scoreboard */}
        <div style={{ flex: 2, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="flex items-end gap-10">
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
        </div>
      </div>
    </div>
  );
}
