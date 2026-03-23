'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { quickCreateMatch } from '../../matches/actions';
import { createEvent } from '../../seasons/actions';
import type { Database } from '@/lib/database.types';

type BaseMatch = Database['public']['Tables']['matches']['Row'];
type Event = Database['public']['Tables']['events']['Row'];

type Match = BaseMatch & {
  setsWon: number;
  setsLost: number;
  setScores: { our: number; their: number }[];
};

interface EventGroup {
  event: Event;
  matches: Match[];
}

interface DashboardClientProps {
  teamId: string;
  eventGroups: EventGroup[];
  ungroupedMatches: Match[];
  seasonId: string | null;
}

function formatEventDates(dateStart: string, dateEnd: string | null): string {
  const start = new Date(dateStart);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };

  if (!dateEnd || dateEnd === dateStart) {
    return start.toLocaleDateString('en-US', { weekday: 'short', ...opts });
  }

  const end = new Date(dateEnd);
  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });

  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()}\u2013${end.getDate()}`;
  }
  return `${start.toLocaleDateString('en-US', opts)} \u2013 ${end.toLocaleDateString('en-US', opts)}`;
}

export function DashboardClient({ teamId, eventGroups, ungroupedMatches, seasonId }: DashboardClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    if (eventGroups.length > 0) ids.add(eventGroups[0].event.id);
    return ids;
  });
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleEvent(id: string) {
    setExpandedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleQuickMatch(eventId?: string) {
    setError(null);
    startTransition(async () => {
      try {
        const matchId = await quickCreateMatch(eventId);
        router.push(`/matches/${matchId}/lineup`);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong');
      }
    });
  }

  function handleCreateEvent(fd: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createEvent(fd);
        setShowNewEvent(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong');
      }
    });
  }

  return (
    <main className="flex-1 p-5 max-w-5xl mx-auto w-full space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => handleQuickMatch()}
          disabled={isPending}
          className="flex-1 bg-blue-600 text-white rounded-lg py-3 px-4 font-semibold text-sm hover:bg-blue-700 transition-colors active:scale-[0.98] disabled:opacity-50"
        >
          + New Match
        </button>
        <button
          onClick={() => setShowNewEvent(true)}
          disabled={!seasonId || isPending}
          className="bg-white border border-gray-300 rounded-lg py-3 px-4 font-semibold text-sm hover:border-blue-400 transition-colors active:scale-[0.98] disabled:opacity-50"
        >
          + New Event
        </button>
      </div>

      {/* New event form */}
      {showNewEvent && (
        <form
          action={handleCreateEvent}
          className="bg-white border-2 border-blue-300 rounded-lg p-4 space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="sm:col-span-2 md:col-span-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Event Name</label>
              <input
                name="name"
                type="text"
                required
                autoFocus
                className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[44px] text-sm"
                placeholder="e.g. Spring Invitational"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
              <input
                name="date_start"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[44px] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">End Date <span className="text-gray-400">(optional)</span></label>
              <input
                name="date_end"
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[44px] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Location</label>
              <input
                name="location"
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[44px] text-sm"
                placeholder="Gym or venue"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowNewEvent(false)}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium min-h-[44px] disabled:opacity-50"
            >
              {isPending ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      )}

      {/* Event list */}
      <div className="space-y-3">
        {eventGroups.map(({ event, matches }) => {
          const isExpanded = expandedEvents.has(event.id);
          const inProgress = matches.filter((m) => m.status === 'in-progress');

          return (
            <section key={event.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Event header */}
              <button
                onClick={() => toggleEvent(event.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">{event.name}</p>
                    {inProgress.length > 0 && (
                      <span className="text-[10px] font-medium bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full shrink-0">
                        {inProgress.length} live
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatEventDates(event.date_start, event.date_end)}
                    {event.location ? ` \u00B7 ${event.location}` : ''}
                    {' \u00B7 '}{matches.length} match{matches.length !== 1 ? 'es' : ''}
                  </p>
                </div>
                <span className="text-gray-400 text-xs ml-3 shrink-0">{isExpanded ? '▼' : '▶'}</span>
              </button>

              {/* Expanded match list */}
              {isExpanded && (
                <div className="border-t border-gray-100">
                  {matches.map((match, i) => (
                    <MatchRow key={match.id} match={match} isLast={i === matches.length - 1} />
                  ))}
                  <button
                    onClick={() => handleQuickMatch(event.id)}
                    disabled={isPending}
                    className="w-full py-2.5 text-gray-400 text-sm font-medium hover:text-blue-600 hover:bg-blue-50 transition-colors min-h-[44px] disabled:opacity-50 border-t border-gray-100"
                  >
                    + Add Match
                  </button>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Ungrouped matches */}
      {ungroupedMatches.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Standalone Matches</h2>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {ungroupedMatches.map((match, i) => (
              <MatchRow key={match.id} match={match} isLast={i === ungroupedMatches.length - 1} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {eventGroups.length === 0 && ungroupedMatches.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p>No matches yet. Create an event or start a quick match.</p>
        </div>
      )}
    </main>
  );
}

function MatchRow({ match, isLast }: { match: Match; isLast: boolean }) {
  const isInProgress = match.status === 'in-progress';
  const hasSets = match.setScores.length > 0;
  const isWin = match.setsWon > match.setsLost;
  const isLoss = match.setsLost > match.setsWon;

  return (
    <Link
      href={`/matches/${match.id}`}
      className={`flex items-center px-4 py-3 hover:bg-gray-50 transition-colors ${
        !isLast ? 'border-b border-gray-100' : ''
      }`}
    >
      {/* W/L indicator */}
      {isInProgress ? (
        <span className="w-8 mr-3 text-center text-[10px] font-bold text-yellow-600 shrink-0">LIVE</span>
      ) : hasSets && (isWin || isLoss) ? (
        <span className={`w-8 mr-3 text-center text-base font-bold shrink-0 ${
          isWin ? 'text-green-600' : 'text-red-500'
        }`}>
          {isWin ? 'W' : 'L'}
        </span>
      ) : (
        <span className="w-8 mr-3 text-center text-base font-bold text-gray-300 shrink-0">—</span>
      )}

      {/* Opponent — fixed width so scores align */}
      <p className="w-44 text-sm font-semibold text-gray-900 truncate shrink-0">
        {match.opponent_name ? `vs ${match.opponent_name}` : 'Match'}
      </p>

      {/* Set record */}
      {hasSets ? (
        <span className="w-10 ml-4 text-center text-base font-bold tabular-nums text-gray-800 shrink-0">
          {match.setsWon}–{match.setsLost}
        </span>
      ) : (
        <span className="w-10 ml-4 shrink-0" />
      )}

      {/* Individual set scores as pills — each links to set detail */}
      {hasSets ? (
        <div className="flex gap-1.5 ml-3">
          {match.setScores.map((s, i) => (
            <Link
              key={i}
              href={`/matches/${match.id}/sets/${i + 1}`}
              onClick={(e) => e.stopPropagation()}
              className="px-4 py-1.5 rounded-full bg-gray-100 text-sm font-medium tabular-nums text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition-colors"
            >
              {s.our}–{s.their}
            </Link>
          ))}
        </div>
      ) : (
        <span className="ml-3" />
      )}

      {/* Date — right aligned */}
      <span className="ml-auto text-xs text-gray-400 tabular-nums shrink-0">
        {new Date(match.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })}
      </span>
    </Link>
  );
}
