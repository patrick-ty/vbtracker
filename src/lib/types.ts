export type TouchType = 'serve' | 'pass' | 'set' | 'attack' | 'block' | 'dig';

export type TouchScore = 0 | 1 | 2 | 3;

export type PlayerPosition = 'OH' | 'MB' | 'S' | 'OPP' | 'L' | 'DS';

export type MatchStatus = 'in-progress' | 'completed';

export type SetStatus = 'in-progress' | 'completed';

export interface Team {
  id: string;
  name: string;
  season: string;
  createdAt: string;
}

export interface Player {
  id: string;
  teamId: string;
  jerseyNumber: number;
  firstName: string;
  lastName: string;
  position: PlayerPosition;
  active: boolean;
}

export interface Match {
  id: string;
  teamId: string;
  opponentName: string;
  date: string;
  location: string;
  status: MatchStatus;
}

export interface GameSet {
  id: string;
  matchId: string;
  setNumber: number;
  ourScore: number;
  theirScore: number;
  status: SetStatus;
}

export interface Touch {
  id: string;
  rallyId: string;
  touchNumber: number;
  type: TouchType;
  score: TouchScore;
  playerJerseyNumber: number;
}

export interface Rally {
  id: string;
  setId: string;
  rallyNumber: number;
  pointWon: boolean;
  touches: Touch[];
}

export interface Rotation {
  id: string;
  setId: string;
  rotationNumber: number;
  positions: Record<number, number>; // position (1-6) → jersey number
}

// UI helpers
export const TOUCH_TYPE_LABELS: Record<TouchType, string> = {
  serve: 'SRV',
  pass: 'PAS',
  set: 'SET',
  attack: 'ATK',
  block: 'BLK',
  dig: 'DIG',
};

export const TOUCH_SCORE_LABELS: Record<TouchScore, string> = {
  0: 'Error',
  1: 'Poor',
  2: 'Good',
  3: 'Perfect',
};

export const POSITION_LABELS: Record<PlayerPosition, string> = {
  OH: 'Outside Hitter',
  MB: 'Middle Blocker',
  S: 'Setter',
  OPP: 'Opposite',
  L: 'Libero',
  DS: 'Defensive Specialist',
};

// Smart defaults: suggest touch type based on touch number in sequence
export function suggestTouchType(touchNumber: number, isServing: boolean): TouchType {
  if (touchNumber === 1) return isServing ? 'serve' : 'pass';
  if (touchNumber === 2) return 'set';
  return 'attack';
}
