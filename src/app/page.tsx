"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="bg-blue-700 text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">VBTracker</h1>
        <nav className="flex items-center gap-4">
          <Link href="/roster" className="hover:text-blue-200 transition-colors">
            Roster
          </Link>
          <button
            onClick={handleSignOut}
            className="hover:text-blue-200 transition-colors"
          >
            Sign Out
          </button>
        </nav>
      </header>
      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/matches/new"
            className="block bg-blue-600 text-white rounded-2xl p-8 text-center text-xl font-semibold hover:bg-blue-700 transition-colors active:scale-[0.98] min-h-[120px] flex items-center justify-center"
          >
            New Match
          </Link>
          <Link
            href="/roster"
            className="block bg-white border-2 border-gray-200 rounded-2xl p-8 text-center text-xl font-semibold hover:border-blue-400 transition-colors active:scale-[0.98] min-h-[120px] flex items-center justify-center"
          >
            Manage Roster
          </Link>
        </div>
      </main>
    </div>
  );
}
