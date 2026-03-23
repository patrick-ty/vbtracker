import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { TeamRole } from '@/lib/database.types';

const TEAM_COOKIE = 'vbt-active-team';

export interface TeamContext {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  teamId: string;
  teamName: string;
  role: TeamRole;
  seasonId: string | null;
}

export interface TeamMembership {
  teamId: string;
  teamName: string;
  role: TeamRole;
}

/**
 * Get all teams the current user belongs to.
 */
export async function getUserTeams(): Promise<{ supabase: Awaited<ReturnType<typeof createClient>>; userId: string; teams: TeamMembership[] }> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Unauthorized');

  const { data: memberships } = await supabase
    .from('team_members')
    .select('team_id, role')
    .eq('user_id', user.id);

  if (!memberships || memberships.length === 0) {
    return { supabase, userId: user.id, teams: [] };
  }

  // Fetch team names
  const teamIds = memberships.map((m) => m.team_id);
  const { data: teams } = await supabase
    .from('teams')
    .select('id, name')
    .in('id', teamIds);

  const teamMap = new Map((teams ?? []).map((t) => [t.id, t.name]));

  return {
    supabase,
    userId: user.id,
    teams: memberships.map((m) => ({
      teamId: m.team_id,
      teamName: teamMap.get(m.team_id) ?? '',
      role: m.role as TeamRole,
    })),
  };
}

/**
 * Get the current user's active team context.
 * Uses a cookie to remember which team is selected.
 * Returns null if the user has no teams (needs onboarding).
 */
export async function getTeamForUser(): Promise<TeamContext | null> {
  const { supabase, userId, teams } = await getUserTeams();
  if (teams.length === 0) return null;

  // Check cookie for active team
  const cookieStore = await cookies();
  const activeTeamId = cookieStore.get(TEAM_COOKIE)?.value;
  const active = teams.find((t) => t.teamId === activeTeamId) ?? teams[0];

  // Get active season for this team
  const { data: season } = await supabase
    .from('seasons')
    .select('id')
    .eq('team_id', active.teamId)
    .eq('is_active', true)
    .limit(1)
    .single();

  return {
    supabase,
    userId,
    teamId: active.teamId,
    teamName: active.teamName,
    role: active.role,
    seasonId: season?.id ?? null,
  };
}

/**
 * Require team context — throws if not onboarded.
 */
export async function requireTeam(): Promise<TeamContext> {
  const ctx = await getTeamForUser();
  if (!ctx) throw new Error('No team found. Please complete onboarding.');
  return ctx;
}

/**
 * Set the active team (called from team switcher).
 */
export async function setActiveTeam(teamId: string) {
  const cookieStore = await cookies();
  cookieStore.set(TEAM_COOKIE, teamId, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  });
}
