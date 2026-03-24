import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/database.types';

type MatchRow = Database['public']['Tables']['matches']['Row'];
type SetRow = Database['public']['Tables']['sets']['Row'];
type RallyRow = Database['public']['Tables']['rallies']['Row'];
type TouchRow = Database['public']['Tables']['touches']['Row'];
type PlayerRow = Database['public']['Tables']['players']['Row'];
type RotationRow = Database['public']['Tables']['rotations']['Row'];

export default async function SetDetailPage({
  params,
}: {
  params: Promise<{ id: string; number: string }>;
}) {
  const { id: matchId, number: setNumberStr } = await params;
  const setNumber = Number(setNumberStr);
  const supabase = await createClient();

  // Fetch match
  const { data: match } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single();
  if (!match) throw new Error('Match not found');
  const m = match as MatchRow;

  // Fetch the set
  const { data: setData } = await supabase
    .from('sets')
    .select('*')
    .eq('match_id', matchId)
    .eq('set_number', setNumber)
    .single();
  if (!setData) throw new Error('Set not found');
  const set = setData as SetRow;

  // Fetch all sets for this match (for navigation)
  const { data: allSetsData } = await supabase
    .from('sets')
    .select('set_number, our_score, their_score, status')
    .eq('match_id', matchId)
    .order('set_number', { ascending: true });
  const allSets = (allSetsData ?? []) as Pick<SetRow, 'set_number' | 'our_score' | 'their_score' | 'status'>[];

  // Fetch rallies for this set
  const { data: ralliesData } = await supabase
    .from('rallies')
    .select('*')
    .eq('set_id', set.id)
    .order('rally_number', { ascending: true });
  const rallies = (ralliesData ?? []) as RallyRow[];

  // Fetch sequences and touches for all rallies in this set
  const rallyIds = rallies.map((r) => r.id);
  type SeqRow = Database['public']['Tables']['sequences']['Row'];

  let sequences: SeqRow[] = [];
  let touches: TouchRow[] = [];

  if (rallyIds.length > 0) {
    const { data: seqData } = await supabase
      .from('sequences')
      .select('*')
      .in('rally_id', rallyIds)
      .order('sequence_number', { ascending: true });
    sequences = (seqData ?? []) as SeqRow[];

    const seqIds = sequences.map((s) => s.id);
    if (seqIds.length > 0) {
      const { data: touchData } = await supabase
        .from('touches')
        .select('*')
        .in('sequence_id', seqIds)
        .order('touch_number', { ascending: true });
      touches = (touchData ?? []) as TouchRow[];
    }
  }

  // Group sequences by rally, touches by sequence
  const seqsByRally = new Map<string, SeqRow[]>();
  for (const s of sequences) {
    if (!seqsByRally.has(s.rally_id)) seqsByRally.set(s.rally_id, []);
    seqsByRally.get(s.rally_id)!.push(s);
  }

  const touchesBySeq = new Map<string, TouchRow[]>();
  for (const t of touches) {
    if (!touchesBySeq.has(t.sequence_id)) touchesBySeq.set(t.sequence_id, []);
    touchesBySeq.get(t.sequence_id)!.push(t);
  }

  // Helper: get all touches for a rally (flattened across sequences)
  function getTouchesForRally(rallyId: string): TouchRow[] {
    const seqs = seqsByRally.get(rallyId) ?? [];
    return seqs.flatMap((s) => touchesBySeq.get(s.id) ?? []);
  }

  // Fetch players for this team
  const { data: playersData } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', m.team_id);
  const players = (playersData ?? []) as PlayerRow[];
  const playerMap = new Map(players.map((p) => [p.jersey_number, p]));

  // Fetch rotations for this set
  const { data: rotData } = await supabase
    .from('rotations')
    .select('*')
    .eq('set_id', set.id)
    .order('rotation_number', { ascending: true });
  const rotations = (rotData ?? []) as RotationRow[];

  const won = set.our_score > set.their_score;
  const isLive = set.status === 'in-progress';

  // Get starting lineup from rotation 0
  const startingRotation = rotations.find((r) => r.rotation_number === 0);
  const startingLineup = startingRotation
    ? Object.entries(startingRotation.positions as Record<string, number>)
        .map(([pos, jersey]) => ({ position: Number(pos), jerseyNumber: jersey }))
        .sort((a, b) => a.position - b.position)
    : [];

  // Build score progression from rallies
  let runningOurs = 0;
  let runningTheirs = 0;
  const scoreProgression = rallies.map((r) => {
    if (r.point_won) runningOurs++;
    else runningTheirs++;
    return { rally: r.rally_number, ours: runningOurs, theirs: runningTheirs, pointWon: r.point_won };
  });

  // Compute per-player stats from touches
  const playerStats = new Map<number, { touches: number; byType: Record<string, number>; avgScore: number; totalScore: number }>();
  for (const t of touches) {
    if (!playerStats.has(t.player_jersey_number)) {
      playerStats.set(t.player_jersey_number, { touches: 0, byType: {}, avgScore: 0, totalScore: 0 });
    }
    const stat = playerStats.get(t.player_jersey_number)!;
    stat.touches++;
    stat.totalScore += t.score;
    stat.avgScore = stat.totalScore / stat.touches;
    stat.byType[t.type] = (stat.byType[t.type] ?? 0) + 1;
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="bg-blue-700 text-white px-6 py-3 flex items-center gap-4">
        <Link href={`/matches/${matchId}`} className="hover:text-blue-200 transition-colors">&larr;</Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight">
            Set {setNumber}
          </h1>
          <p className="text-blue-200 text-xs">
            {m.opponent_name ? `vs ${m.opponent_name}` : 'Match'}
          </p>
        </div>
      </header>

      {/* Set navigation pills */}
      <div className="bg-white border-b border-gray-200 px-6 py-2 flex items-center gap-2">
        {allSets.map((s) => (
          <Link
            key={s.set_number}
            href={`/matches/${matchId}/sets/${s.set_number}`}
            className={`px-4 py-1.5 rounded-full text-sm font-medium tabular-nums transition-colors ${
              s.set_number === setNumber
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            S{s.set_number}: {s.our_score}–{s.their_score}
          </Link>
        ))}
      </div>

      <main className="flex-1 p-5 max-w-5xl mx-auto w-full space-y-6">
        {/* Score banner */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {isLive ? (
              <span className="text-2xl font-extrabold text-yellow-600">LIVE</span>
            ) : (
              <span className={`text-2xl font-extrabold ${won ? 'text-green-600' : 'text-red-500'}`}>
                {won ? 'WON' : 'LOST'}
              </span>
            )}
            <span className="text-5xl font-extrabold tabular-nums text-gray-900">
              {set.our_score}–{set.their_score}
            </span>
            <span className="text-sm text-gray-400">
              {rallies.length} rallies
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isLive && (
              <Link
                href={`/matches/${matchId}/live`}
                className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors min-h-[44px] flex items-center"
              >
                Live Tracking
              </Link>
            )}
            <Link
              href={`/matches/${matchId}/sets/${setNumber}/lineup`}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors min-h-[44px] flex items-center"
            >
              {startingLineup.length > 0 ? 'Edit Lineup' : 'Set Lineup'}
            </Link>
          </div>
        </div>

        {/* Rally timeline */}
        {rallies.length > 0 ? (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Rally Timeline</h2>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[60px_40px_1fr_60px] text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-2 border-b border-gray-100">
                <span>Rally</span>
                <span></span>
                <span>Touches</span>
                <span className="text-right">Score</span>
              </div>
              {rallies.map((rally) => {
                const rallyTouches = getTouchesForRally(rally.id);
                const prog = scoreProgression.find((s) => s.rally === rally.rally_number);
                return (
                  <div
                    key={rally.id}
                    className="grid grid-cols-[60px_40px_1fr_60px] items-center px-5 py-3 border-b border-gray-50 last:border-b-0"
                  >
                    <span className="text-sm tabular-nums text-gray-500 font-medium">
                      #{rally.rally_number}
                    </span>
                    <span className={`text-sm font-bold ${rally.point_won ? 'text-green-600' : 'text-red-500'}`}>
                      {rally.point_won ? '+' : '−'}
                    </span>
                    <div className="flex gap-2 flex-wrap">
                      {rallyTouches.map((t) => {
                        const player = playerMap.get(t.player_jersey_number);
                        return (
                          <span
                            key={t.id}
                            className="inline-flex items-center gap-1 text-xs bg-gray-100 rounded px-2 py-0.5"
                          >
                            <span className="font-bold text-blue-700">#{t.player_jersey_number}</span>
                            <span className="text-gray-500">{t.type}</span>
                            <span className={`font-semibold ${
                              t.score >= 2 ? 'text-green-600' : t.score === 0 ? 'text-red-500' : 'text-gray-600'
                            }`}>
                              {t.score}
                            </span>
                          </span>
                        );
                      })}
                      {rallyTouches.length === 0 && (
                        <span className="text-xs text-gray-300">No touch data</span>
                      )}
                    </div>
                    <span className="text-sm tabular-nums font-medium text-right text-gray-700">
                      {prog?.ours}–{prog?.theirs}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400">
            <p className="text-lg mb-1">No rally data yet</p>
            <p className="text-sm">Rally details will appear here once tracked during live play.</p>
          </div>
        )}

        {/* Player Stats (only if touches exist) */}
        {playerStats.size > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Player Stats</h2>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1fr_80px_80px_100px] text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-2 border-b border-gray-100">
                <span>Player</span>
                <span className="text-center">Touches</span>
                <span className="text-center">Avg Score</span>
                <span className="text-center">Breakdown</span>
              </div>
              {Array.from(playerStats.entries())
                .sort((a, b) => b[1].touches - a[1].touches)
                .map(([jersey, stat]) => {
                  const player = playerMap.get(jersey);
                  return (
                    <div
                      key={jersey}
                      className="grid grid-cols-[1fr_80px_80px_100px] items-center px-5 py-3 border-b border-gray-50 last:border-b-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-700">#{jersey}</span>
                        <span className="text-sm text-gray-700">
                          {player ? `${player.first_name} ${player.last_name}` : `Player #${jersey}`}
                        </span>
                      </div>
                      <span className="text-center text-sm font-semibold tabular-nums">{stat.touches}</span>
                      <span className="text-center text-sm font-semibold tabular-nums">{stat.avgScore.toFixed(1)}</span>
                      <div className="flex gap-1 justify-center flex-wrap">
                        {Object.entries(stat.byType).map(([type, count]) => (
                          <span key={type} className="text-[10px] bg-gray-100 rounded px-1.5 py-0.5">
                            {type} {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        )}

        {/* Rotations */}
        {rotations.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Rotations</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {rotations.map((rot) => {
                const positions = rot.positions as Record<string, number>;
                return (
                  <div key={rot.id} className="bg-white border border-gray-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-400 mb-2">
                      {rot.rotation_number === 0 ? 'Starting' : `Rotation ${rot.rotation_number}`}
                    </p>
                    <div className="grid grid-cols-3 gap-1 text-center text-xs">
                      {[4, 3, 2, 5, 6, 1].map((pos) => {
                        const jersey = positions[String(pos)];
                        const player = jersey ? playerMap.get(jersey) : undefined;
                        return (
                          <div key={pos} className="bg-gray-50 rounded py-1">
                            {jersey ? (
                              <span className="font-bold text-blue-700">#{jersey}</span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
