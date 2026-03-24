'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { switchTeam } from './team-switcher-action';

interface Team {
  teamId: string;
  teamName: string;
}

interface UserMenuProps {
  email: string;
  activeTeamId: string;
  teams: Team[];
}

export function UserMenu({ email, activeTeamId, teams }: UserMenuProps) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  const initials = email
    .split('@')[0]
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  function handleSwitchTeam(teamId: string) {
    startTransition(async () => {
      await switchTeam(teamId);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-full bg-blue-500 text-white text-xs font-semibold flex items-center justify-center hover:bg-blue-400 transition-colors"
      >
        {initials}
      </button>

      {open && (
        <div className="fixed right-4 mt-2 w-60 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900 truncate">{email}</p>
          </div>

          {/* Team switcher (only shown if multiple teams) */}
          {teams.length > 1 && (
            <div className="border-b border-gray-100 py-1">
              <p className="px-4 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Teams</p>
              {teams.map((team) => (
                <button
                  key={team.teamId}
                  onClick={() => handleSwitchTeam(team.teamId)}
                  disabled={isPending}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                    team.teamId === activeTeamId ? 'text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  {team.teamId === activeTeamId && '• '}
                  {team.teamName}
                </button>
              ))}
            </div>
          )}

          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Settings
          </Link>

          <button
            onClick={handleSignOut}
            className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-gray-50 transition-colors border-t border-gray-100"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
