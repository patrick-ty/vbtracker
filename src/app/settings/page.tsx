import Link from 'next/link';
import { requireTeam } from '@/lib/auth';
import { SettingsForm } from './settings-form';

export default async function SettingsPage() {
  const { teamName, role } = await requireTeam();

  return (
    <div className="flex-1 flex flex-col">
      <header className="bg-blue-700 text-white px-6 py-4 flex items-center gap-4">
        <Link href="/" className="hover:text-blue-200 transition-colors">
          &larr;
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      </header>

      <main className="flex-1 p-6 max-w-lg mx-auto w-full space-y-8">
        <section>
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Team</h2>
          <SettingsForm teamName={teamName} role={role} />
        </section>
      </main>
    </div>
  );
}
