import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import { createClient } from '@/lib/supabase/client';
import type { TouchType, TouchScore } from '@/lib/types';

interface Touch {
  playerJerseyNumber: number;
  type: TouchType;
  score: TouchScore;
}

interface ServeData {
  serverJersey: number;
  score: TouchScore;
}

interface SetState {
  id: string;
  matchId: string;
  setNumber: number;
  ourScore: number;
  theirScore: number;
}

type EntryStep =
  | 'serve_or_receive' // Start of rally: are we serving or receiving?
  | 'serve_player'     // Pick who's serving
  | 'serve_score'      // ACE / IN / ERROR
  | 'outcome'          // After any action: Our Point / Their Point / Continue
  | 'player'           // Pick player for touch
  | 'type'             // Pick touch type
  | 'score'            // Rate the touch
  | 'sub_out'          // Sub: pick player coming in
  | 'sub_in';          // Sub: pick player going out

interface CompletedRally {
  rallyNumber: number;
  pointWon: boolean;
  serve: ServeData | null;
  sequences: { isServe: boolean; touches: Touch[] }[];
  ourScore: number;
  theirScore: number;
}

interface MatchState {
  matchId: string | null;
  currentSet: SetState | null;
  currentRallyNumber: number;
  isServing: boolean;
  activeLineup: number[];

  // Completed rallies for display
  rallyLog: CompletedRally[];

  // Current rally
  serve: ServeData | null;
  currentSequenceNumber: number;
  completedTouches: Touch[];
  allSequences: { isServe: boolean; touches: Touch[] }[];
  pendingPlayer: number | null;
  pendingType: TouchType | null;
  entryStep: EntryStep;

  // Guards
  isSaving: boolean;

  // Sub
  subIn: number | null;
  lastServer: number | null;

  // Editing
  editingTouchIndex: number | null; // null = not editing, -1 = editing serve, 0+ = touch index

