// Core enums and UI constants for the app
// Database row types are in database.types.ts

export type TouchType = 'serve' | 'pass' | 'set' | 'attack' | 'block' | 'dig';

export type TouchScore = 0 | 1 | 2 | 3;

export type PlayerPosition = 'OH' | 'MB' | 'S' | 'OPP' | 'L' | 'DS' | 'NONE';

// UI labels
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
  NONE: 'None',
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
