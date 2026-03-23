import { getPlayers } from './actions';
import { RosterClient } from './roster-client';

export default async function RosterPage() {
  const players = await getPlayers();

  return <RosterClient initialPlayers={players} />;
}
