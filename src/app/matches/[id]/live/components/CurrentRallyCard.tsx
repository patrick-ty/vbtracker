'use client';

import { useMatchStore } from '@/stores/matchStore';
import { TOUCH_TYPE_LABELS, serveResultLabel } from '@/lib/types';

export function CurrentRallyCard() {
  const serve = useMatchStore((s) => s.serve);
  const completedTouches = useMatchStore((s) => s.completedTouches);
  const allSequences = useMatchStore((s) => s.allSequences);
  const currentRallyNumber = useMatchStore((s) => s.currentRallyNumber);
  const currentSequenceNumber = useMatchStore((s) => s.currentSequenceNumber);
  const editTarget = useMatchStore((s) => s.editTarget);
  const editServe = useMatchStore((s) => s.editServe);
  const editTouch = useMatchStore((s) => s.editTouch);
  const deleteServe = useMatchStore((s) => s.deleteServe);
  const deleteTouch = useMatchStore((s) => s.deleteTouch);
  const clearSelection = useMatchStore((s) => s.clearSelection);

  const hasData = serve || allSequences.length > 0 || completedTouches.length > 0;
  if (!hasData) return null;

  const isEditingServe = editTarget?.kind === 'serve';
  const editingTouchIndex = editTarget?.kind === 'touch' ? editTarget.index : null;

  return (
    <div className="rounded-xl px-4 py-3 bg-blue-50 border-2 border-blue-300">
      <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">
        Rally {currentRallyNumber} — In Progress
      </p>

      <div className="space-y-1">
        {/* Serve */}
        {serve && (
          <div className="flex gap-1.5 items-center">
            <button
              onClick={() => editServe()}
              className={`text-sm rounded-lg px-2.5 py-1 transition-colors ${
                isEditingServe
                  ? 'ring-2 ring-blue-500 bg-blue-200'
                  : 'bg-blue-100 hover:bg-blue-200'
              }`}
            >
              <span className="font-bold text-blue-700">#{serve.serverJersey}</span>
              {' '}<span className="font-medium text-blue-600">SRV {serveResultLabel(serve.score)}</span>
            </button>
            {isEditingServe && (
              <>
                <button onClick={() => deleteServe()}
                  className="text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-1 rounded hover:bg-red-50">
                  Delete
                </button>
                <button onClick={() => clearSelection()}
                  className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1">
                  Cancel
                </button>
              </>
            )}
          </div>
        )}

        {/* Completed sequences */}
        {allSequences.map((seq, si) => (
          <div key={si} className="flex gap-1.5 flex-wrap items-center">
            <span className="text-[10px] text-gray-400 font-medium mr-1">Seq {si + (serve ? 2 : 1)}:</span>
            {seq.touches.map((t, ti) => (
              <span key={ti} className="text-sm bg-gray-100 rounded-lg px-2.5 py-1">
                <span className="font-bold text-gray-800">#{t.playerJerseyNumber}</span>
                {' '}<span className="font-medium text-gray-600">{TOUCH_TYPE_LABELS[t.type]} {t.score}</span>
              </span>
            ))}
          </div>
        ))}

        {/* Current sequence touches (editable) */}
        {completedTouches.length > 0 && (
          <div className="flex gap-1.5 flex-wrap items-center">
            {(allSequences.length > 0 || serve) && (
              <span className="text-[10px] text-gray-400 font-medium mr-1">Seq {currentSequenceNumber}:</span>
            )}
            {completedTouches.map((t, i) => {
              const isEditing = editingTouchIndex === i;
              return (
                <span key={i} className="inline-flex items-center gap-1">
                  <button
                    onClick={() => editTouch(i)}
                    className={`text-sm rounded-lg px-2.5 py-1 transition-colors ${
                      isEditing
                        ? 'ring-2 ring-blue-500 bg-gray-200'
                        : 'bg-white border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <span className="font-bold text-gray-800">#{t.playerJerseyNumber}</span>
                    {' '}<span className="font-medium text-gray-600">{TOUCH_TYPE_LABELS[t.type]} {t.score}</span>
                  </button>
                  {isEditing && (
                    <>
                      <button onClick={() => deleteTouch()}
                        className="text-xs text-red-500 hover:text-red-700 font-semibold px-1 py-0.5 rounded hover:bg-red-50">
                        ✕
                      </button>
                      <button onClick={() => clearSelection()}
                        className="text-xs text-gray-400 hover:text-gray-600 px-1 py-0.5">
                        Cancel
                      </button>
                    </>
                  )}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
