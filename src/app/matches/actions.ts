'use server';

import { revalidatePath } from 'next/cache';
import { requireTeam } from '@/lib/auth';
import type { Database } from '@/lib/database.types';

type MatchRow = Database['public']['Tables']['matches']['Row'];

export async function getMatches(): Promise<MatchRow[]> {
  const { supabase } = await requireTeam();
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as MatchRow[];
}

export async function getMatch(id: string): Promise<MatchRow> {
  const { supabase } = await requireTeam();
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data as MatchRow;
}

export async function quickCreateMatch(eventId?: string): Promise<string> {
  const { supabase, teamId, seasonId } = await requireTeam();

  const { data, error } = await supabase
    .from('matches')
    .insert({
      team_id: teamId,
      season_id: seasonId,
      event_id: eventId ?? null,
      opponent_name: '',
      is_serving_first: true,
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return data.id;
}

export async function updateMatch(formData: FormData) {
  const { supabase } = await requireTeam();

  const id = String(formData.get('id'));
  const { error } = await supabase
    .from('matches')
    .update({
      opponent_name: String(formData.get('opponent_name') || '').trim(),
      date: String(formData.get('date')),
      location: String(formData.get('location') || '').trim(),
      is_serving_first: formData.get('is_serving_first') === 'true',
    })
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/');
  revalidatePath(`/matches/${id}`);
}

export async function saveLineup(matchId: string, positions: Record<string, number>) {
  const { supabase } = await requireTeam();

  // Create set 1 for this match
  const { data: setData, error: setError } = await supabase
    .from('sets')
    .insert({
      match_id: matchId,
      set_number: 1,
      our_score: 0,
      their_score: 0,
      status: 'in-progress',
    })
    .select('id')
    .single();

  if (setError) throw new Error(setError.message);

  // Save initial rotation if positions were assigned
  if (Object.keys(positions).length > 0) {
    const { error: rotError } = await supabase.from('rotations').insert({
      set_id: setData.id,
      rotation_number: 0,
      positions,
    });

    if (rotError) throw new Error(rotError.message);
  }

  revalidatePath('/');
  revalidatePath(`/matches/${matchId}`);
}
