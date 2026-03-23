import Link from "next/link";
import { getUserTeams } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { UserMenu } from "./user-menu";
import { CoachDashboardClient } from "./coach-dashboard-client";

export interface TeamSummary {
  teamId: string;
  teamName: string;
  role: string;
  playerCount: number;
  matchCount: number;
  liveCount: number;
  activeSeasonName: string | null;
  seasons: { id: string; name: string; isActive: boolean }[];
}

export default async function CoachDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { teams } = await getUserTeams();

  const teamSummaries: TeamSummary[] = await Promise.all(
    teams.map(async (t) => {
      const [{ count: playerCount }, { count: matchCount }, { data: seasons }] = await Promise.all([
        supabase.from('players').select('*', { count: 'exact', head: true }).eq('team_id', t.teamId),
        supabase.from('matches').select('*', { count: 'exact', head: true }).eq('team_id', t.teamId),
        supabase.from('seasons').select('id, name, is_active').eq('team_id', t.teamId).order('created_at', { ascending: false }),
      ]);

      const { count: liveCount } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', t.teamId)
        .eq('status', 'in-progress');

      const allSeasons = (seasons ?? []) as { id: string; name: string; is_active: boolean }[];
      const activeSeason = allSeasons.find((s) => s.is_active);

      return {
        ...t,
        playerCount: playerCount ?? 0,
        matchCount: matchCount ?? 0,
        liveCount: liveCount ?? 0,
        activeSeasonName: activeSeason?.name ?? null,
        seasons: allSeasons.map((s) => ({ id: s.id, name: s.name, isActive: s.is_active })),
      };
    })
  );

  return (
    <div className="flex-1 flex flex-col">
      <header className="bg-blue-700 text-white px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">VBTracker</h1>
          <p className="text-blue-200 text-[11px]">Coach Dashboard</p>
        </div>
        <UserMenu
          email={user.email ?? ''}
          activeTeamId={teams[0]?.teamId ?? ''}
          teams={teams.map((t) => ({ teamId: t.teamId, teamName: t.teamName }))}
        />
      </header>

      <CoachDashboardClient teams={teamSummaries} />
    </div>
  );
}
