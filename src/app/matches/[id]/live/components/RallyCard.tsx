'use client';

import { useMatchStore } from '@/stores/matchStore';
import { TOUCH_TYPE_LABELS, serveResultLabel } from '@/lib/types';
import type { TouchType } from '@/lib/types';
import type { CompletedRally } from '@/stores/matchStore';

interface RallyCardProps {
  rally: CompletedRally;
  index: number;
}

export function RallyCard({ rally, index }: RallyCardProps) {
  const editRally = useMatchStore((s) => s.editRally);
  const editingRallyIndex = useMatchStore((s) => s.editingRallyIndex);
  const editTarget = useMatchStore((s) => s.editTarget);
  const editServe = useMatchStore((s) => s.editServe);
  const editTouch = useMatchStore((s) => s.editTouch);
  const deleteServe = useMatchStore((s) => s.deleteServe);
  const deleteTouch = useMatchStore((s) => s.deleteTouch);
  const clearSelection = useMatchStore((s) => s.clearSelection);
  const isEditing = editingRallyIndex === index;

  // When editing this rally, show the live state from the store
  const liveServe = useMatchStore((s) => s.serve);
  const liveAllSequences = useMatchStore((s) => s.allSequences);
  const liveCompletedTouches = useMatchStore((s) => s.completedTouches);
  const liveCurrentSeqNum = useMatchStore((s) => s.currentSequenceNumber);

  // Use live data when editing, otherwise use the rally's saved data
  const displayServe = isEditing ? liveServe : rally.serve;
  const displaySequences = isEditing ? liveAllSequences : rally.sequences.filter(s => !s.isServe);
  const displayCurrentTouches = isEditing ? liveCompletedTouches : [];

  const isEditingServe = isEditing && editTarget?.kind === 'serve';
  const editingTouchIdx = isEditing && editTarget?.kind === 'touch' ? editTarget.index : null;

  return (
    <button
      onClick={() => { if (!isEditing) editRally(index); }}
      className={`w-full text-left rounded-xl px-4 py-3 border transition-colors ${
        isEditing
          ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-300'
          : rally.pointWon
            ? 'bg-green-50 border-green-200 hover:bg-green-100'
            : 'bg-red-50 border-red-200 hover:bg-red-100'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-xl font-black ${rally.pointWon ? 'text-green-600' : 'text-red-500'}`}>
            {rally.pointWon ? '+' : '−'}
          </span>
          <span className="text-xs font-medium text-gray-400">Rally {rally.rallyNumber}</span>
          {isEditing && <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded uppercase">Editing</span>}
        </div>
        <span className="text-lg font-bold tabular-nums text-gray-800">
          {rally.ourScore} – {rally.theirScore}
        </span>
      </div>

      <div className="space-y-1">
        {/* Serve */}
        {displayServe && (
          <div className="flex gap-1.5 items-center flex-wrap">
            {isEditing ? (
              <>
                <span
                  onClick={(e) => { e.stopPropagation(); editServe(); }}
                  className={`text-sm rounded-lg px-2.5 py-1 cursor-pointer transition-colors ${
                    isEditingServe ? 'ring-2 ring-blue-500 bg-blue-200' : 'bg-blue-100 hover:bg-blue-200'
                  }`}
                >
                  <span className="font-bold text-blue-700">#{displayServe.serverJersey}</span>
                  {' '}<span className="font-medium text-blue-600">SRV {serveResultLabel(displayServe.score)}</span>
                </span>
                {isEditingServe && (
                  <>
                    <span onClick={(e) => { e.stopPropagation(); deleteServe(); }}
                      className="text-xs text-red-500 hover:text-red-700 font-bold cursor-pointer px-1.5 py-0.5 rounded hover:bg-red-50">
                      Delete
                    </span>
                    <span onClick={(e) => { e.stopPropagation(); clearSelection(); }}
                      className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer px-1.5 py-0.5">
                      Cancel
                    </span>
                  </>
                )}
              </>
            ) : (
              <span className="text-sm">
                <span className="font-bold text-blue-700">#{displayServe.serverJersey}</span>
                {' '}<span className="font-medium text-gray-600">SRV {serveResultLabel(displayServe.score)}</span>
              </span>
            )}
          </div>
        )}

        {/* Completed sequences */}
        {displaySequences.map((seq, si) => (
          <div key={si} className="flex gap-1.5 flex-wrap items-center">
            {(si > 0 || displayServe) && (
              <span className="text-[10px] text-gray-400 font-medium mr-1">Seq {si + (displayServe ? 2 : 1)}:</span>
            )}
            {seq.touches.map((t, ti) => (
              <span key={ti} className="text-sm">
                <span className="font-bold text-blue-700">#{t.playerJerseyNumber}</span>
                {' '}<span className="font-medium text-gray-600">{TOUCH_TYPE_LABELS[t.type as TouchType]} {t.score}</span>
                {ti < seq.touches.length - 1 && <span className="text-gray-300 mx-1">→</span>}
              </span>
            ))}
          </div>
        ))}

        {/* Current sequence (only when editing) */}
        {isEditing && displayCurrentTouches.length > 0 && (
          <div className="flex gap-1.5 flex-wrap items-center">
            {(displaySequences.length > 0 || displayServe) && (
              <span className="text-[10px] text-gray-400 font-medium mr-1">Seq {liveCurrentSeqNum}:</span>
            )}
            {displayCurrentTouches.map((t, i) => {
              const isTouchEditing = editingTouchIdx === i;
              return (
                <span key={i} className="inline-flex items-center gap-1">
                  <span
                    onClick={(e) => { e.stopPropagation(); editTouch(i); }}
                    className={`text-sm rounded-lg px-2.5 py-1 cursor-pointer transition-colors ${
                      isTouchEditing ? 'ring-2 ring-blue-500 bg-gray-200' : 'bg-white border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <span className="font-bold text-gray-800">#{t.playerJerseyNumber}</span>
                    {' '}<span className="font-medium text-gray-600">{TOUCH_TYPE_LABELS[t.type]} {t.score}</span>
                  </span>
                  {isTouchEditing && (
                    <>
                      <span onClick={(e) => { e.stopPropagation(); deleteTouch(); }}
                        className="text-xs text-red-500 hover:text-red-700 font-bold cursor-pointer px-1 py-0.5 rounded hover:bg-red-50">
                        ✕
                      </span>
                      <span onClick={(e) => { e.stopPropagation(); clearSelection(); }}
                        className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer px-1 py-0.5">
                        Cancel
                      </span>
                    </>
                  )}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </button>
  );
}
