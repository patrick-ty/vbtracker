'use client';

import { useState } from 'react';
import { createTeam } from './actions';

export default function OnboardingPage() {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-center text-blue-700 mb-2">
          Welcome to VBTracker
        </h1>
        <p className="text-center text-gray-500 mb-8">
          Let&apos;s set up your team to get started.
        </p>

        <form
          action={async (fd) => {
            try {
              await createTeam(fd);
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Something went wrong');
            }
          }}
          className="space-y-5"
        >
          <div>
            <label htmlFor="team_name" className="block text-sm font-medium text-gray-700 mb-1">
              Team Name
            </label>
            <input
              id="team_name"
              name="team_name"
              type="text"
              required
              autoFocus
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              placeholder="e.g. 17U Wildcats"
            />
          </div>

          <div>
            <label htmlFor="season_name" className="block text-sm font-medium text-gray-700 mb-1">
              Season
            </label>
            <input
              id="season_name"
              name="season_name"
              type="text"
              defaultValue="2025-2026"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              placeholder="e.g. 2025-2026"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors"
          >
            Create Team &amp; Add Players
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          You&apos;ll be able to add players and match details next.
        </p>
      </div>
    </div>
  );
}
