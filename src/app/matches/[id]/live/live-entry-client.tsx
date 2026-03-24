'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useMatchStore } from '@/stores/matchStore';
import { TOUCH_TYPE_LABELS, TOUCH_SCORE_LABELS } from '@/lib/types';
import type { TouchType, TouchScore } from '@/lib/types';
import type { Database } from '@/lib/database.types';

type Player = Database['public']['Tables']['players']['Row'];
type Match = Database['public']['Tables']['matches']['Row'];

interface SetInit {
  id: string;
  matchId: string;
  setNumber: number;
  ourScore: number;
  theirScore: number;
}

interface RallyLogEntry {
  rallyNumber: number;
  pointWon: boolean;
  serve: { serverJersey: number; score: 0 | 1 | 2 | 3 } | null;
  sequences: { isServe: boolean; touches: { playerJerseyNumber: number; type: string; score: 0 | 1 | 2 | 3 }[] }[];
  ourScore: number;
  theirScore: number;
}

interface LiveEntryClientProps {
  match: Match;
  teamName: string;
  eventName: string | null;
  currentSet: SetInit;
  nextRallyNumber: number;
  isServingFirst: boolean;
  players: Player[];
  activeLineup: number[];
  initialRallyLog: RallyLogEntry[];
}

const TOUCH_TYPES: TouchType[] = ['pass', 'set', 'attack', 'block', 'dig'];
const SCORES: TouchScore[] = [3, 2, 1, 0];

function serveLabel(score: number) {
  if (score === 3) return 'Ace';
  if (score === 0) return 'Error';
  return 'In';
}

