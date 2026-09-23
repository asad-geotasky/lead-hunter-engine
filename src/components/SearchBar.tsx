'use client';

import React, { useState, useEffect } from 'react';
import { Search, MapPin, Briefcase, Filter, Key, Sparkles, Loader2, Database, FolderPlus, Layers } from 'lucide-react';
import { SearchProvider, Project } from '@/types/lead';

interface SearchBarProps {
  onSearch: (params: {
    niche: string;
    city: string;
    provider: SearchProvider;
    apiKey: string;
    projectId?: string;
    filterNoWebsite: boolean;
    minScore: number;
    limit: number;
  }) => Promise<void>;
  loading: boolean;
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (projectId: string | null) => void;
  onOpenProjectModal: () => void;
}

export default function SearchBar({
  onSearch,
  loading,
  projects,
  activeProjectId,
  onSelectProject,
  onOpenProjectModal,
}: SearchBarProps) {
  const [niche, setNiche] = useState('Restaurants');
  const [city, setCity] = useState('Austin, TX');
  const [provider, setProvider] = useState<SearchProvider>('apify');
  const [apiKey, setApiKey] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [filterNoWebsite, setFilterNoWebsite] = useState(false);
  const [minScore, setMinScore] = useState(0);
  const [limit, setLimit] = useState(20);

  // Load saved API key from localStorage when provider changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem(`lead_hunter_key_${provider}`) || '';
      setApiKey(savedKey);
    }
  }, [provider]);

  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`lead_hunter_key_${provider}`, val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!niche.trim() || !city.trim()) return;
    onSearch({
      niche: niche.trim(),
      city: city.trim(),
      provider,
      apiKey: apiKey.trim(),
      projectId: activeProjectId || undefined,
      filterNoWebsite,
      minScore,
      limit,
    });
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/80 rounded-2xl p-5 shadow-2xl space-y-4">
      {/* Top Bar: Provider Selector & Project Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-700/60 pb-3">
        {/* Scraper Source Selector */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-700">
          <span className="text-slate-400 px-2 font-medium flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            Source:
          </span>
          <button
            type="button"
            onClick={() => setProvider('apify')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              provider === 'apify'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Apify (Emails + Maps)
          </button>
          <button
            type="button"
            onClick={() => setProvider('outscraper')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              provider === 'outscraper'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Outscraper API
          </button>
          <button
            type="button"
            onClick={() => setProvider('google')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              provider === 'google'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Google Places
          </button>
          <button
            type="button"
            onClick={() => setProvider('mock')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              provider === 'mock'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sandbox Simulator
          </button>
        </div>

        {/* Active Project Assignment */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-slate-700 text-slate-300">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Target Project:</span>
            <select
              value={activeProjectId || ''}
              onChange={(e) => onSelectProject(e.target.value || null)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-slate-800 text-slate-300">
                All Leads / Unassigned
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-800 text-white">
                  📁 {p.name} ({p.leadCount || 0} leads)
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onOpenProjectModal}
            className="p-1.5 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-200 transition"
            title="Create or Manage Projects"
          >
            <FolderPlus className="w-4 h-4 text-blue-400" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Niche Input */}
          <div className="md:col-span-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Briefcase className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="Niche (e.g. Restaurants, Plumbers, Dentists)"
              className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
            />
          </div>

          {/* City Input */}
          <div className="md:col-span-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <MapPin className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City (e.g. Austin, TX or New York, NY)"
              className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
            />
          </div>

          {/* Search Button */}
          <div className="md:col-span-4 flex items-center gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold py-3 px-5 rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Harvesting Leads...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Pull {provider === 'apify' ? 'Apify' : provider === 'outscraper' ? 'Outscraper' : 'Leads'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className={`p-3 rounded-xl border transition ${
                showConfig
                  ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                  : 'bg-slate-900/90 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Filters & API Settings"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsible API & Filter Config */}
        {showConfig && (
          <div className="pt-4 border-t border-slate-700/60 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                {provider === 'apify'
                  ? 'Apify API Token'
                  : provider === 'outscraper'
                  ? 'Outscraper API Key'
                  : provider === 'google'
                  ? 'Google Places API Key'
                  : 'Sandbox (No Key Needed)'}
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                disabled={provider === 'mock'}
                placeholder={
                  provider === 'apify'
                    ? 'apify_api_... (or leave blank to use APIFY_API_TOKEN)'
                    : provider === 'outscraper'
                    ? 'outscraper_api_key_...'
                    : provider === 'google'
                    ? 'AIzaSy...'
                    : 'Sandbox simulator generates sample leads'
                }
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Saved locally in browser. If left blank, server environment variables will be used.
              </span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Intent & Batch Limit ({limit} leads)
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterNoWebsite}
                    onChange={(e) => setFilterNoWebsite(e.target.checked)}
                    className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-900"
                  />
                  <span>Only businesses with <strong>NO website</strong></span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Count:</span>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={limit}
                    onChange={(e) => setLimit(parseInt(e.target.value, 10))}
                    className="flex-1 accent-blue-500"
                  />
                  <span className="text-slate-200 font-bold">{limit}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Minimum Opportunity Score ({minScore})
              </label>
              <input
                type="range"
                min="0"
                max="90"
                step="10"
                value={minScore}
                onChange={(e) => setMinScore(parseInt(e.target.value, 10))}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>All (0)</span>
                <span>50+ (High Intent)</span>
                <span>80+ (Top Drawer)</span>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
