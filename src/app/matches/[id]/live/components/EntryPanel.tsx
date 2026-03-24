'use client';

import type { Database } from '@/lib/database.types';
import { ServeReceiveToggle } from './ServeReceiveToggle';
import { PlayerGrid } from './PlayerGrid';
import { TypeRow } from './TypeRow';
import { ScoreRow } from './ScoreRow';
import { PointButtons } from './PointButtons';
import { UtilityRow } from './UtilityRow';

type Player = Database['public']['Tables']['players']['Row'];

interface EntryPanelProps {
  players: Player[];
  positions: Record<string, number> | null;
}

export function EntryPanel({ players, positions }: EntryPanelProps) {
  return (
    <div className="flex flex-col gap-4 p-5 h-full overflow-y-auto">
      <ServeReceiveToggle />
      <PlayerGrid players={players} positions={positions} />
      <TypeRow />
      <ScoreRow />
      <PointButtons />
      <UtilityRow />
    </div>
  );
}
