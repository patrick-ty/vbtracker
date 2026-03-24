// Core enums and UI constants for the app
// Database row types are in database.types.ts

export type TouchType = 'serve' | 'pass' | 'set' | 'attack' | 'block' | 'dig';

export type TouchScore = 0 | 1 | 2 | 3;

export type PlayerPosition = 'OH' | 'MB' | 'S' | 'OPP' | 'L' | 'DS' | 'NONE';

// Touch types available during rally entry (excludes serve — serve is handled separately)
export const RALLY_TOUCH_TYPES: TouchType[] = ['pass', 'set', 'attack', 'block', 'dig'];

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

// Score options vary by touch type
export type ScoreOption = { value: TouchScore; label: string };

export function getScoreOptions(type: TouchType | null): ScoreOption[] {
  if (!type) return [];

  switch (type) {
    case 'serve':
      return [
        { value: 3, label: 'Ace' },
        { value: 2, label: 'In' },
        { value: 0, label: 'Error' },
      ];
    case 'block':
    case 'dig':
      return [
        { value: 3, label: 'Success' },
        { value: 0, label: 'Fail' },
      ];
    default: // pass, set, attack
      return [
        { value: 3, label: 'Perfect' },
        { value: 2, label: 'Good' },
        { value: 1, label: 'Poor' },
        { value: 0, label: 'Error' },
      ];
  }
}

// Color for score values
export function getScoreColor(score: TouchScore): string {
  switch (score) {
    case 3: return 'green';
    case 2: return 'blue';
    case 1: return 'yellow';
    case 0: return 'red';
  }
}

// Display label for a serve score
export function serveResultLabel(score: TouchScore): string {
  if (score === 3) return 'Ace';
  if (score === 0) return 'Error';
  return 'In';
}
