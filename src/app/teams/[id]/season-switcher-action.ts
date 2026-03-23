'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function setActiveSeason(teamId: string, seasonId: string) {
  const supabase = await createClient();

  // Deactivate all seasons for this team
  await supabase
    .from('seasons')
    .update({ is_active: false })
    .eq('team_id', teamId);

  // Activate the selected one
  const { error } = await supabase
    .from('seasons')
    .update({ is_active: true })
    .eq('id', seasonId);

  if (error) throw new Error(error.message);

  revalidatePath(`/teams/${teamId}`);
}
