'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { Project } from '@/types/lead';
import { 
  Folder, 
  FolderPlus, 
  Trash2, 
  MapPin, 
  Briefcase, 
  Layers, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw,
  Search,
  Sparkles
} from 'lucide-react';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [targetCity, setTargetCity] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.success) {
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lead_hunter_active_project');
      if (saved) setActiveProjectId(saved);
    }
  }, []);

  const handleSetActive = (id: string | null) => {
    setActiveProjectId(id);
    if (typeof window !== 'undefined') {
      if (id) localStorage.setItem('lead_hunter_active_project', id);
      else localStorage.removeItem('lead_hunter_active_project');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          category: category.trim() || undefined,
          targetCity: targetCity.trim() || undefined,
          description: description.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.project) {
        setName('');
        setCategory('');
        setTargetCity('');
        setDescription('');
        setSuccessMsg(`Project "${data.project.name}" created successfully!`);
        await fetchProjects();
        handleSetActive(data.project.id);
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setError(data.error || 'Failed to create project');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating project';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this project? Associated leads will remain as unassigned.')) {
      return;
    }

    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (activeProjectId === id) {
        handleSetActive(null);
      }
      await fetchProjects();
    } catch (err) {
      console.error('Delete project failed:', err);
    }
  };

  return (
    <DashboardLayout activeProjectId={activeProjectId}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Page Title & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Folder className="w-6 h-6 text-cyan-400" />
              <span>Project Workspaces</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Organize your scraped leads into segmented niches, targeted cities, and campaign folders
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchProjects}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
              title="Refresh Projects"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              href="/"
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
            >
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span>Prospecting Search</span>
            </Link>
          </div>
        </div>

        {/* Create Project + Projects Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Create Project Form */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 h-fit lg:sticky lg:top-20">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <FolderPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Create New Project</h2>
                <p className="text-xs text-slate-400">Segment campaigns by location or niche</p>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Austin Dental Clinics"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Target Niche / Category</label>
                <input
                  type="text"
                  placeholder="e.g. Dentists, Plumbers, HVAC"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Target City / Region</label>
                <input
                  type="text"
                  placeholder="e.g. Austin, TX"
                  value={targetCity}
                  onChange={(e) => setTargetCity(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Notes on client pitch angle or campaign goal..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-cyan-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FolderPlus className="w-3.5 h-3.5" />}
                <span>Create Workspace</span>
              </button>
            </form>
          </div>

          {/* Right 2 Columns: Projects Grid */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Existing Workspaces</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-mono">
                  {projects.length}
                </span>
              </h2>

              <button
                onClick={() => handleSetActive(null)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                  activeProjectId === null
                    ? 'bg-cyan-600 text-white border-cyan-500 shadow'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                View All Unfiltered
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl p-8">
                <Folder className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white mb-1">No Projects Created Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Create your first project workspace using the form to organize your prospect lists and sequences.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {projects.map((project) => {
                  const isActive = activeProjectId === project.id;
                  const leadCount = project.leadCount || 0;

                  return (
                    <div
                      key={project.id}
                      onClick={() => handleSetActive(project.id)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                        isActive
                          ? 'bg-slate-900 border-cyan-500/80 shadow-xl shadow-cyan-500/5 ring-1 ring-cyan-500/30'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 font-bold text-white text-sm group-hover:text-cyan-400 transition">
                            <Folder className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                            <span>{project.name}</span>
                          </div>
                          {isActive && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold">
                              ACTIVE
                            </span>
                          )}
                        </div>

                        {project.description && (
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {project.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-slate-400">
                          {project.category && (
                            <span className="flex items-center gap-1 bg-slate-950/60 border border-slate-800 px-2 py-0.5 rounded-md">
                              <Briefcase className="w-3 h-3 text-slate-500" />
                              <span>{project.category}</span>
                            </span>
                          )}
                          {project.targetCity && (
                            <span className="flex items-center gap-1 bg-slate-950/60 border border-slate-800 px-2 py-0.5 rounded-md">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              <span>{project.targetCity}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-mono text-[11px]">
                          <strong>{leadCount}</strong> leads
                        </span>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/?projectId=${project.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                          >
                            <span>Open Leads</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                          <button
                            onClick={(e) => handleDelete(project.id, e)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 transition"
                            title="Delete Project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
