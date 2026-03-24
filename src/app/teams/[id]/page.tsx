import Link from "next/link";
import { getUserTeams } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { UserMenu } from "../../user-menu";
import { SeasonSwitcher } from "./season-switcher";
import { DashboardClient } from "./dashboard-client";
import type { Database } from "@/lib/database.types";

type MatchRow = Database['public']['Tables']['matches']['Row'];
type EventRow = Database['public']['Tables']['events']['Row'];
type SeasonRow = Database['public']['Tables']['seasons']['Row'];

export default async function TeamDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: teamId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { teams } = await getUserTeams();

  // Get team info
  const { data: team } = await supabase
    .from('teams')
    .select('id, name')
    .eq('id', teamId)
    .single();

  if (!team) throw new Error('Team not found');

  // Get seasons for this team
  const { data: seasons } = await supabase
    .from('seasons')
    .select('*')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false });

  const allSeasons = (seasons ?? []) as SeasonRow[];
  const activeSeason = allSeasons.find((s) => s.is_active) ?? allSeasons[0] ?? null;
  const seasonId = activeSeason?.id ?? null;

  // Get events for active season
  let events: EventRow[] = [];
  if (seasonId) {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('season_id', seasonId)
      .order('date_start', { ascending: false });
    events = (data ?? []) as EventRow[];
  }

  // Get matches for this team in the active season
  let matches: MatchRow[] = [];
  if (seasonId) {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .eq('team_id', teamId)
      .eq('season_id', seasonId)
      .order('created_at', { ascending: false });
    matches = (data ?? []) as MatchRow[];
  }

  // Fetch sets for all matches to compute scores
  const matchIds = matches.map((m) => m.id);
  type SetRow = Database['public']['Tables']['sets']['Row'];
  let allSets: SetRow[] = [];
  if (matchIds.length > 0) {
    const { data } = await supabase
      .from('sets')
      .select('*')
      .in('match_id', matchIds);
    allSets = (data ?? []) as SetRow[];
  }

  // Build match summaries with W/L and set scores
  const setsByMatch = new Map<string, SetRow[]>();
  for (const s of allSets) {
    if (!setsByMatch.has(s.match_id)) setsByMatch.set(s.match_id, []);
    setsByMatch.get(s.match_id)!.push(s);
  }

  type MatchWithSets = MatchRow & {
    setsWon: number;
    setsLost: number;
    setScores: { our: number; their: number }[];
  };

  const matchesWithSets: MatchWithSets[] = matches.map((m) => {
    const sets = (setsByMatch.get(m.id) ?? []).sort((a, b) => a.set_number - b.set_number);
    const setsWon = sets.filter((s) => s.status === 'completed' && s.our_score > s.their_score).length;
    const setsLost = sets.filter((s) => s.status === 'completed' && s.their_score > s.our_score).length;
    return {
      ...m,
      setsWon,
      setsLost,
      setScores: sets.map((s) => ({ our: s.our_score, their: s.their_score })),
    };
  });

  // Group matches by event
  const matchesByEvent = new Map<string | null, MatchWithSets[]>();
  for (const match of matchesWithSets) {
    const key = match.event_id;
    if (!matchesByEvent.has(key)) matchesByEvent.set(key, []);
    matchesByEvent.get(key)!.push(match);
  }

  const eventGroups = events.map((event) => ({
    event,
    matches: matchesByEvent.get(event.id) ?? [],
  }));

  const ungroupedMatches = matchesByEvent.get(null) ?? [];

  return (
    <div className="flex-1 flex flex-col">
      <header className="bg-blue-700 text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="hover:text-blue-200 transition-colors">&larr;</Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{team.name}</h1>
            <SeasonSwitcher
              teamId={teamId}
              seasons={allSeasons.map((s) => ({ id: s.id, name: s.name, isActive: s.is_active }))}
              activeSeasonId={seasonId}
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href={`/teams/${teamId}/roster`} className="text-sm text-blue-200 hover:text-white transition-colors">
            Roster
          </Link>
          <UserMenu
            email={user.email ?? ''}
            activeTeamId={teamId}
            teams={teams.map((t) => ({ teamId: t.teamId, teamName: t.teamName }))}
          />
        </div>
      </header>

      <DashboardClient
        teamId={teamId}
        eventGroups={eventGroups}
        ungroupedMatches={ungroupedMatches}
        seasonId={seasonId}
      />
    </div>
  );
}
