import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import { createClient } from '@/lib/supabase/client';
import type { TouchType, TouchScore } from '@/lib/types';

interface CurrentTouch {
  type: TouchType | null;
  score: TouchScore | null;
  playerJerseyNumber: number | null;
}

interface SetState {
  id: string;
  matchId: string;
  setNumber: number;
  ourScore: number;
  theirScore: number;
  status: 'in-progress' | 'completed';
}

interface MatchState {
  matchId: string | null;
  currentSet: SetState | null;
  currentRallyNumber: number;
  currentTouches: CurrentTouch[];
  isServing: boolean;
  rotations: Record<number, number>;

  // Actions
  startMatch: (matchId: string, isServing: boolean) => void;
  startSet: (setNumber: number) => Promise<void>;
  setRotation: (positions: Record<number, number>) => void;
  rotate: () => void;

  // Touch entry
  setCurrentTouchType: (type: TouchType) => void;
  setCurrentTouchScore: (score: TouchScore) => void;
  setCurrentTouchPlayer: (jerseyNumber: number) => void;
  addTouch: () => void;
  removeLastTouch: () => void;

  // Rally completion
  logRally: (pointWon: boolean) => Promise<void>;
  undoLastRally: () => Promise<void>;

  // Reset
  reset: () => void;
}

const EMPTY_TOUCH: CurrentTouch = { type: null, score: null, playerJerseyNumber: null };

export const useMatchStore = create<MatchState>((set, get) => ({
  matchId: null,
  currentSet: null,
  currentRallyNumber: 1,
  currentTouches: [],
  isServing: false,
  rotations: {},

  startMatch: (matchId, isServing) => {
    set({ matchId, isServing, currentRallyNumber: 1, currentTouches: [] });
  },

  startSet: async (setNumber) => {
    const { matchId } = get();
    if (!matchId) return;

    const supabase = createClient();
    const newSet: SetState = {
      id: uuid(),
      matchId,
      setNumber,
      ourScore: 0,
      theirScore: 0,
      status: 'in-progress',
    };

    await supabase.from('sets').insert({
      id: newSet.id,
      match_id: matchId,
      set_number: setNumber,
      our_score: 0,
      their_score: 0,
      status: 'in-progress',
    });

    set({ currentSet: newSet, currentRallyNumber: 1, currentTouches: [] });
  },

  setRotation: (positions) => {
    set({ rotations: positions });
  },

  rotate: () => {
    const { rotations } = get();
    const newRotations: Record<number, number> = {};
    newRotations[1] = rotations[2] ?? 0;
    newRotations[2] = rotations[3] ?? 0;
    newRotations[3] = rotations[4] ?? 0;
    newRotations[4] = rotations[5] ?? 0;
    newRotations[5] = rotations[6] ?? 0;
    newRotations[6] = rotations[1] ?? 0;
    set({ rotations: newRotations });
  },

  setCurrentTouchType: (type) => {
    const { currentTouches } = get();
    const touches = [...currentTouches];
    const idx = touches.length === 0 ? 0 : touches.length - 1;
    if (!touches[idx] || touches[idx].type !== null) {
      touches.push({ ...EMPTY_TOUCH, type });
    } else {
      touches[idx] = { ...touches[idx], type };
    }
    set({ currentTouches: touches });
  },

  setCurrentTouchScore: (score) => {
    const { currentTouches } = get();
    if (currentTouches.length === 0) return;
    const touches = [...currentTouches];
    touches[touches.length - 1] = { ...touches[touches.length - 1], score };
    set({ currentTouches: touches });
  },

  setCurrentTouchPlayer: (jerseyNumber) => {
    const { currentTouches } = get();
    if (currentTouches.length === 0) return;
    const touches = [...currentTouches];
    touches[touches.length - 1] = { ...touches[touches.length - 1], playerJerseyNumber: jerseyNumber };
    set({ currentTouches: touches });
  },

  addTouch: () => {
    const { currentTouches } = get();
    if (currentTouches.length >= 3) return;
    set({ currentTouches: [...currentTouches] });
  },

  removeLastTouch: () => {
    const { currentTouches } = get();
    if (currentTouches.length === 0) return;
    set({ currentTouches: currentTouches.slice(0, -1) });
  },

  logRally: async (pointWon) => {
    const { currentSet, currentRallyNumber, currentTouches, isServing, rotations } = get();
    if (!currentSet) return;

    const supabase = createClient();
    const rallyId = uuid();

    // Insert rally
    await supabase.from('rallies').insert({
      id: rallyId,
      set_id: currentSet.id,
      rally_number: currentRallyNumber,
      point_won: pointWon,
    });

    // Insert touches
    const touchInserts = currentTouches
      .filter((t) => t.type !== null && t.score !== null && t.playerJerseyNumber !== null)
      .map((t, i) => ({
        id: uuid(),
        rally_id: rallyId,
        touch_number: i + 1,
        type: t.type!,
        score: t.score!,
        player_jersey_number: t.playerJerseyNumber!,
      }));

    if (touchInserts.length > 0) {
      await supabase.from('touches').insert(touchInserts);
    }

    // Update set score
    const updatedSet = { ...currentSet };
    if (pointWon) {
      updatedSet.ourScore += 1;
    } else {
      updatedSet.theirScore += 1;
    }

    await supabase.from('sets').update({
      our_score: updatedSet.ourScore,
      their_score: updatedSet.theirScore,
    }).eq('id', currentSet.id);

    // Save rotation snapshot
    await supabase.from('rotations').insert({
      id: uuid(),
      set_id: currentSet.id,
      rotation_number: currentRallyNumber,
      positions: rotations,
    });

    // Check for sideout
    const sideout = pointWon && !isServing;
    const lostServe = !pointWon && isServing;

    set({
      currentSet: updatedSet,
      currentRallyNumber: currentRallyNumber + 1,
      currentTouches: [],
      isServing: sideout ? true : lostServe ? false : isServing,
    });
  },

  undoLastRally: async () => {
    const { currentSet, currentRallyNumber } = get();
    if (!currentSet || currentRallyNumber <= 1) return;

    const supabase = createClient();
    const prevRallyNumber = currentRallyNumber - 1;

    // Find the rally to undo
    const { data: rallies } = await supabase
      .from('rallies')
      .select('id, point_won')
      .eq('set_id', currentSet.id)
      .eq('rally_number', prevRallyNumber);

    if (!rallies || rallies.length === 0) return;
    const rally = rallies[0] as { id: string; point_won: boolean };

    // Delete touches and rally
    await supabase.from('touches').delete().eq('rally_id', rally.id);
    await supabase.from('rallies').delete().eq('id', rally.id);

    // Revert score
    const updatedSet = { ...currentSet };
    if (rally.point_won) {
      updatedSet.ourScore -= 1;
    } else {
      updatedSet.theirScore -= 1;
    }

    await supabase.from('sets').update({
      our_score: updatedSet.ourScore,
      their_score: updatedSet.theirScore,
    }).eq('id', currentSet.id);

    set({
      currentSet: updatedSet,
      currentRallyNumber: prevRallyNumber,
      currentTouches: [],
    });
  },

  reset: () => {
    set({
      matchId: null,
      currentSet: null,
      currentRallyNumber: 1,
      currentTouches: [],
      isServing: false,
      rotations: {},
    });
  },
}));