export function LiveEntryClient({ match, teamName, eventName, currentSet, nextRallyNumber, isServingFirst, players, activeLineup: initialLineup, initialRallyLog }: LiveEntryClientProps) {
  const store = useMatchStore();
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    store.initMatch(match.id, currentSet, isServingFirst, nextRallyNumber, initialLineup, initialRallyLog as any);
  }, []);

  const { rallyLog } = store;
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [rallyLog.length]);

  const {
    currentSet: liveSet, currentRallyNumber, serve, completedTouches,
    allSequences, pendingPlayer, pendingType, entryStep, isServing,
    activeLineup, subIn, editingTouchIndex,
  } = store;

  const ourScore = liveSet?.ourScore ?? currentSet.ourScore;
  const theirScore = liveSet?.theirScore ?? currentSet.theirScore;
  const setNumber = liveSet?.setNumber ?? currentSet.setNumber;
  const touchCount = completedTouches.length;
  const lineup = activeLineup.length > 0 ? activeLineup : initialLineup;
  const onCourtPlayers = players.filter((p) => lineup.includes(p.jersey_number));
  const benchPlayers = players.filter((p) => !lineup.includes(p.jersey_number));
  const hasModal = ['serve_or_receive', 'serve_score', 'type', 'score', 'outcome', 'sub_out', 'sub_in'].includes(entryStep);
  const opponent = match.opponent_name || 'Opponent';

  return (
    <div className="flex-1 flex flex-col bg-gray-100 select-none overflow-hidden" style={{ height: '100dvh' }}>

      {/* ── SCOREBOARD ── */}
      <div className="bg-blue-700 text-white shrink-0">
        {/* Context bar */}
        <div className="flex items-center justify-between px-5 pt-2 pb-1">
          <Link href={`/matches/${match.id}`} className="text-blue-300 hover:text-white text-sm font-medium">
            &larr; Exit
          </Link>
          <p className="text-xs text-blue-300">
            {eventName && <span>{eventName} &middot; </span>}
            {new Date(match.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
          <button
            onClick={() => store.undoLastRally()}
            disabled={currentRallyNumber <= 1}
            className="text-blue-300 hover:text-white text-sm font-medium disabled:opacity-30"
          >
            Undo
          </button>
        </div>

        {/* Score */}
        <div className="flex items-end justify-center gap-8 pb-3">
          <div className="text-center w-32">
            <p className="text-sm font-semibold text-blue-200 tracking-wide uppercase">{teamName}</p>
            <p className="text-5xl font-black tabular-nums leading-none mt-1">{ourScore}</p>
          </div>
          <div className="text-blue-400 text-2xl font-light pb-2">–</div>
          <div className="text-center w-32">
            <p className="text-sm font-semibold text-blue-200 tracking-wide uppercase">{opponent}</p>
            <p className="text-5xl font-black tabular-nums leading-none mt-1">{theirScore}</p>
          </div>
        </div>

        {/* Set / Rally info */}
        <div className="bg-blue-800 px-5 py-1.5 flex items-center justify-center gap-4 text-sm">
          <span className="text-blue-300">Set <span className="text-white font-bold">{setNumber}</span></span>
          <span className="text-blue-500">|</span>
          <span className="text-blue-300">Rally <span className="text-white font-bold">{currentRallyNumber}</span></span>
        </div>
      </div>

      {/* ── PLAYER BAR ── */}
      <div className="bg-white border-b border-gray-200 px-5 py-3 shrink-0">
        <div className="flex items-center gap-2">
          {entryStep === 'serve_player' && (
            <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-bold shrink-0 mr-1">
              Select server
            </span>
          )}
          <div className="flex-1 flex items-center gap-2 overflow-x-auto">
            {onCourtPlayers.map((p) => {
              const isSelected = pendingPlayer === p.jersey_number;
              const canTap = (entryStep === 'player' || entryStep === 'serve_player');
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    if (entryStep === 'serve_player') store.selectServer(p.jersey_number);
                    else if (entryStep === 'player') store.selectPlayer(p.jersey_number);
                  }}
                  disabled={!canTap && !isSelected}
                  className={`flex flex-col items-center px-3 py-2 rounded-xl transition-all shrink-0 min-w-[56px] ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md scale-105'
                      : canTap
                        ? 'bg-gray-50 border border-gray-200 text-gray-900 hover:bg-blue-50 hover:border-blue-300 active:bg-blue-100'
                        : 'bg-gray-50 text-gray-300 border border-gray-100'
                  }`}
                >
                  <span className="text-lg font-bold tabular-nums">{p.jersey_number}</span>
                  <span className={`text-[9px] font-medium mt-0.5 ${isSelected ? 'text-blue-200' : canTap ? 'text-gray-500' : 'text-gray-300'}`}>
                    {p.last_name.slice(0, 6)}
                  </span>
                </button>
              );
            })}
          </div>
          {entryStep !== 'sub_out' && entryStep !== 'sub_in' && lineup.length > 0 && (
            <button onClick={() => store.startSub()}
              className="px-3 py-2 rounded-xl border-2 border-orange-300 text-orange-600 text-xs font-bold hover:bg-orange-50 shrink-0">
              SUB
            </button>
          )}
        </div>
      </div>

      {/* ── RALLY LOG ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
        {/* Empty state */}
        {rallyLog.length === 0 && !serve && touchCount === 0 && (
          <div className="text-center py-16">
            <p className="text-2xl font-bold text-gray-300 mb-2">Ready</p>
            <p className="text-base text-gray-400">
              {entryStep === 'serve_or_receive'
                ? 'Choose Serve or Receive to start'
                : entryStep === 'serve_player'
                  ? 'Tap the server above'
                  : 'Tap a player to record a touch'}
            </p>
          </div>
        )}

        {/* Completed rallies */}
        {rallyLog.map((r, idx) => (
          <div key={`${r.rallyNumber}-${idx}`}
            className={`rounded-xl px-4 py-3 border ${
              r.pointWon
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className={`text-lg font-black ${r.pointWon ? 'text-green-600' : 'text-red-500'}`}>
                  {r.pointWon ? '+' : '−'}
                </span>
                <span className="text-xs font-medium text-gray-400">Rally {r.rallyNumber}</span>
              </div>
              <span className="text-lg font-bold tabular-nums text-gray-800">
                {r.ourScore} – {r.theirScore}
              </span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {r.sequences.map((seq, si) =>
                seq.touches.map((t, ti) => (
                  <span key={`${si}-${ti}`} className="text-sm text-gray-600">
                    <span className="font-bold text-blue-700">#{t.playerJerseyNumber}</span>
                    {' '}
                    <span className="font-medium">
                      {t.type === 'serve'
                        ? `SRV ${serveLabel(t.score)}`
                        : `${TOUCH_TYPE_LABELS[t.type as TouchType]} ${t.score}`}
                    </span>
                    {(si < r.sequences.length - 1 || ti < seq.touches.length - 1) && (
                      <span className="text-gray-300 mx-1">→</span>
                    )}
                  </span>
                ))
              )}
            </div>
          </div>
        ))}

        {/* Current rally in progress */}
        {(serve || allSequences.length > 0 || touchCount > 0) && (
          <div className="rounded-xl px-4 py-3 bg-blue-50 border-2 border-blue-300">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">Rally {currentRallyNumber} — In Progress</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {serve && (
                <button onClick={() => store.editServe()}
                  className={`text-sm rounded-lg px-2 py-0.5 transition-colors ${
                    editingTouchIndex === -1 ? 'ring-2 ring-blue-500 bg-blue-200' : 'hover:bg-blue-100'
                  }`}>
                  <span className="font-bold text-blue-700">#{serve.serverJersey}</span>
                  {' '}<span className="font-medium text-blue-600">SRV {serveLabel(serve.score)}</span>
                </button>
              )}
              {serve && (allSequences.length > 0 || touchCount > 0) && (
                <span className="text-blue-300 self-center">→</span>
              )}
              {allSequences.map((seq, si) =>
                seq.touches.map((t, ti) => (
                  <span key={`s${si}-${ti}`} className="text-sm text-gray-600 self-center">
                    <span className="font-bold text-gray-800">#{t.playerJerseyNumber}</span>
                    {' '}<span className="font-medium">{TOUCH_TYPE_LABELS[t.type as TouchType]} {t.score}</span>
                    <span className="text-gray-300 mx-1">→</span>
                  </span>
                ))
              )}
              {completedTouches.map((t, i) => (
                <button key={`c${i}`} onClick={() => store.editTouch(i)}
                  className={`text-sm rounded-lg px-2 py-0.5 transition-colors ${
                    editingTouchIndex === i ? 'ring-2 ring-blue-500 bg-gray-200' : 'hover:bg-blue-100'
                  }`}>
                  <span className="font-bold text-gray-800">#{t.playerJerseyNumber}</span>
                  {' '}<span className="font-medium">{TOUCH_TYPE_LABELS[t.type]} {t.score}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={logEndRef} />
      </div>

      {/* ── QUICK POINT BUTTONS (when no modal) ── */}
      {!hasModal && (entryStep === 'player' || entryStep === 'serve_player') && (
        <div className="shrink-0 bg-white border-t border-gray-200 px-5 py-3">
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => store.logPoint(false)}
              className="py-4 rounded-xl border-2 border-red-200 text-red-500 font-bold text-lg hover:bg-red-50 transition-colors">
              Their Point
            </button>
            <button onClick={() => store.logPoint(true)}
              className="py-4 rounded-xl border-2 border-green-200 text-green-500 font-bold text-lg hover:bg-green-50 transition-colors">
              Our Point
            </button>
          </div>
        </div>
      )}

      {/* ── BOTTOM MODAL ── */}
      {hasModal && (
        <div className="shrink-0 bg-white border-t border-gray-200 shadow-[0_-8px_24px_rgba(0,0,0,0.1)] rounded-t-3xl px-6 pt-5 pb-8 space-y-4">

          {/* Serve or Receive */}
          {entryStep === 'serve_or_receive' && (
            <>
              <p className="text-lg font-bold text-gray-800">Rally {currentRallyNumber}</p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => store.chooseServe()}
                  className="py-8 rounded-2xl bg-blue-50 border-2 border-blue-200 hover:bg-blue-100 transition-colors">
                  <span className="text-2xl font-bold text-blue-700 block">Serve</span>
                  <span className="text-sm text-blue-500 mt-1">We&apos;re serving</span>
                </button>
                <button onClick={() => store.chooseReceive()}
                  className="py-8 rounded-2xl bg-gray-50 border-2 border-gray-200 hover:bg-gray-100 transition-colors">
                  <span className="text-2xl font-bold text-gray-700 block">Receive</span>
                  <span className="text-sm text-gray-500 mt-1">They&apos;re serving</span>
                </button>
              </div>
            </>
          )}

          {/* Serve result */}
          {entryStep === 'serve_score' && (
            <>
              <p className="text-lg font-bold text-gray-800">
                <span className="text-blue-600">#{pendingPlayer}</span> serving
              </p>
              <div className="grid grid-cols-3 gap-4">
                <button onClick={() => store.scoreServe(3)}
                  className="py-6 rounded-2xl bg-green-50 border-2 border-green-200 hover:bg-green-100 transition-colors">
                  <span className="text-2xl font-bold text-green-700 block">Ace</span>
                  <span className="text-xs text-green-500 mt-1">Our point</span>
                </button>
                <button onClick={() => store.scoreServe(2)}
                  className="py-6 rounded-2xl bg-blue-50 border-2 border-blue-200 hover:bg-blue-100 transition-colors">
                  <span className="text-2xl font-bold text-blue-700 block">In</span>
                  <span className="text-xs text-blue-500 mt-1">Ball in play</span>
                </button>
                <button onClick={() => store.scoreServe(0)}
                  className="py-6 rounded-2xl bg-red-50 border-2 border-red-200 hover:bg-red-100 transition-colors">
                  <span className="text-2xl font-bold text-red-700 block">Error</span>
                  <span className="text-xs text-red-500 mt-1">Their point</span>
                </button>
              </div>
              <button onClick={() => store.clearPending()} className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>
            </>
          )}

          {/* Touch type */}
          {entryStep === 'type' && (
            <>
              <p className="text-lg font-bold text-gray-800">
                <span className="text-blue-600">#{pendingPlayer}</span> — what skill?
              </p>
              <div className="grid grid-cols-5 gap-3">
                {TOUCH_TYPES.map((type) => (
                  <button key={type} onClick={() => store.selectType(type)}
                    className="py-5 rounded-2xl bg-gray-50 border-2 border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors">
                    <span className="text-lg font-bold text-gray-800 block">{TOUCH_TYPE_LABELS[type]}</span>
                    <span className="text-[10px] text-gray-400 capitalize">{type}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => store.clearPending()} className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>
            </>
          )}

          {/* Touch score */}
          {entryStep === 'score' && (
            <>
              <p className="text-lg font-bold text-gray-800">
                <span className="text-blue-600">#{pendingPlayer}</span>
                {' '}<span className="text-gray-500">{TOUCH_TYPE_LABELS[pendingType!]}</span>
                {' '}— how was it?
              </p>
              <div className="grid grid-cols-4 gap-3">
                {SCORES.map((score) => (
                  <button key={score} onClick={() => store.selectScore(score)}
                    className={`py-6 rounded-2xl border-2 transition-colors ${
                      score === 3 ? 'bg-green-50 border-green-200 hover:bg-green-100' :
                      score === 2 ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' :
                      score === 1 ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100' :
                      'bg-red-50 border-red-200 hover:bg-red-100'
                    }`}>
                    <span className="text-3xl font-black block">{score}</span>
                    <span className="text-xs text-gray-500 font-medium">{TOUCH_SCORE_LABELS[score]}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => store.clearPending()} className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>
            </>
          )}

          {/* Outcome */}
          {entryStep === 'outcome' && (
            <>
              <p className="text-lg font-bold text-gray-800">What happened next?</p>
              <div className="grid grid-cols-3 gap-4">
                <button onClick={() => store.logPoint(false)}
                  className="py-6 rounded-2xl bg-red-50 border-2 border-red-200 hover:bg-red-100 transition-colors">
                  <span className="text-xl font-bold text-red-700 block">Their Point</span>
                </button>
                <button onClick={() => store.continuePlay()}
                  className="py-6 rounded-2xl bg-gray-50 border-2 border-gray-200 hover:bg-gray-100 transition-colors">
                  <span className="text-xl font-bold text-gray-700 block">Continue</span>
                  <span className="text-xs text-gray-500">Ball in play</span>
                </button>
                <button onClick={() => store.logPoint(true)}
                  className="py-6 rounded-2xl bg-green-50 border-2 border-green-200 hover:bg-green-100 transition-colors">
                  <span className="text-xl font-bold text-green-700 block">Our Point</span>
                </button>
              </div>
            </>
          )}

          {/* Sub: player coming in */}
          {entryStep === 'sub_out' && (
            <>
              <p className="text-lg font-bold text-green-700">Who&apos;s coming in?</p>
              <div className="flex gap-3 flex-wrap">
                {benchPlayers.map((p) => (
                  <button key={p.id} onClick={() => store.selectSubIn(p.jersey_number)}
                    className="px-5 py-3 rounded-xl bg-green-50 border-2 border-green-200 hover:bg-green-100 transition-colors min-h-[56px]">
                    <span className="text-xl font-bold text-gray-800">{p.jersey_number}</span>
                    <span className="text-sm text-gray-500 ml-2">{p.last_name}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => store.cancelSub()} className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>
            </>
          )}

          {/* Sub: player going out */}
          {entryStep === 'sub_in' && (
            <>
              <p className="text-lg font-bold text-orange-700">
                <span className="text-2xl">#{subIn}</span> coming in — who&apos;s going out?
              </p>
              <div className="flex gap-3 flex-wrap">
                {onCourtPlayers.map((p) => (
                  <button key={p.id} onClick={() => store.selectSubOut(p.jersey_number)}
                    className="px-5 py-3 rounded-xl bg-orange-50 border-2 border-orange-200 hover:bg-orange-100 transition-colors min-h-[56px]">
                    <span className="text-xl font-bold text-gray-800">{p.jersey_number}</span>
                    <span className="text-sm text-gray-500 ml-2">{p.last_name}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => store.cancelSub()} className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
