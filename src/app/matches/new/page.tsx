'use client';

import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { quickCreateMatch } from '../actions';

export default function NewMatchPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      try {
        const matchId = await quickCreateMatch();
        router.replace(`/matches/${matchId}/lineup`);
      } catch {
        router.replace('/');
      }
    });
  }, []);

  return (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-gray-400">Creating match...</p>
    </div>
  );
}
