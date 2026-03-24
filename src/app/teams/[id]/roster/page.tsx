import { getPlayers } from '@/app/roster/actions';
import { RosterClient } from '@/app/roster/roster-client';
import { createClient } from '@/lib/supabase/server';

export default async function TeamRosterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: teamId } = await params;
  const supabase = await createClient();

  // Get team name for the header
  const { data: team } = await supabase
    .from('teams')
    .select('name')
    .eq('id', teamId)
    .single();

  const players = await getPlayers(teamId);

  return <RosterClient initialPlayers={players} teamId={teamId} teamName={team?.name ?? 'Team'} />;
}
