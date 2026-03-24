import { createClient } from '@/lib/supabase/server';
import { LiveEntryClient } from './live-entry-client';
import type { Database } from '@/lib/database.types';

type MatchRow = Database['public']['Tables']['matches']['Row'];
type SetRow = Database['public']['Tables']['sets']['Row'];
type PlayerRow = Database['public']['Tables']['players']['Row'];
type RotationRow = Database['public']['Tables']['rotations']['Row'];
type SubRow = Database['public']['Tables']['substitutions']['Row'];

export default async function LiveEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: matchId } = await params;
  const supabase = await createClient();

  // Fetch match
  const { data: match } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single();
  if (!match) throw new Error('Match not found');
  const m = match as MatchRow;

  // Fetch event name if match belongs to one
  let eventName: string | null = null;
  if (m.event_id) {
    const { data: event } = await supabase
      .from('events')
      .select('name')
      .eq('id', m.event_id)
      .single();
    eventName = event?.name ?? null;
  }

  // Fetch team name
  const { data: team } = await supabase
    .from('teams')
    .select('name')
    .eq('id', m.team_id)
    .single();

  // Fetch sets
  const { data: setsData } = await supabase
    .from('sets')
    .select('*')
    .eq('match_id', matchId)
    .order('set_number', { ascending: true });
  const sets = (setsData ?? []) as SetRow[];

  // Find or create the current set
  let currentSet = sets.find((s) => s.status === 'in-progress') ?? sets[sets.length - 1] ?? null;

  if (!currentSet) {
    const { data: newSet } = await supabase
      .from('sets')
      .insert({
        match_id: matchId,
        set_number: 1,
        our_score: 0,
        their_score: 0,
        status: 'in-progress',
      })
      .select('*')
      .single();
    currentSet = newSet as SetRow;
  }

  // Load existing rallies with sequences and touches for the rally log
  const { data: existingRallies } = await supabase
    .from('rallies')
    .select('*')
    .eq('set_id', currentSet!.id)
    .order('rally_number', { ascending: true });
  const rallies = (existingRallies ?? []) as (MatchRow & { id: string; rally_number: number; point_won: boolean; server_jersey_number: number | null })[];

  // Fetch sequences for these rallies
  const rallyIds = rallies.map((r) => r.id);
  type SeqRow = { id: string; rally_id: string; sequence_number: number; is_serve: boolean };
  type TouchRowLive = { id: string; sequence_id: string; touch_number: number; type: string; score: number; player_jersey_number: number };

  let existingSeqs: SeqRow[] = [];
  let existingTouches: TouchRowLive[] = [];

  if (rallyIds.length > 0) {
    const { data: seqData } = await supabase
      .from('sequences')
      .select('*')
      .in('rally_id', rallyIds)
      .order('sequence_number', { ascending: true });
    existingSeqs = (seqData ?? []) as SeqRow[];

    const seqIds = existingSeqs.map((s) => s.id);
    if (seqIds.length > 0) {
      const { data: touchData } = await supabase
        .from('touches')
        .select('*')
        .in('sequence_id', seqIds)
        .order('touch_number', { ascending: true });
      existingTouches = (touchData ?? []) as TouchRowLive[];
    }
  }

  // Group into rally log format
  const touchesBySeq = new Map<string, TouchRowLive[]>();
  for (const t of existingTouches) {
    if (!touchesBySeq.has(t.sequence_id)) touchesBySeq.set(t.sequence_id, []);
    touchesBySeq.get(t.sequence_id)!.push(t);
  }

  const seqsByRally = new Map<string, SeqRow[]>();
  for (const s of existingSeqs) {
    if (!seqsByRally.has(s.rally_id)) seqsByRally.set(s.rally_id, []);
    seqsByRally.get(s.rally_id)!.push(s);
  }

  let runningOurs = 0;
  let runningTheirs = 0;

  const initialRallyLog = rallies.map((r) => {
    if (r.point_won) runningOurs++;
    else runningTheirs++;

    const seqs = seqsByRally.get(r.id) ?? [];

    // Extract serve score from the serve sequence's touch
    let serveScore: 0 | 1 | 2 | 3 = 0;
    const serveSeq = seqs.find((s) => s.is_serve);
    if (serveSeq) {
      const serveTouches = touchesBySeq.get(serveSeq.id) ?? [];
      if (serveTouches.length > 0) {
        serveScore = serveTouches[0].score as 0 | 1 | 2 | 3;
      }
    }

    return {
      rallyNumber: r.rally_number,
      pointWon: r.point_won,
      serve: r.server_jersey_number ? { serverJersey: r.server_jersey_number, score: serveScore } : null,
      sequences: seqs.map((s) => ({
        isServe: s.is_serve,
        touches: (touchesBySeq.get(s.id) ?? []).map((t) => ({
          playerJerseyNumber: t.player_jersey_number,
          type: t.type as any,
          score: t.score as 0 | 1 | 2 | 3,
        })),
      })),
      ourScore: runningOurs,
      theirScore: runningTheirs,
    };
  });

  const rallyCount = rallies.length;

  // Fetch players
  const { data: playersData } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', m.team_id)
    .order('jersey_number', { ascending: true });
  const players = (playersData ?? []) as PlayerRow[];

  // Compute active lineup:
  // Start with rotation 0 (starting lineup), then apply substitutions
  const { data: rotData } = await supabase
    .from('rotations')
    .select('*')
    .eq('set_id', currentSet!.id)
    .eq('rotation_number', 0)
    .single();

  let activeLineup: number[] = [];
  if (rotData) {
    const positions = (rotData as RotationRow).positions as Record<string, number>;
    activeLineup = Object.values(positions);
  }

  // Apply substitutions in order
  const { data: subsData } = await supabase
    .from('substitutions')
    .select('*')
    .eq('set_id', currentSet!.id)
    .order('rally_number', { ascending: true });
  const subs = (subsData ?? []) as SubRow[];

  for (const sub of subs) {
    activeLineup = activeLineup.map((j) => j === sub.player_out ? sub.player_in : j);
  }

  return (
    <LiveEntryClient
      match={m}
      teamName={team?.name ?? ''}
      eventName={eventName}
      currentSet={{
        id: currentSet!.id,
        matchId: matchId,
        setNumber: currentSet!.set_number,
        ourScore: currentSet!.our_score,
        theirScore: currentSet!.their_score,
      }}
      nextRallyNumber={rallyCount + 1}
      isServingFirst={m.is_serving_first}
      players={players}
      activeLineup={activeLineup}
      initialRallyLog={initialRallyLog}
    />
  );
}
