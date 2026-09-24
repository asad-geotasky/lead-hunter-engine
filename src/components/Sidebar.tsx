'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Radar, 
  Folder, 
  Mail, 
  Flame, 
  Settings, 
  Search, 
  Shield, 
  LogOut, 
  ChevronRight,
} from 'lucide-react';
import { Project } from '@/types/lead';

interface SidebarProps {
  projects?: Project[];
  activeProjectId?: string | null;
  currentUser?: {
    id: string;
    email: string;
    name: string;
    role: string;
  } | null;
  onLogout?: () => void;
  leadCount?: number;
  onCloseMobile?: () => void;
}

export default function Sidebar({
  projects = [],
  activeProjectId = null,
  currentUser = null,
  onLogout,
  leadCount = 0,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();

  const isLeads = pathname === '/';
  const isProjects = pathname.startsWith('/projects');
  const isMailboxes = pathname.startsWith('/mailboxes');
  const isCampaigns = pathname.startsWith('/campaigns');
  const isSettings = pathname.startsWith('/settings');

  const activeProject = projects.find((p) => p.id === activeProjectId);

  const handleLinkClick = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none h-full min-h-screen">
      {/* Top Brand & Navigation */}
      <div className="p-4 space-y-4">
        {/* Brand */}
        <Link 
          href="/" 
          onClick={handleLinkClick}
          className="flex items-center gap-3 px-2 py-1 group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition">
            <Radar className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
              <span>LeadHunter</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
                Engine
              </span>
            </div>
            <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
              v3.0 Enterprise
            </div>
          </div>
        </Link>

        {/* Active Project Card / Switcher Link */}
        <Link 
          href="/projects"
          onClick={handleLinkClick}
          className="block bg-slate-900/90 hover:bg-slate-900 border border-slate-800/80 hover:border-cyan-500/40 rounded-xl p-2.5 transition group"
          title="Click to view and manage projects"
        >
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span className="flex items-center gap-1 font-medium">
              <Folder className="w-3 h-3 text-cyan-400" />
              <span>Workspace</span>
            </span>
            <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition" />
          </div>
          <div className="font-semibold text-xs text-white truncate">
            {activeProject ? activeProject.name : 'All Projects / Unassigned'}
          </div>
        </Link>

        {/* Navigation Menu */}
        <div className="space-y-1 pt-2">
          <div className="px-3 pb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Menu
          </div>

          {/* 1. Leads / Prospecting */}
          <Link
            href="/"
            onClick={handleLinkClick}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
              isLeads
                ? 'bg-gradient-to-r from-cyan-600/30 to-indigo-600/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-cyan-400" />
              <span>Prospecting & Leads</span>
            </div>
            {leadCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                {leadCount}
              </span>
            )}
          </Link>

          {/* 2. Projects Manager */}
          <Link
            href="/projects"
            onClick={handleLinkClick}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
              isProjects
                ? 'bg-gradient-to-r from-cyan-600/30 to-indigo-600/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Folder className="w-4 h-4 text-blue-400" />
              <span>Projects</span>
            </div>
            {projects.length > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-mono">
                {projects.length}
              </span>
            )}
          </Link>

          {/* 3. Mailboxes */}
          <Link
            href="/mailboxes"
            onClick={handleLinkClick}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
              isMailboxes
                ? 'bg-gradient-to-r from-cyan-600/30 to-indigo-600/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-purple-400" />
              <span>Mailboxes</span>
            </div>
            <span className="text-[10px] text-purple-400 font-mono">Rotation</span>
          </Link>

          {/* 4. Campaigns */}
          <Link
            href="/campaigns"
            onClick={handleLinkClick}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
              isCampaigns
                ? 'bg-gradient-to-r from-cyan-600/30 to-indigo-600/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Campaigns</span>
            </div>
            <span className="text-[10px] text-amber-400 font-mono">Sequences</span>
          </Link>

          {/* 5. Settings */}
          <Link
            href="/settings"
            onClick={handleLinkClick}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
              isSettings
                ? 'bg-gradient-to-r from-cyan-600/30 to-indigo-600/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings & SMTP</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Bottom User Profile & Sign Out */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
        {currentUser ? (
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
              <div className="text-[10px] text-slate-400 truncate">{currentUser.email}</div>
              <div className="flex items-center gap-1 mt-0.5 text-[9px] font-mono text-cyan-400">
                <Shield className="w-2.5 h-2.5" />
                <span>{currentUser.role}</span>
              </div>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 transition shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-2 text-xs text-slate-500">Active Session</div>
        )}
      </div>
    </aside>
  );
}
