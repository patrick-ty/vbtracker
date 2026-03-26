'use client';

import { useEffect } from 'react';
import { useMatchStore } from '@/stores/matchStore';
import type { CompletedRally } from '@/stores/matchStore';
import type { Database } from '@/lib/database.types';
import { LiveHeader } from './components/LiveHeader';
import { RallyLog } from './components/RallyLog';
import { EntryPanel } from './components/EntryPanel';

type Player = Database['public']['Tables']['players']['Row'];
type Match = Database['public']['Tables']['matches']['Row'];

interface SetInit {
  id: string;
  matchId: string;
  setNumber: number;
  ourScore: number;
  theirScore: number;
}

export interface SetSummary {
  setNumber: number;
  ourScore: number;
  theirScore: number;
  status: 'in-progress' | 'completed';
}

interface LiveEntryClientProps {
  match: Match;
  teamName: string;
  eventName: string | null;
  currentSet: SetInit;
  allSets: SetSummary[];
  nextRallyNumber: number;
  isServingFirst: boolean;
  players: Player[];
  activeLineup: number[];
  positions: Record<string, number> | null;
  initialRallyLog: CompletedRally[];
}

export function LiveEntryClient({
  match,
  teamName,
  eventName,
  currentSet,
  allSets,
  nextRallyNumber,
  isServingFirst,
  players,
  activeLineup,
  positions,
  initialRallyLog,
}: LiveEntryClientProps) {
  const initMatch = useMatchStore((s) => s.initMatch);

  useEffect(() => {
    initMatch(match.id, currentSet, isServingFirst, nextRallyNumber, activeLineup, initialRallyLog);
  }, []);

  return (
    <div className="flex flex-col bg-gray-100 select-none overflow-hidden" style={{ height: '100dvh' }}>
      {/* Header: scoreboard + context */}
      <LiveHeader match={match} teamName={teamName} eventName={eventName} allSets={allSets} />

      {/* Two-column body */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Rally Log (40%) */}
        <div className="w-[40%] border-r border-gray-200 bg-white">
          <RallyLog />
        </div>

        {/* Right: Entry Panel (60%) */}
        <div className="w-[60%] bg-gray-50">
          <EntryPanel players={players} positions={positions} />
        </div>
      </div>
    </div>
  );
}
