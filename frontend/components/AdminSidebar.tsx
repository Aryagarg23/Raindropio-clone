import React from 'react';
import { useRouter } from 'next/router';

export default function AdminSidebar() {
  const router = useRouter();
  return (
    <aside className="h-full w-64 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col justify-between py-8 px-6 shadow-lg">
      <div>
        <h1 className="text-2xl font-bold text-[var(--primary)] mb-8">Admin Panel</h1>
        <nav className="space-y-2">
          <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-[var(--background)] font-medium text-[var(--text-primary)] transition-colors" disabled>Home</button>
          <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-[var(--background)] font-medium text-[var(--text-primary)] transition-colors" disabled>Teams</button>
          <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-[var(--background)] font-medium text-[var(--text-primary)] transition-colors" disabled>Users</button>
        </nav>
      </div>
      <button
        onClick={() => router.push('/')}
        className="mt-8 px-4 py-2 bg-[var(--primary)] text-[var(--text-primary)] rounded-lg font-semibold shadow-md hover:bg-[var(--secondary)] transition-colors"
      >
        ← Back to Dashboard
      </button>
    </aside>
  );
}
