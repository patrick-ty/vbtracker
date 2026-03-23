'use server';

import { revalidatePath } from 'next/cache';
import { requireTeam } from '@/lib/auth';
import type { Database } from '@/lib/database.types';

type SeasonRow = Database['public']['Tables']['seasons']['Row'];
type EventRow = Database['public']['Tables']['events']['Row'];

export async function getSeasons(): Promise<SeasonRow[]> {
  const { supabase, teamId } = await requireTeam();
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as SeasonRow[];
}

export async function getActiveSeason(): Promise<SeasonRow | null> {
  const { supabase, teamId } = await requireTeam();
  const { data } = await supabase
    .from('seasons')
    .select('*')
    .eq('team_id', teamId)
    .eq('is_active', true)
    .limit(1)
    .single();

  return (data as SeasonRow) ?? null;
}

export async function createSeason(formData: FormData) {
  const { supabase, teamId } = await requireTeam();

  const { error } = await supabase.from('seasons').insert({
    team_id: teamId,
    name: String(formData.get('name')).trim(),
    date_start: formData.get('date_start') ? String(formData.get('date_start')) : null,
    date_end: formData.get('date_end') ? String(formData.get('date_end')) : null,
    is_active: true,
  });

  if (error) throw new Error(error.message);
  revalidatePath('/');
}

export async function getEvents(seasonId: string): Promise<EventRow[]> {
  const { supabase } = await requireTeam();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('season_id', seasonId)
    .order('date_start', { ascending: false });

  if (error) throw new Error(error.message);
  return data as EventRow[];
}

export async function createEvent(formData: FormData) {
  const { supabase, seasonId } = await requireTeam();
  if (!seasonId) throw new Error('No active season. Create a season first.');

  const dateStart = String(formData.get('date_start') || new Date().toISOString().split('T')[0]);
  const dateEnd = formData.get('date_end') ? String(formData.get('date_end')) : null;

  const { error } = await supabase.from('events').insert({
    season_id: seasonId,
    name: String(formData.get('name')).trim(),
    date_start: dateStart,
    date_end: dateEnd,
    location: String(formData.get('location') || '').trim(),
  });

  if (error) throw new Error(error.message);
  revalidatePath('/');
}

export async function updateEvent(formData: FormData) {
  const { supabase } = await requireTeam();

  const id = String(formData.get('id'));
  const dateEnd = formData.get('date_end') ? String(formData.get('date_end')) : null;

  const { error } = await supabase
    .from('events')
    .update({
      name: String(formData.get('name')).trim(),
      date_start: String(formData.get('date_start')),
      date_end: dateEnd,
      location: String(formData.get('location') || '').trim(),
    })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/');
}
