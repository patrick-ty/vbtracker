import Dexie, { type EntityTable } from 'dexie';
import type { Team, Player, Match, GameSet, Rally, Touch, Rotation } from './types';

const db = new Dexie('vbtracker') as Dexie & {
  teams: EntityTable<Team, 'id'>;
  players: EntityTable<Player, 'id'>;
  matches: EntityTable<Match, 'id'>;
  sets: EntityTable<GameSet, 'id'>;
  rallies: EntityTable<Rally, 'id'>;
  touches: EntityTable<Touch, 'id'>;
  rotations: EntityTable<Rotation, 'id'>;
};

db.version(1).stores({
  teams: 'id, name',
  players: 'id, teamId, jerseyNumber',
  matches: 'id, teamId, date, status',
  sets: 'id, matchId, setNumber',
  rallies: 'id, setId, rallyNumber',
  touches: 'id, rallyId, touchNumber',
  rotations: 'id, setId, rotationNumber',
});

export { db };
