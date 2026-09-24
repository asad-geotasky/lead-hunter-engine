'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Project } from '@/types/lead';
import { Menu, X } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeProjectId?: string | null;
  leadCount?: number;
}

export default function DashboardLayout({
  children,
  activeProjectId = null,
  leadCount = 0,
}: DashboardLayoutProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; name: string; role: string } | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      console.error('Failed to fetch user session:', e);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setProjects(data.projects || []);
        }
      }
    } catch (e) {
      console.error('Failed to fetch projects in layout:', e);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error('Logout error:', e);
      router.push('/login');
    }
  };

  useEffect(() => {
    fetchSession();
    fetchProjects();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans antialiased selection:bg-cyan-500 selection:text-black">
      {/* Desktop Left Sidebar */}
      <div className="hidden lg:flex shrink-0 h-screen sticky top-0">
        <Sidebar
          projects={projects}
          activeProjectId={activeProjectId}
          currentUser={currentUser}
          onLogout={handleLogout}
          leadCount={leadCount}
        />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-black/80 backdrop-blur-sm">
          <div className="relative w-64 h-full bg-slate-950 flex flex-col">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-3 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              title="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
            <Sidebar
              projects={projects}
              activeProjectId={activeProjectId}
              currentUser={currentUser}
              onLogout={handleLogout}
              leadCount={leadCount}
              onCloseMobile={() => setMobileMenuOpen(false)}
            />
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden min-h-screen">
        {/* Mobile Header Bar with Hamburger */}
        <div className="lg:hidden border-b border-slate-800 bg-slate-900/80 px-4 h-14 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-xs font-bold text-white tracking-wider">LeadHunter Engine</span>
          <div className="w-8" />
        </div>

        {children}
      </div>
    </div>
  );
}
