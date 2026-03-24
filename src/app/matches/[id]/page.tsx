import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/database.types';

type MatchRow = Database['public']['Tables']['matches']['Row'];
type SetRow = Database['public']['Tables']['sets']['Row'];
type PlayerRow = Database['public']['Tables']['players']['Row'];
type RotationRow = Database['public']['Tables']['rotations']['Row'];

export default async function MatchOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch match
  const { data: match, error: matchErr } = await supabase
    .from('matches')
    .select('*')
    .eq('id', id)
    .single();

  if (matchErr || !match) throw new Error('Match not found');
  const m = match as MatchRow;

  // Fetch sets
  const { data: setsData } = await supabase
    .from('sets')
    .select('*')
    .eq('match_id', id)
    .order('set_number', { ascending: true });
  const sets = (setsData ?? []) as SetRow[];

  // Fetch players for this team
  const { data: playersData } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', m.team_id);
  const players = (playersData ?? []) as PlayerRow[];
  const playerMap = new Map(players.map((p) => [p.jersey_number, p]));

  // Fetch initial rotation (rotation_number 0 from set 1)
  let startingLineup: { position: number; jerseyNumber: number }[] = [];
  if (sets.length > 0) {
    const { data: rotData } = await supabase
      .from('rotations')
      .select('*')
      .eq('set_id', sets[0].id)
      .eq('rotation_number', 0)
      .single();

    if (rotData) {
      const rot = rotData as RotationRow;
      const positions = rot.positions as Record<string, number>;
      startingLineup = Object.entries(positions)
        .map(([pos, jersey]) => ({ position: Number(pos), jerseyNumber: jersey }))
        .sort((a, b) => a.position - b.position);
    }
  }

  // Compute match result
  const setsWon = sets.filter((s) => s.status === 'completed' && s.our_score > s.their_score).length;
  const setsLost = sets.filter((s) => s.status === 'completed' && s.their_score > s.our_score).length;
  const isWin = setsWon > setsLost;
  const isCompleted = m.status === 'completed';

  const formattedDate = new Date(m.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex-1 flex flex-col">
      <header className="bg-blue-700 text-white px-6 py-3 flex items-center gap-4">
        <Link href={`/teams/${m.team_id}`} className="hover:text-blue-200 transition-colors">&larr;</Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            {m.opponent_name ? `vs ${m.opponent_name}` : 'Match'}
          </h1>
          <p className="text-blue-200 text-xs">{formattedDate}{m.location ? ` \u00B7 ${m.location}` : ''}</p>
        </div>
      </header>

      <main className="flex-1 p-5 max-w-5xl mx-auto w-full space-y-6">
        {/* Match result banner */}
        {sets.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-5">
              {isCompleted && (
                <span className={`text-3xl font-extrabold ${isWin ? 'text-green-600' : 'text-red-500'}`}>
                  {isWin ? 'WIN' : 'LOSS'}
                </span>
              )}
              {!isCompleted && (
                <span className="text-3xl font-extrabold text-yellow-600">LIVE</span>
              )}
              <span className="text-4xl font-extrabold tabular-nums text-gray-900">
                {setsWon}–{setsLost}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!isCompleted && (
                <Link
                  href={`/matches/${id}/live`}
                  className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors min-h-[44px] flex items-center"
                >
                  Live Tracking
                </Link>
              )}
              <Link
                href={`/matches/${id}/lineup`}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors min-h-[44px] flex items-center"
              >
                Edit Lineup
              </Link>
            </div>
          </div>
        )}

        {sets.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
            <p className="text-gray-400 mb-4">No sets played yet</p>
            <Link
              href={`/matches/${id}/lineup`}
              className="inline-block px-5 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Set Starting Lineup
            </Link>
          </div>
        )}

        {/* Sets */}
        {sets.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Sets</h2>
            <div className="space-y-2">
              {sets.map((set) => {
                const won = set.our_score > set.their_score;
                const isLive = set.status === 'in-progress';
                return (
                  <Link
                    key={set.id}
                    href={`/matches/${id}/sets/${set.set_number}`}
                    className="flex items-center bg-white border border-gray-200 rounded-lg px-5 py-4 hover:border-blue-400 transition-colors"
                  >
                    <span className="text-sm font-semibold text-gray-500 w-16 shrink-0">
                      Set {set.set_number}
                    </span>

                    {isLive ? (
                      <span className="text-sm font-bold text-yellow-600 w-10 shrink-0">LIVE</span>
                    ) : (
                      <span className={`text-sm font-bold w-10 shrink-0 ${won ? 'text-green-600' : 'text-red-500'}`}>
                        {won ? 'W' : 'L'}
                      </span>
                    )}

                    <span className="text-2xl font-extrabold tabular-nums text-gray-900 w-24 text-center">
                      {set.our_score}–{set.their_score}
                    </span>

                    <span className="ml-auto text-gray-400 text-sm">&rsaquo;</span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Starting Lineup */}
        {startingLineup.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Starting Lineup</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {startingLineup.map(({ position, jerseyNumber }) => {
                const player = playerMap.get(jerseyNumber);
                return (
                  <div
                    key={position}
                    className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center gap-3"
                  >
                    <span className="text-xs font-semibold text-gray-400 w-8">P{position}</span>
                    {player ? (
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg font-bold text-blue-700">#{jerseyNumber}</span>
                        <span className="text-sm font-medium text-gray-700 truncate">
                          {player.first_name} {player.last_name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-gray-400">#{jerseyNumber}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Match Info */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Details</h2>
          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
            <div className="flex justify-between px-5 py-3">
              <span className="text-sm text-gray-500">Opponent</span>
              <span className="text-sm font-medium">{m.opponent_name || '—'}</span>
            </div>
            <div className="flex justify-between px-5 py-3">
              <span className="text-sm text-gray-500">Date</span>
              <span className="text-sm font-medium">{formattedDate}</span>
            </div>
            <div className="flex justify-between px-5 py-3">
              <span className="text-sm text-gray-500">Location</span>
              <span className="text-sm font-medium">{m.location || '—'}</span>
            </div>
            <div className="flex justify-between px-5 py-3">
              <span className="text-sm text-gray-500">Serving First</span>
              <span className="text-sm font-medium">{m.is_serving_first ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between px-5 py-3">
              <span className="text-sm text-gray-500">Status</span>
              <span className={`text-sm font-medium ${m.status === 'in-progress' ? 'text-yellow-600' : 'text-green-600'}`}>
                {m.status === 'in-progress' ? 'In Progress' : 'Completed'}
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
