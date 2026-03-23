import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import { db } from '@/lib/db';
import type { Touch, TouchType, TouchScore, GameSet, Rally, Rotation } from '@/lib/types';

interface CurrentTouch {
  type: TouchType | null;
  score: TouchScore | null;
  playerJerseyNumber: number | null;
}

interface MatchState {
  matchId: string | null;
  currentSet: GameSet | null;
  currentRallyNumber: number;
  currentTouches: CurrentTouch[];
  isServing: boolean;
  rotations: Record<number, number>; // position (1-6) → jersey number

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
    const newSet: GameSet = {
      id: uuid(),
      matchId,
      setNumber,
      ourScore: 0,
      theirScore: 0,
      status: 'in-progress',
    };
    await db.sets.add(newSet);
    set({ currentSet: newSet, currentRallyNumber: 1, currentTouches: [] });
  },

  setRotation: (positions) => {
    set({ rotations: positions });
  },

  rotate: () => {
    const { rotations } = get();
    // Standard volleyball rotation: each player moves one position
    // 1→6, 6→5, 5→4, 4→3, 3→2, 2→1
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
      // Start new touch entry
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
    const idx = touches.length - 1;
    touches[idx] = { ...touches[idx], score };
    set({ currentTouches: touches });
  },

  setCurrentTouchPlayer: (jerseyNumber) => {
    const { currentTouches } = get();
    if (currentTouches.length === 0) return;
    const touches = [...currentTouches];
    const idx = touches.length - 1;
    touches[idx] = { ...touches[idx], playerJerseyNumber: jerseyNumber };
    set({ currentTouches: touches });
  },

  addTouch: () => {
    // Finalize current touch and prepare for next
    const { currentTouches } = get();
    if (currentTouches.length >= 3) return;
    // The current touch is already in the array, just signal readiness for next
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

    const rallyId = uuid();
    const touches: Touch[] = currentTouches
      .filter((t) => t.type !== null && t.score !== null && t.playerJerseyNumber !== null)
      .map((t, i) => ({
        id: uuid(),
        rallyId,
        touchNumber: i + 1,
        type: t.type!,
        score: t.score!,
        playerJerseyNumber: t.playerJerseyNumber!,
      }));

    const rally: Rally = {
      id: rallyId,
      setId: currentSet.id,
      rallyNumber: currentRallyNumber,
      pointWon,
      touches,
    };

    // Save rally and touches to DB
    await db.rallies.add(rally);
    await db.touches.bulkAdd(touches);

    // Update set score
    const updatedSet = { ...currentSet };
    if (pointWon) {
      updatedSet.ourScore += 1;
    } else {
      updatedSet.theirScore += 1;
    }
    await db.sets.update(currentSet.id, {
      ourScore: updatedSet.ourScore,
      theirScore: updatedSet.theirScore,
    });

    // Save rotation snapshot
    const rotationCount = await db.rotations.where('setId').equals(currentSet.id).count();
    await db.rotations.add({
      id: uuid(),
      setId: currentSet.id,
      rotationNumber: rotationCount + 1,
      positions: { ...rotations },
    });

    // Check for sideout: we won the point while they were serving
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

    const prevRallyNumber = currentRallyNumber - 1;
    const rallies = await db.rallies
      .where('setId')
      .equals(currentSet.id)
      .filter((r) => r.rallyNumber === prevRallyNumber)
      .toArray();

    if (rallies.length === 0) return;

    const rally = rallies[0];

    // Remove touches
    await db.touches.where('rallyId').equals(rally.id).delete();
    // Remove rally
    await db.rallies.delete(rally.id);

    // Revert score
    const updatedSet = { ...currentSet };
    if (rally.pointWon) {
      updatedSet.ourScore -= 1;
    } else {
      updatedSet.theirScore -= 1;
    }
    await db.sets.update(currentSet.id, {
      ourScore: updatedSet.ourScore,
      theirScore: updatedSet.theirScore,
    });

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
