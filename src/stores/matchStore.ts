import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import { createClient } from '@/lib/supabase/client';
import type { TouchType, TouchScore } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────

export interface Touch {
  playerJerseyNumber: number;
  type: TouchType;
  score: TouchScore;
}

export interface ServeData {
  serverJersey: number;
  score: TouchScore; // 3=ace, 2=in, 0=error
}

export interface CompletedRally {
  rallyNumber: number;
  pointWon: boolean;
  serve: ServeData | null;
  sequences: { isServe: boolean; touches: Touch[] }[];
  ourScore: number;
  theirScore: number;
}

interface SetState {
  id: string;
  matchId: string;
  setNumber: number;
  ourScore: number;
  theirScore: number;
}

type SubState =
  | null
  | { step: 'pick_in' }
  | { step: 'pick_out'; playerIn: number };

type EditTarget =
  | null
  | { kind: 'serve' }
  | { kind: 'touch'; index: number };

// ─── Store ────────────────────────────────────────────────────────────

interface MatchState {
  // Match state
  matchId: string | null;
  currentSet: SetState | null;
  currentRallyNumber: number;
  isServing: boolean;
  activeLineup: number[];

  // Rally log
  rallyLog: CompletedRally[];

  // Current rally
  serve: ServeData | null;
  currentSequenceNumber: number;
  completedTouches: Touch[];
  allSequences: { isServe: boolean; touches: Touch[] }[];

  // Selection state (replaces entryStep + pending)
  selectedPlayer: number | null;
  selectedType: TouchType | null;
  editTarget: EditTarget;
  subState: SubState;

  // Guards
  isSaving: boolean;
  lastServer: number | null;

  // Actions
  initMatch: (matchId: string, set: SetState, isServing: boolean, rallyNumber: number, lineup: number[], existingLog?: CompletedRally[]) => void;
  toggleServing: () => void;

  // Selection
  selectPlayer: (jersey: number) => void;
  selectType: (type: TouchType) => void;
  selectScore: (score: TouchScore) => void;
  clearSelection: () => void;

  // Editing
  editServe: () => void;
  editTouch: (index: number) => void;
  deleteTouch: () => void;
  deleteServe: () => void;
  editRally: (rallyIndex: number) => void;
  cancelEditRally: () => void;
  saveEditRally: () => Promise<void>;
  deleteRally: (rallyIndex: number) => Promise<void>;
  flipRallyPoint: (rallyIndex: number, pointWon: boolean) => Promise<void>;

  // Editing state
  editingRallyIndex: number | null; // index into rallyLog, null = editing current rally

  // Substitution
  startSub: () => void;
  selectSubIn: (jersey: number) => void;
  selectSubOut: (jersey: number) => void;
  cancelSub: () => void;

  // Lineup
  rotateLineup: () => void;

  // Sequence
  ballOver: () => void;

