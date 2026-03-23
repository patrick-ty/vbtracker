'use server';

import { setActiveTeam } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function switchTeam(teamId: string) {
  await setActiveTeam(teamId);
  revalidatePath('/');
}
