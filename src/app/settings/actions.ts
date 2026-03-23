'use server';

import { revalidatePath } from 'next/cache';
import { requireTeam } from '@/lib/auth';

export async function updateTeamName(formData: FormData) {
  const { supabase, teamId } = await requireTeam();

  const name = String(formData.get('team_name')).trim();
  if (!name) throw new Error('Team name is required');

  const { error } = await supabase
    .from('teams')
    .update({ name })
    .eq('id', teamId);

  if (error) throw new Error(error.message);

  revalidatePath('/');
  revalidatePath('/settings');
}
