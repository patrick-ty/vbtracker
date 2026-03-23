'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function createTeam(formData: FormData) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Unauthorized');

  const teamName = String(formData.get('team_name')).trim();
  if (!teamName) throw new Error('Team name is required');

  const seasonName = String(formData.get('season_name') || '').trim() || '2025-2026';

  // Create team
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({ name: teamName, created_by: user.id })
    .select('id')
    .single();

  if (teamError) throw new Error(teamError.message);

  // Add user as head coach
  const { error: memberError } = await supabase
    .from('team_members')
    .insert({ team_id: team.id, user_id: user.id, role: 'head_coach' });

  if (memberError) throw new Error(memberError.message);

  // Create first season
  const { error: seasonError } = await supabase
    .from('seasons')
    .insert({ team_id: team.id, name: seasonName, is_active: true });

  if (seasonError) throw new Error(seasonError.message);

  redirect(`/teams/${team.id}`);
}
