'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateTeamName } from './actions';
import type { TeamRole } from '@/lib/database.types';

interface SettingsFormProps {
  teamName: string;
  role: TeamRole;
}

export function SettingsForm({ teamName, role }: SettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isCoach = role === 'head_coach' || role === 'assistant_coach';

  function handleSubmit(fd: FormData) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await updateTeamName(fd);
        setSaved(true);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong');
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Team Name
        </label>
        <input
          name="team_name"
          type="text"
          defaultValue={teamName}
          required
          disabled={!isCoach}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg min-h-[44px] disabled:bg-gray-100 disabled:text-gray-500"
        />
        {!isCoach && (
          <p className="text-xs text-gray-400 mt-1">Only coaches can edit team settings.</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Your Role
        </label>
        <p className="text-gray-600 capitalize">{role.replace('_', ' ')}</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {saved && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm">
          Settings saved.
        </div>
      )}

      {isCoach && (
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors min-h-[44px] disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Save Changes'}
        </button>
      )}
    </form>
  );
}
