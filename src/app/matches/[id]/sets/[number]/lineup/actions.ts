'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function saveSetLineup(setId: string, positions: Record<string, number>) {
  const supabase = await createClient();

  // Check if a rotation 0 already exists for this set
  const { data: existing } = await supabase
    .from('rotations')
    .select('id')
    .eq('set_id', setId)
    .eq('rotation_number', 0)
    .single();

  if (existing) {
    // Update existing
    const { error } = await supabase
      .from('rotations')
      .update({ positions })
      .eq('id', existing.id);
    if (error) throw new Error(error.message);
  } else {
    // Insert new
    const { error } = await supabase
      .from('rotations')
      .insert({ set_id: setId, rotation_number: 0, positions });
    if (error) throw new Error(error.message);
  }

  revalidatePath('/');
}
