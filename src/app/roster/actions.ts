'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/database.types';

type PlayerRow = Database['public']['Tables']['players']['Row'];
type PlayerInsert = Database['public']['Tables']['players']['Insert'];
type PlayerUpdate = Database['public']['Tables']['players']['Update'];

async function getAuthUserId() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Unauthorized');
  return { supabase, userId: user.id };
}

export async function getPlayers(): Promise<PlayerRow[]> {
  const { supabase } = await getAuthUserId();
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('jersey_number', { ascending: true });

  if (error) throw new Error(error.message);
  return data as PlayerRow[];
}

export async function uploadAvatar(file: File, playerId: string): Promise<string> {
  const { supabase, userId } = await getAuthUserId();

  const path = `${userId}/${playerId}.png`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true });

  if (error) throw new Error(error.message);

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(path);

  return publicUrl;
}

export async function addPlayer(formData: FormData) {
  const { supabase, userId } = await getAuthUserId();

  const player: PlayerInsert = {
    user_id: userId,
    jersey_number: Number(formData.get('jersey_number')),
    first_name: String(formData.get('first_name')).trim(),
    last_name: String(formData.get('last_name')).trim(),
    position: String(formData.get('position')) as PlayerInsert['position'],
    avatar_url: formData.get('avatar_url') ? String(formData.get('avatar_url')) : null,
  };

  const { error } = await supabase.from('players').insert(player);
  if (error) throw new Error(error.message);

  revalidatePath('/roster');
}

export async function updatePlayer(formData: FormData) {
  const { supabase } = await getAuthUserId();

  const id = String(formData.get('id'));
  const avatarUrl = formData.get('avatar_url');
  const updates: PlayerUpdate = {
    jersey_number: Number(formData.get('jersey_number')),
    first_name: String(formData.get('first_name')).trim(),
    last_name: String(formData.get('last_name')).trim(),
    position: String(formData.get('position')) as PlayerUpdate['position'],
    ...(avatarUrl !== null && { avatar_url: avatarUrl ? String(avatarUrl) : null }),
  };

  const { error } = await supabase.from('players').update(updates).eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath('/roster');
}

export async function deletePlayer(formData: FormData) {
  const { supabase } = await getAuthUserId();

  const id = String(formData.get('id'));
  const { error } = await supabase.from('players').delete().eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath('/roster');
}
