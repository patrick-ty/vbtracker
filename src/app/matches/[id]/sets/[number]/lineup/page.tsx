import { createClient } from '@/lib/supabase/server';
import { SetLineupClient } from './set-lineup-client';
import type { Database } from '@/lib/database.types';

type MatchRow = Database['public']['Tables']['matches']['Row'];
type SetRow = Database['public']['Tables']['sets']['Row'];
type PlayerRow = Database['public']['Tables']['players']['Row'];
type RotationRow = Database['public']['Tables']['rotations']['Row'];

export default async function SetLineupPage({
  params,
}: {
  params: Promise<{ id: string; number: string }>;
}) {
  const { id: matchId, number: setNumberStr } = await params;
  const setNumber = Number(setNumberStr);
  const supabase = await createClient();

  const { data: match } = await supabase.from('matches').select('*').eq('id', matchId).single();
  if (!match) throw new Error('Match not found');
  const m = match as MatchRow;

  const { data: setData } = await supabase
    .from('sets')
    .select('*')
    .eq('match_id', matchId)
    .eq('set_number', setNumber)
    .single();
  if (!setData) throw new Error('Set not found');
  const set = setData as SetRow;

  const { data: playersData } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', m.team_id)
    .order('jersey_number', { ascending: true });
  const players = (playersData ?? []) as PlayerRow[];

  // Get existing lineup (rotation 0) for this set
  const { data: rotData } = await supabase
    .from('rotations')
    .select('*')
    .eq('set_id', set.id)
    .eq('rotation_number', 0)
    .single();

  const existingPositions = rotData
    ? (rotData as RotationRow).positions as Record<string, number>
    : null;

  return (
    <SetLineupClient
      matchId={matchId}
      setId={set.id}
      setNumber={setNumber}
      opponentName={m.opponent_name}
      players={players}
      existingPositions={existingPositions}
    />
  );
}
