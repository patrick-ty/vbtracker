import { getMatch } from '../../actions';
import { getPlayers } from '@/app/roster/actions';
import { LineupClient } from './lineup-client';

export default async function LineupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [match, players] = await Promise.all([getMatch(id), getPlayers()]);

  return <LineupClient match={match} players={players} />;
}