  // Rally
  logPoint: (pointWon: boolean) => Promise<void>;
  undoLastRally: () => Promise<void>;
  reset: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────

function isServePhase(state: { serve: ServeData | null; isServing: boolean }): boolean {
  return state.isServing && state.serve === null;
}

// ─── Create Store ─────────────────────────────────────────────────────

export const useMatchStore = create<MatchState>((set, get) => ({
  matchId: null,
  currentSet: null,
  currentRallyNumber: 1,
  isServing: false,
  activeLineup: [],
  rallyLog: [],
  serve: null,
  currentSequenceNumber: 1,
  completedTouches: [],
  allSequences: [],
  selectedPlayer: null,
  selectedType: null,
  editTarget: null,
  editingRallyIndex: null,
  subState: null,
  isSaving: false,
  lastServer: null,

  initMatch: (matchId, currentSet, isServing, rallyNumber, lineup, existingLog) => {
    set({
      matchId, currentSet, isServing,
      currentRallyNumber: rallyNumber,
      activeLineup: lineup,
      rallyLog: existingLog ?? [],
      serve: null, currentSequenceNumber: 1,
      completedTouches: [], allSequences: [],
      selectedPlayer: null, selectedType: null,
      editTarget: null, editingRallyIndex: null,
      subState: null, isSaving: false, lastServer: null,
    });
  },

  toggleServing: () => {
    const { serve } = get();
    // Only allow toggle if serve hasn't been recorded yet
    if (serve) return;
    set((s) => ({ isServing: !s.isServing }));
  },

  // ─── Selection Actions ──────────────────────────────────────────

  selectPlayer: (jersey) => {
    set({ selectedPlayer: jersey, selectedType: null });
  },

  selectType: (type) => {
    set({ selectedType: type });
  },

  selectScore: (score) => {
    const { selectedPlayer, selectedType, isServing, serve, completedTouches, allSequences, currentSequenceNumber, editTarget } = get();
    if (selectedPlayer === null) return;

    // ── Serve phase: committing a serve ──
    if (isServePhase({ serve: get().serve, isServing }) && !editTarget) {
      const newServe: ServeData = { serverJersey: selectedPlayer, score };
      set({ serve: newServe, selectedPlayer: null, selectedType: null });

      // Ace → auto our point
      if (score === 3) {
        get().logPoint(true);
        return;
      }
      // Error → auto their point
      if (score === 0) {
        get().logPoint(false);
        return;
      }
      // In → continue to touch entry, advance sequence
      set({ currentSequenceNumber: 2 });
      return;
    }

    // ── Editing serve ──
    if (editTarget?.kind === 'serve') {
      const newServe: ServeData = { serverJersey: selectedPlayer, score };
      set({ serve: newServe, selectedPlayer: null, selectedType: null, editTarget: null });
      return;
    }

    // ── Touch phase: committing a touch ──
    if (!selectedType) return;

    const newTouch: Touch = {
      playerJerseyNumber: selectedPlayer,
      type: selectedType,
      score,
    };

    // Editing existing touch
    if (editTarget?.kind === 'touch') {
      const updated = [...completedTouches];
      updated[editTarget.index] = newTouch;
      set({ completedTouches: updated, selectedPlayer: null, selectedType: null, editTarget: null });
      return;
    }

    // New touch — auto-manage sequences
    let newTouches = [...completedTouches];
    let newAllSeqs = [...allSequences];
    let newSeqNum = currentSequenceNumber;

    // If current sequence is full (3 touches), close it and start new one
    if (newTouches.length >= 3) {
      newAllSeqs.push({ isServe: false, touches: newTouches });
      newTouches = [];
      newSeqNum++;
    }

    newTouches.push(newTouch);

    set({
      completedTouches: newTouches,
      allSequences: newAllSeqs,
      currentSequenceNumber: newSeqNum,
      selectedPlayer: null,
      selectedType: null,
    });
  },

  clearSelection: () => {
    set({ selectedPlayer: null, selectedType: null, editTarget: null });
  },

  // ─── Edit Actions ───────────────────────────────────────────────

  editServe: () => {
    const { serve } = get();
    if (!serve) return;
    set({
      selectedPlayer: serve.serverJersey,
      selectedType: null,
      editTarget: { kind: 'serve' },
    });
  },

  editTouch: (index) => {
    const { completedTouches } = get();
    const touch = completedTouches[index];
    if (!touch) return;
    set({
      selectedPlayer: touch.playerJerseyNumber,
      selectedType: touch.type,
      editTarget: { kind: 'touch', index },
    });
  },

  deleteTouch: () => {
    const { editTarget, completedTouches } = get();
    if (!editTarget || editTarget.kind !== 'touch') return;
    const updated = completedTouches.filter((_, i) => i !== editTarget.index);
    set({
      completedTouches: updated,
      selectedPlayer: null,
      selectedType: null,
      editTarget: null,
    });
  },

  deleteServe: () => {
    const { editTarget } = get();
    if (!editTarget || editTarget.kind !== 'serve') return;
    set({
      serve: null,
      selectedPlayer: null,
      selectedType: null,
      editTarget: null,
    });
  },

  // ─── Rally Editing ───────────────────────────────────────────────

  editRally: (rallyIndex) => {
    const { rallyLog, serve, completedTouches } = get();
    const rally = rallyLog[rallyIndex];
    if (!rally) return;

    // Load the rally's data into the editing state
    const serveSeq = rally.sequences.find((s) => s.isServe);
    const touchSeqs = rally.sequences.filter((s) => !s.isServe);

    // All touch sequences except the last become allSequences, last becomes completedTouches
    const allSeqs = touchSeqs.slice(0, -1).map((s) => ({ isServe: false, touches: s.touches.map((t) => ({ ...t })) }));
    const lastSeq = touchSeqs[touchSeqs.length - 1];
    const lastTouches = lastSeq ? lastSeq.touches.map((t) => ({ ...t })) : [];

    set({
      editingRallyIndex: rallyIndex,
      serve: rally.serve ? { ...rally.serve } : null,
      isServing: rally.serve !== null,
      allSequences: allSeqs,
      completedTouches: lastTouches,
      currentSequenceNumber: touchSeqs.length + (rally.serve ? 1 : 0),
      selectedPlayer: null,
      selectedType: null,
      editTarget: null,
    });
  },

  cancelEditRally: () => {
    set({
      editingRallyIndex: null,
      serve: null,
      allSequences: [],
      completedTouches: [],
      currentSequenceNumber: 1,
      selectedPlayer: null,
      selectedType: null,
      editTarget: null,
    });
  },

  saveEditRally: async () => {
    const { editingRallyIndex, rallyLog, serve, completedTouches, allSequences, currentSet, isSaving } = get();
    if (editingRallyIndex === null || !currentSet || isSaving) return;
    set({ isSaving: true });

    const rally = rallyLog[editingRallyIndex];
    const supabase = createClient();

    // Delete old sequences and touches for this rally
    // First find the rally in DB by set_id + rally_number
    const { data: dbRallies } = await supabase
      .from('rallies')
      .select('id')
      .eq('set_id', currentSet.id)
      .eq('rally_number', rally.rallyNumber);

    if (dbRallies && dbRallies.length > 0) {
      const rallyId = dbRallies[0].id;

      // Delete old sequences + touches
      const { data: oldSeqs } = await supabase
        .from('sequences')
        .select('id')
        .eq('rally_id', rallyId);

      if (oldSeqs && oldSeqs.length > 0) {
        await supabase.from('touches').delete().in('sequence_id', oldSeqs.map((s) => s.id));
        await supabase.from('sequences').delete().eq('rally_id', rallyId);
      }

      // Rebuild sequences
      const seqsToSave: { isServe: boolean; touches: typeof completedTouches }[] = [];

      if (serve) {
        seqsToSave.push({
          isServe: true,
          touches: [{ playerJerseyNumber: serve.serverJersey, type: 'serve' as any, score: serve.score }],
        });
      }
      seqsToSave.push(...allSequences);
      if (completedTouches.length > 0) {
        seqsToSave.push({ isServe: false, touches: completedTouches });
      }

      for (let i = 0; i < seqsToSave.length; i++) {
        const seq = seqsToSave[i];
        const seqId = uuid();
        await supabase.from('sequences').insert({
          id: seqId,
          rally_id: rallyId,
          sequence_number: i + 1,
          is_serve: seq.isServe,
        });
        if (seq.touches.length > 0) {
          await supabase.from('touches').insert(
            seq.touches.map((t, j) => ({
              id: uuid(),
              sequence_id: seqId,
              touch_number: j + 1,
              type: t.type,
              score: t.score,
              player_jersey_number: t.playerJerseyNumber,
            }))
          );
        }
      }

      // Update rally log entry
      const updatedLog = [...rallyLog];
      updatedLog[editingRallyIndex] = {
        ...rally,
        serve,
        sequences: seqsToSave,
      };

      set({
        rallyLog: updatedLog,
        editingRallyIndex: null,
        serve: null,
        allSequences: [],
        completedTouches: [],
        currentSequenceNumber: 1,
        selectedPlayer: null,
        selectedType: null,
        editTarget: null,
        isSaving: false,
      });
    } else {
      set({ isSaving: false });
    }
  },

  deleteRally: async (rallyIndex) => {
    const { rallyLog, currentSet, currentRallyNumber, isSaving } = get();
    if (!currentSet || isSaving) return;
    const rally = rallyLog[rallyIndex];
    if (!rally) return;

    set({ isSaving: true });
    const supabase = createClient();

    // Find rally in DB
    const { data: dbRallies } = await supabase
      .from('rallies')
      .select('id')
      .eq('set_id', currentSet.id)
      .eq('rally_number', rally.rallyNumber);

    if (dbRallies && dbRallies.length > 0) {
      const rallyId = dbRallies[0].id;

      // Delete sequences + touches
      const { data: seqs } = await supabase
        .from('sequences')
        .select('id')
        .eq('rally_id', rallyId);

      if (seqs && seqs.length > 0) {
        await supabase.from('touches').delete().in('sequence_id', seqs.map((s) => s.id));
        await supabase.from('sequences').delete().eq('rally_id', rallyId);
      }

      await supabase.from('rallies').delete().eq('id', rallyId);
    }

    // Adjust score
    const scoreDelta = rally.pointWon ? -1 : 0;
    const theirDelta = rally.pointWon ? 0 : -1;
    const newOurScore = currentSet.ourScore + scoreDelta;
    const newTheirScore = currentSet.theirScore + theirDelta;

    await supabase.from('sets').update({
      our_score: newOurScore,
      their_score: newTheirScore,
    }).eq('id', currentSet.id);

    // Rebuild rally log with corrected running scores
    const newLog = rallyLog.filter((_, i) => i !== rallyIndex);
    let runOurs = 0;
    let runTheirs = 0;
    for (const r of newLog) {
      if (r.pointWon) runOurs++;
      else runTheirs++;
      r.ourScore = runOurs;
      r.theirScore = runTheirs;
    }

    set({
      rallyLog: newLog,
      currentSet: { ...currentSet, ourScore: newOurScore, theirScore: newTheirScore },
      editingRallyIndex: null,
      isSaving: false,
    });
  },

  flipRallyPoint: async (rallyIndex, pointWon) => {
    const { rallyLog, currentSet, isSaving } = get();
    if (!currentSet || isSaving) return;
    const rally = rallyLog[rallyIndex];
    if (!rally || rally.pointWon === pointWon) return; // No change needed

    set({ isSaving: true });
    const supabase = createClient();

    // Update rally in DB
    const { data: dbRallies } = await supabase
      .from('rallies')
      .select('id')
      .eq('set_id', currentSet.id)
      .eq('rally_number', rally.rallyNumber);

    if (dbRallies && dbRallies.length > 0) {
      await supabase.from('rallies').update({ point_won: pointWon }).eq('id', dbRallies[0].id);
    }

    // Adjust score: flip = -1 from old winner, +1 to new winner
    const newOurScore = currentSet.ourScore + (pointWon ? 1 : -1);
    const newTheirScore = currentSet.theirScore + (pointWon ? -1 : 1);

    await supabase.from('sets').update({
      our_score: newOurScore,
      their_score: newTheirScore,
    }).eq('id', currentSet.id);

    // Update rally log
    const newLog = [...rallyLog];
    newLog[rallyIndex] = { ...rally, pointWon };

    // Recalculate running scores
    let runOurs = 0;
    let runTheirs = 0;
    for (const r of newLog) {
      if (r.pointWon) runOurs++;
      else runTheirs++;
      r.ourScore = runOurs;
      r.theirScore = runTheirs;
    }

    set({
      rallyLog: newLog,
      currentSet: { ...currentSet, ourScore: newOurScore, theirScore: newTheirScore },
      editingRallyIndex: null,
      isSaving: false,
    });
  },

  // ─── Substitution ───────────────────────────────────────────────

  startSub: () => {
    set({ subState: { step: 'pick_in' }, selectedPlayer: null, selectedType: null });
  },

  selectSubIn: (jersey) => {
    set({ subState: { step: 'pick_out', playerIn: jersey } });
  },

  selectSubOut: (jersey) => {
    const { currentSet, currentRallyNumber, activeLineup, subState } = get();
    if (!currentSet || !subState || subState.step !== 'pick_out') return;

    const playerIn = subState.playerIn;
    const newLineup = activeLineup.map((j) => j === jersey ? playerIn : j);

    // Save to DB
    const supabase = createClient();
    supabase.from('substitutions').insert({
      set_id: currentSet.id,
      rally_number: currentRallyNumber,
      player_out: jersey,
      player_in: playerIn,
    }).then(({ error }) => {
      if (error) console.error('Failed to save substitution:', error);
    });

    set({ activeLineup: newLineup, subState: null });
  },

  cancelSub: () => {
    set({ subState: null });
  },

  // ─── Sequence Management ─────────────────────────────────────────

  // Rotation: 1→6→5→4→3→2→1 (standard volleyball clockwise)
  // Position mapping: player in pos 1 moves to pos 6, pos 6→5, pos 5→4, pos 4→3, pos 3→2, pos 2→1
  rotateLineup: () => {
    const { activeLineup } = get();
    if (activeLineup.length !== 6) return;

    // activeLineup is ordered by court positions [pos4, pos3, pos2, pos5, pos6, pos1]
    // After rotation: pos4←pos5, pos3←pos4, pos2←pos3, pos5←pos6, pos6←pos1, pos1←pos2
    const [p4, p3, p2, p5, p6, p1] = activeLineup;
    const rotated = [p5, p4, p3, p6, p1, p2];
    set({ activeLineup: rotated });
  },

  ballOver: () => {
    const { completedTouches, allSequences, currentSequenceNumber } = get();
    if (completedTouches.length === 0) return;

    set({
      allSequences: [...allSequences, { isServe: false, touches: completedTouches }],
      completedTouches: [],
      currentSequenceNumber: currentSequenceNumber + 1,
      selectedPlayer: null,
      selectedType: null,
    });
  },

  // ─── Rally Persistence ──────────────────────────────────────────

  logPoint: async (pointWon) => {
    const { currentSet, currentRallyNumber, serve, completedTouches, allSequences, isServing, isSaving } = get();
    if (!currentSet || isSaving) return;
    set({ isSaving: true });

    const supabase = createClient();
    const rallyId = uuid();

    // Insert rally
    await supabase.from('rallies').insert({
      id: rallyId,
      set_id: currentSet.id,
      rally_number: currentRallyNumber,
      point_won: pointWon,
      server_jersey_number: serve?.serverJersey ?? null,
    });

    // Build sequences to save
    const seqsToSave: { isServe: boolean; touches: Touch[] }[] = [];

    if (serve) {
      seqsToSave.push({
        isServe: true,
        touches: [{ playerJerseyNumber: serve.serverJersey, type: 'serve' as TouchType, score: serve.score }],
      });
    }

    seqsToSave.push(...allSequences);

    if (completedTouches.length > 0) {
      seqsToSave.push({ isServe: false, touches: completedTouches });
    }

    // Save sequences and touches
    for (let i = 0; i < seqsToSave.length; i++) {
      const seq = seqsToSave[i];
      const seqId = uuid();

      await supabase.from('sequences').insert({
        id: seqId,
        rally_id: rallyId,
        sequence_number: i + 1,
        is_serve: seq.isServe,
      });

      if (seq.touches.length > 0) {
        await supabase.from('touches').insert(
          seq.touches.map((t, j) => ({
            id: uuid(),
            sequence_id: seqId,
            touch_number: j + 1,
            type: t.type,
            score: t.score,
            player_jersey_number: t.playerJerseyNumber,
          }))
        );
      }
    }

    // Update score
    const newOurScore = currentSet.ourScore + (pointWon ? 1 : 0);
    const newTheirScore = currentSet.theirScore + (pointWon ? 0 : 1);

    await supabase.from('sets').update({
      our_score: newOurScore,
      their_score: newTheirScore,
    }).eq('id', currentSet.id);

    // Win point → we serve next. Lose point → we receive.
    const newIsServing = pointWon;

    // Add to rally log
    const completedRally: CompletedRally = {
      rallyNumber: currentRallyNumber,
      pointWon,
      serve,
      sequences: seqsToSave,
      ourScore: newOurScore,
      theirScore: newTheirScore,
    };

    set({
      rallyLog: [...get().rallyLog, completedRally],
      currentSet: { ...currentSet, ourScore: newOurScore, theirScore: newTheirScore },
      currentRallyNumber: currentRallyNumber + 1,
      serve: null,
      currentSequenceNumber: 1,
      completedTouches: [],
      allSequences: [],
      selectedPlayer: null,
      selectedType: null,
      editTarget: null,
      isSaving: false,
      isServing: newIsServing,
      lastServer: serve?.serverJersey ?? get().lastServer,
    });
  },

  undoLastRally: async () => {
    const { currentSet, currentRallyNumber } = get();
    if (!currentSet || currentRallyNumber <= 1) return;

    const supabase = createClient();
    const prevRallyNumber = currentRallyNumber - 1;

    const { data: rallies } = await supabase
      .from('rallies')
      .select('id, point_won')
      .eq('set_id', currentSet.id)
      .eq('rally_number', prevRallyNumber);

    if (!rallies || rallies.length === 0) return;
    const rally = rallies[0] as { id: string; point_won: boolean };

    // Delete sequences and touches
    const { data: seqs } = await supabase
      .from('sequences')
      .select('id')
      .eq('rally_id', rally.id);

    if (seqs && seqs.length > 0) {
      const seqIds = seqs.map((s) => s.id);
      await supabase.from('touches').delete().in('sequence_id', seqIds);
      await supabase.from('sequences').delete().eq('rally_id', rally.id);
    }

    await supabase.from('rallies').delete().eq('id', rally.id);

    await supabase.from('substitutions').delete()
      .eq('set_id', currentSet.id)
      .eq('rally_number', prevRallyNumber);

    const newOurScore = currentSet.ourScore - (rally.point_won ? 1 : 0);
    const newTheirScore = currentSet.theirScore - (rally.point_won ? 0 : 1);

    await supabase.from('sets').update({
      our_score: newOurScore,
      their_score: newTheirScore,
    }).eq('id', currentSet.id);

    set({
      rallyLog: get().rallyLog.slice(0, -1),
      currentSet: { ...currentSet, ourScore: newOurScore, theirScore: newTheirScore },
      currentRallyNumber: prevRallyNumber,
      serve: null, currentSequenceNumber: 1,
      completedTouches: [], allSequences: [],
      selectedPlayer: null, selectedType: null,
      editTarget: null,
    });
  },

  reset: () => {
    set({
      matchId: null, currentSet: null, currentRallyNumber: 1,
      isServing: false, activeLineup: [], rallyLog: [],
      serve: null, currentSequenceNumber: 1,
      completedTouches: [], allSequences: [],
      selectedPlayer: null, selectedType: null,
      editTarget: null, editingRallyIndex: null, subState: null,
      isSaving: false, lastServer: null,
    });
  },
}));

// ─── Selectors ────────────────────────────────────────────────────────

export function usePhase() {
  const serve = useMatchStore((s) => s.serve);
  const isServing = useMatchStore((s) => s.isServing);
  return isServing && !serve ? 'serve_entry' : 'touch_entry';
}
