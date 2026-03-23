'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { TeamSummary } from './page';

interface CoachDashboardClientProps {
  teams: TeamSummary[];
}

export function CoachDashboardClient({ teams }: CoachDashboardClientProps) {
  const [tab, setTab] = useState<'current' | 'past'>('current');

  // Current = has an active season. Past = no active season.
  const currentTeams = teams.filter((t) => t.activeSeasonName !== null);
  const pastTeams = teams.filter((t) => t.activeSeasonName === null);

  // Collect all season names across all teams for the past filter
  const pastSeasonNames = useMemo(() => {
    const names = new Set<string>();
    for (const t of pastTeams) {
      for (const s of t.seasons) {
        names.add(s.name);
      }
    }
    return Array.from(names).sort().reverse();
  }, [pastTeams]);

  const [seasonFilter, setSeasonFilter] = useState<string>('all');

  const filteredPastTeams = seasonFilter === 'all'
    ? pastTeams
    : pastTeams.filter((t) => t.seasons.some((s) => s.name === seasonFilter));

  const displayTeams = tab === 'current' ? currentTeams : filteredPastTeams;

  return (
    <main className="flex-1 p-5 max-w-5xl mx-auto w-full space-y-4">
      {/* Tabs + Add Team */}
      <div className="flex items-center justify-between">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setTab('current')}
            className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              tab === 'current'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Current
            {currentTeams.length > 0 && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                tab === 'current' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'
              }`}>
                {currentTeams.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('past')}
            className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              tab === 'past'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Past
            {pastTeams.length > 0 && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                tab === 'past' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'
              }`}>
                {pastTeams.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Season filter (only on Past tab, only if there are seasons) */}
          {tab === 'past' && pastSeasonNames.length > 0 && (
            <select
              value={seasonFilter}
              onChange={(e) => setSeasonFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white min-h-[36px]"
            >
              <option value="all">All Seasons</option>
              {pastSeasonNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          )}

          <Link
            href="/onboarding"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
          >
            + Add Team
          </Link>
        </div>
      </div>

      {/* Team cards */}
      {displayTeams.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          {tab === 'current' ? (
            <>
              <p className="text-lg mb-2">No active teams</p>
              <p>Create a new team or activate a season on an existing team.</p>
            </>
          ) : (
            <>
              <p className="text-lg mb-2">No past teams</p>
              <p>Teams with no active season will appear here.</p>
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayTeams.map((team) => (
          <Link
            key={team.teamId}
            href={`/teams/${team.teamId}`}
            className="block bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-sm transition-all active:scale-[0.99]"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-lg">{team.teamName}</h3>
                {team.activeSeasonName && (
                  <p className="text-xs text-gray-500">{team.activeSeasonName}</p>
                )}
                {!team.activeSeasonName && team.seasons.length > 0 && (
                  <p className="text-xs text-gray-400">
                    Last: {team.seasons[0].name}
                  </p>
                )}
              </div>
              {team.liveCount > 0 && (
                <span className="text-[10px] font-medium bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                  {team.liveCount} live
                </span>
              )}
            </div>

            <div className="flex gap-6 text-sm text-gray-500">
              <div>
                <span className="text-2xl font-bold text-gray-900">{team.playerCount}</span>
                <p className="text-xs">Players</p>
              </div>
              <div>
                <span className="text-2xl font-bold text-gray-900">{team.matchCount}</span>
                <p className="text-xs">Matches</p>
              </div>
            </div>

            <p className="text-xs text-gray-400 capitalize mt-3">{team.role.replace('_', ' ')}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
