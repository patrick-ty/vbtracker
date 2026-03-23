'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setActiveSeason } from './season-switcher-action';

interface Season {
  id: string;
  name: string;
  isActive: boolean;
}

interface SeasonSwitcherProps {
  teamId: string;
  seasons: Season[];
  activeSeasonId: string | null;
}

export function SeasonSwitcher({ teamId, seasons, activeSeasonId }: SeasonSwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  const activeSeason = seasons.find((s) => s.id === activeSeasonId);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function handleSwitch(seasonId: string) {
    startTransition(async () => {
      await setActiveSeason(teamId, seasonId);
      setOpen(false);
      router.refresh();
    });
  }

  if (seasons.length === 0) return null;

  // Single season — just show the name, no dropdown
  if (seasons.length === 1) {
    return (
      <span className="text-blue-200 text-[11px]">{activeSeason?.name ?? 'Season'}</span>
    );
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="text-blue-200 text-[11px] hover:text-white transition-colors flex items-center gap-1"
        disabled={isPending}
      >
        {activeSeason?.name ?? 'Season'}
        <span className="text-[9px]">▾</span>
      </button>

      {open && (
        <div className="absolute left-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {seasons.map((season) => (
            <button
              key={season.id}
              onClick={() => handleSwitch(season.id)}
              disabled={isPending}
              className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                season.id === activeSeasonId ? 'text-blue-700 font-medium' : 'text-gray-700'
              }`}
            >
              {season.id === activeSeasonId && '• '}
              {season.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