  // Actions
  initMatch: (matchId: string, set: SetState, isServing: boolean, rallyNumber: number, lineup: number[], existingLog?: CompletedRally[]) => void;
  chooseServe: () => void;
  chooseReceive: () => void;
  selectServer: (jerseyNumber: number) => void;
  scoreServe: (score: TouchScore) => void;
  selectPlayer: (jerseyNumber: number) => void;
  selectType: (type: TouchType) => void;
  selectScore: (score: TouchScore) => void;
  clearPending: () => void;
  continuePlay: () => void;
  editServe: () => void;
  editTouch: (index: number) => void;
  startSub: () => void;
  selectSubIn: (jerseyNumber: number) => void;
  selectSubOut: (jerseyNumber: number) => void;
  cancelSub: () => void;
  logPoint: (pointWon: boolean) => Promise<void>;
  undoLastRally: () => Promise<void>;
  reset: () => void;
}

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
  pendingPlayer: null,
  pendingType: null,
  entryStep: 'serve_or_receive',
  editingTouchIndex: null,
  isSaving: false,
  subIn: null,
  lastServer: null,

  initMatch: (matchId, currentSet, isServing, rallyNumber, lineup, existingLog) => {
    set({
      matchId, currentSet, isServing,
      currentRallyNumber: rallyNumber,
      activeLineup: lineup,
      rallyLog: existingLog ?? [],
      serve: null,
      currentSequenceNumber: 1,
      completedTouches: [],
      allSequences: [],
      pendingPlayer: null,
      pendingType: null,
      entryStep: 'serve_or_receive',
      editingTouchIndex: null,
      isSaving: false,
      subIn: null,
      lastServer: null,
    });
  },

  chooseServe: () => {
    set({ isServing: true, entryStep: 'serve_player' });
  },

  chooseReceive: () => {
    set({ isServing: false, entryStep: 'player' });
  },

  selectServer: (jerseyNumber) => {
    set({ pendingPlayer: jerseyNumber, entryStep: 'serve_score' });
  },

  scoreServe: (score) => {
    const { pendingPlayer, editingTouchIndex, completedTouches, allSequences } = get();
    if (pendingPlayer === null) return;

    const serve: ServeData = { serverJersey: pendingPlayer, score };

    // If editing an existing serve, just update it and return to previous state
    if (editingTouchIndex === -1) {
      const hasFollowingData = allSequences.length > 0 || completedTouches.length > 0;
      set({
        serve,
        pendingPlayer: null,
        editingTouchIndex: null,
        entryStep: hasFollowingData ? 'outcome' : (score === 0 || score === 3) ? 'outcome' : 'player',
      });
      return;
    }

    if (score === 0 || score === 3) {
      // Ace or Error — set serve and immediately log point in one update
      const pointWon = score === 3;
      set({ serve, pendingPlayer: null, editingTouchIndex: null });
      // logPoint reads serve from store — it's now set
      get().logPoint(pointWon);
      return;
    }

    set({
      serve,
      pendingPlayer: null,
      editingTouchIndex: null,
      currentSequenceNumber: 2,
      entryStep: 'player',
    });
  },

  selectPlayer: (jerseyNumber) => {
    const { completedTouches } = get();
    if (completedTouches.length >= 3) return;

    set({
      pendingPlayer: jerseyNumber,
      pendingType: null,
      entryStep: 'type',
    });
  },

  selectType: (type) => {
    set({ pendingType: type, entryStep: 'score' });
  },

  selectScore: (score) => {
    const { completedTouches, pendingPlayer, pendingType, editingTouchIndex } = get();
    if (pendingPlayer === null || pendingType === null) return;

    const newTouch: Touch = {
      playerJerseyNumber: pendingPlayer,
      type: pendingType,
      score,
    };

    // Editing existing touch — replace in-place
    if (editingTouchIndex !== null && editingTouchIndex >= 0) {
      const updated = [...completedTouches];
      updated[editingTouchIndex] = newTouch;
      set({
        completedTouches: updated,
        pendingPlayer: null,
        pendingType: null,
        editingTouchIndex: null,
        entryStep: 'outcome',
      });
      return;
    }

    // New touch
    if (completedTouches.length >= 3) return;

    set({
      completedTouches: [...completedTouches, newTouch],
      pendingPlayer: null,
      pendingType: null,
      editingTouchIndex: null,
      entryStep: 'outcome',
    });
  },

  clearPending: () => {
    const { completedTouches, serve, isServing } = get();
    let step: EntryStep = 'player';
    if (!serve && !completedTouches.length) step = 'serve_or_receive';
    else if (completedTouches.length >= 3) step = 'outcome';
    set({ pendingPlayer: null, pendingType: null, editingTouchIndex: null, entryStep: step });
  },

  // After choosing "Continue" on the outcome screen
  continuePlay: () => {
    const { completedTouches, allSequences, currentSequenceNumber, serve } = get();

    // If we just scored a serve (no touches yet), move to touch entry
    if (completedTouches.length === 0 && serve) {
      set({
        currentSequenceNumber: 2,
        entryStep: 'player',
      });
      return;
    }

    // If current sequence has 3 touches, close it and start a new one
    // (ball went over the net and came back)
    if (completedTouches.length >= 3) {
      set({
        allSequences: [...allSequences, { isServe: false, touches: completedTouches }],
        completedTouches: [],
        currentSequenceNumber: currentSequenceNumber + 1,
        entryStep: 'player',
      });
      return;
    }

    // Otherwise keep adding to current sequence
    set({ entryStep: 'player' });
  },

  // Edit existing serve — reopen serve_score modal
  editServe: () => {
    const { serve } = get();
    if (!serve) return;
    set({
      pendingPlayer: serve.serverJersey,
      editingTouchIndex: -1,
      entryStep: 'serve_score',
    });
  },

  // Edit existing touch — reopen type modal with that touch's data
  editTouch: (index) => {
    const { completedTouches } = get();
    const touch = completedTouches[index];
    if (!touch) return;
    set({
      pendingPlayer: touch.playerJerseyNumber,
      pendingType: touch.type,
      editingTouchIndex: index,
      entryStep: 'type',
    });
  },

  startSub: () => {
    set({ entryStep: 'sub_out', subIn: null });
  },

  selectSubIn: (jerseyNumber) => {
    set({ subIn: jerseyNumber, entryStep: 'sub_in' });
  },

  selectSubOut: (jerseyNumber) => {
    const { currentSet, currentRallyNumber, activeLineup, subIn, serve, isServing, completedTouches } = get();
    if (!currentSet || subIn === null) return;

    const newLineup = activeLineup.map((j) => j === jerseyNumber ? subIn : j);

    const supabase = createClient();
    supabase.from('substitutions').insert({
      set_id: currentSet.id,
      rally_number: currentRallyNumber,
      player_out: jerseyNumber,
      player_in: subIn,
    }).then(({ error }) => {
      if (error) console.error('Failed to save substitution:', error);
    });

    // Figure out where to go back to
    let step: EntryStep = 'player';
    if (!serve && !completedTouches.length) step = 'serve_or_receive';

    set({ activeLineup: newLineup, subIn: null, entryStep: step });
  },

  cancelSub: () => {
    const { serve, isServing, completedTouches } = get();
    let step: EntryStep = 'player';
    if (!serve && !completedTouches.length) step = 'serve_or_receive';
    else if (completedTouches.length >= 3) step = 'outcome';
    set({ subIn: null, entryStep: step });
  },

  logPoint: async (pointWon) => {
    const { currentSet, currentRallyNumber, serve, completedTouches, allSequences, isServing, isSaving } = get();
    if (!currentSet || isSaving) return;
    set({ isSaving: true });

    const supabase = createClient();
    const rallyId = uuid();

    await supabase.from('rallies').insert({
      id: rallyId,
      set_id: currentSet.id,
      rally_number: currentRallyNumber,
      point_won: pointWon,
      server_jersey_number: serve?.serverJersey ?? null,
    });

    // Build sequences
    const seqsToSave: { isServe: boolean; touches: Touch[] }[] = [];

    if (serve) {
      seqsToSave.push({
        isServe: true,
        touches: [{
          playerJerseyNumber: serve.serverJersey,
          type: 'serve' as TouchType,
          score: serve.score,
        }],
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

    const newOurScore = currentSet.ourScore + (pointWon ? 1 : 0);
    const newTheirScore = currentSet.theirScore + (pointWon ? 0 : 1);

    await supabase.from('sets').update({
      our_score: newOurScore,
      their_score: newTheirScore,
    }).eq('id', currentSet.id);

    const sideout = pointWon && !isServing;
    const lostServe = !pointWon && isServing;
    const newIsServing = sideout ? true : lostServe ? false : isServing;

    // Add to rally log for display
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
      pendingPlayer: null,
      pendingType: null,
      entryStep: 'serve_or_receive',
      isSaving: false,
      isServing: newIsServing,
      lastServer: serve?.serverJersey ?? get().lastServer,
    });
  },

  undoLastRally: async () => {
    const { currentSet, currentRallyNumber, isServing } = get();
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
      serve: null,
      currentSequenceNumber: 1,
      completedTouches: [],
      allSequences: [],
      pendingPlayer: null,
      pendingType: null,
      entryStep: 'serve_or_receive',
    });
  },

  reset: () => {
    set({
      matchId: null, currentSet: null, currentRallyNumber: 1,
      isServing: false, activeLineup: [], rallyLog: [], isSaving: false,
      serve: null, currentSequenceNumber: 1,
      completedTouches: [], allSequences: [],
      pendingPlayer: null, pendingType: null,
      entryStep: 'serve_or_receive', subIn: null, lastServer: null,
    });
  },
}));
