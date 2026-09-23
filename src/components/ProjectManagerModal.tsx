'use client';

import React, { useState } from 'react';
import { Project } from '@/types/lead';
import { X, FolderPlus, Folder, Trash2, CheckCircle2, MapPin, Briefcase } from 'lucide-react';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (projectId: string | null) => void;
  onRefreshProjects: () => Promise<void>;
}

export default function ProjectManagerModal({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  onRefreshProjects,
}: ProjectManagerModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [targetCity, setTargetCity] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSaving(true);
      setError(null);
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
        await onRefreshProjects();
        onSelectProject(data.project.id);
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
    if (!confirm('Are you sure you want to delete this project? Associated leads will be preserved as unassigned.')) {
      return;
    }

    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (activeProjectId === id) {
        onSelectProject(null);
      }
      await onRefreshProjects();
    } catch (err) {
      console.error('Delete project failed:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Project Workspaces</h2>
              <p className="text-xs text-slate-400">Organize your scraped leads into segmented campaign folders</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Create New Project Form */}
          <form onSubmit={handleCreate} className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-emerald-400" />
              Create New Project Workspace
            </h3>

            {error && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Project Name (e.g. Italian Restaurants)"
                required
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Category (e.g. Restaurants)"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="text"
                value={targetCity}
                onChange={(e) => setTargetCity(e.target.value)}
                placeholder="City (e.g. New York, NY)"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-md transition flex items-center gap-1.5"
              >
                {saving ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>

          {/* Existing Projects List */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Your Projects ({projects.length})
            </h3>

            {/* Default "All Leads" Option */}
            <div
              onClick={() => {
                onSelectProject(null);
                onClose();
              }}
              className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                activeProjectId === null
                  ? 'bg-blue-600/10 border-blue-500/50 text-white'
                  : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${activeProjectId === null ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                  <Folder className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">All Leads / Global</h4>
                  <p className="text-xs text-slate-400">View leads across all projects</p>
                </div>
              </div>
              {activeProjectId === null && <CheckCircle2 className="w-5 h-5 text-blue-400" />}
            </div>

            {projects.map((p) => {
              const isSelected = activeProjectId === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectProject(p.id);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                    isSelected
                      ? 'bg-blue-600/10 border-blue-500/50 text-white'
                      : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                      <Folder className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm">{p.name}</h4>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                          {p.leadCount || 0} leads
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        {p.category && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3" /> {p.category}
                          </span>
                        )}
                        {p.targetCity && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {p.targetCity}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-400" />}
                    <button
                      onClick={(e) => handleDelete(p.id, e)}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
