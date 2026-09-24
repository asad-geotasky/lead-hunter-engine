'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import SettingsView from '@/components/SettingsView';

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email: string;
    name: string;
    role: string;
  } | null>(null);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setCurrentUser(data.user);
        }
      }
    } catch (e) {
      console.error('Failed to fetch user in settings page:', e);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <SettingsView
          currentUser={currentUser}
          onUserUpdated={(u) => setCurrentUser(u)}
        />
      </div>
    </DashboardLayout>
  );
}
