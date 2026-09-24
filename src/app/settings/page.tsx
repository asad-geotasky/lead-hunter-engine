'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/?tab=settings');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
      <div className="text-center space-y-2">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm">Loading Settings...</p>
      </div>
    </div>
  );
}
