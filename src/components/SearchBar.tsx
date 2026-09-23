'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  SlidersHorizontal, 
  Key, 
  Loader2, 
  Database, 
  FolderPlus, 
  Layers,
  Globe,
  Phone,
  Mail,
  Star,
  CheckCircle2,
  X
} from 'lucide-react';
import { SearchProvider, Project } from '@/types/lead';

interface SearchBarProps {
  onSearch: (params: {
    niche: string;
    city: string;
    provider: SearchProvider;
    apiKey: string;
    projectId?: string;
    websiteFilter: 'all' | 'no-website' | 'has-website';
    hasPhoneOnly: boolean;
    hasEmailOnly: boolean;
    minReviews: number;
    minRating: number;
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
  
  // Modals & Panels
  const [showFilters, setShowFilters] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);

  // Logical Filters
  const [websiteFilter, setWebsiteFilter] = useState<'all' | 'no-website' | 'has-website'>('all');
  const [hasPhoneOnly, setHasPhoneOnly] = useState(true); // By default, cold calling/SMS requires phone
  const [hasEmailOnly, setHasEmailOnly] = useState(false);
  const [minReviews, setMinReviews] = useState(0);
  const [minRating, setMinRating] = useState(0);
  const [limit, setLimit] = useState(25);

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
      websiteFilter,
      hasPhoneOnly,
      hasEmailOnly,
      minReviews,
      minRating,
      limit,
    });
  };

  const activeFilterCount = 
    (websiteFilter !== 'all' ? 1 : 0) +
    (hasPhoneOnly ? 1 : 0) +
    (hasEmailOnly ? 1 : 0) +
    (minReviews > 0 ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (limit !== 25 ? 1 : 0);

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

        {/* Target Project Selection & API Key Button */}
        <div className="flex items-center gap-2">
          {/* API Key Configure Button */}
          <button
            type="button"
            onClick={() => setShowKeyModal(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition text-xs font-medium ${
              apiKey.trim() !== '' || provider === 'mock'
                ? 'bg-slate-900/80 border-slate-700 text-slate-300 hover:text-white'
                : 'bg-amber-500/10 border-amber-500/40 text-amber-300 animate-pulse'
            }`}
            title="Configure Scraper API Key"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>{apiKey ? 'API Key Set' : 'Set API Key'}</span>
          </button>

          {/* Project Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-slate-700 text-slate-300">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Project:</span>
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
                  📁 {p.name} ({p.leadCount || 0})
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

      {/* Main Search Inputs */}
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

          {/* Search Button & Advanced Filters Trigger */}
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
                  <span>Pull {limit} Leads</span>
                </>
              )}
            </button>

            {/* Logical Advanced Filters Toggle */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 rounded-xl border flex items-center gap-1.5 transition ${
                showFilters || activeFilterCount > 0
                  ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-sm'
                  : 'bg-slate-900/90 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Advanced Lead Filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {activeFilterCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              )}
            </button>
          </div>
        </div>

        {/* LOGICAL ADVANCED FILTERS PANEL */}
        {showFilters && (
          <div className="pt-4 border-t border-slate-700/60 space-y-4 animate-in fade-in text-xs">
            <div className="flex items-center justify-between text-slate-400 font-medium">
              <span className="flex items-center gap-1.5 text-slate-200 font-semibold">
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
                Advanced Lead Extraction Filters
              </span>
              <button
                type="button"
                onClick={() => {
                  setWebsiteFilter('all');
                  setHasPhoneOnly(false);
                  setHasEmailOnly(false);
                  setMinReviews(0);
                  setMinRating(0);
                  setLimit(25);
                }}
                className="text-slate-400 hover:text-white underline text-[11px]"
              >
                Reset Filters
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* 1. Website Presence Target */}
              <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/80 space-y-2">
                <label className="block text-slate-300 font-semibold flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  Website Presence
                </label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="radio"
                      name="websiteFilter"
                      checked={websiteFilter === 'all'}
                      onChange={() => setWebsiteFilter('all')}
                      className="text-blue-600 focus:ring-blue-500 bg-slate-900"
                    />
                    <span>All Businesses</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="radio"
                      name="websiteFilter"
                      checked={websiteFilter === 'no-website'}
                      onChange={() => setWebsiteFilter('no-website')}
                      className="text-blue-600 focus:ring-blue-500 bg-slate-900"
                    />
                    <span className="text-emerald-400 font-medium">No Website (Web Dev Targets)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="radio"
                      name="websiteFilter"
                      checked={websiteFilter === 'has-website'}
                      onChange={() => setWebsiteFilter('has-website')}
                      className="text-blue-600 focus:ring-blue-500 bg-slate-900"
                    />
                    <span>Has Website (Redesign/SEO)</span>
                  </label>
                </div>
              </div>

              {/* 2. Contact Requirements */}
              <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/80 space-y-2">
                <label className="block text-slate-300 font-semibold flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-indigo-400" />
                  Contact Requirements
                </label>
                <div className="space-y-2 pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={hasPhoneOnly}
                      onChange={(e) => setHasPhoneOnly(e.target.checked)}
                      className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-900"
                    />
                    <span>Must have <strong>Phone Number</strong></span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={hasEmailOnly}
                      onChange={(e) => setHasEmailOnly(e.target.checked)}
                      className="rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-900"
                    />
                    <span>Must have <strong>Scraped Email</strong></span>
                  </label>
                </div>
              </div>

              {/* 3. Business Activity & Reviews */}
              <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/80 space-y-2">
                <label className="block text-slate-300 font-semibold flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  Activity & Reviews
                </label>
                <div className="space-y-2">
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Minimum Reviews:</span>
                    <select
                      value={minReviews}
                      onChange={(e) => setMinReviews(parseInt(e.target.value, 10))}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none"
                    >
                      <option value={0}>Any Review Count</option>
                      <option value={5}>5+ Reviews (Active)</option>
                      <option value={20}>20+ Reviews (Established)</option>
                      <option value={50}>50+ Reviews (High Volume)</option>
                    </select>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Rating Filter:</span>
                    <select
                      value={minRating}
                      onChange={(e) => setMinRating(parseFloat(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none"
                    >
                      <option value={0}>Any Rating</option>
                      <option value={3.5}>3.5★ and above</option>
                      <option value={4.0}>4.0★ and above</option>
                      <option value={4.5}>4.5★ and above</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 4. Batch Extraction Volume */}
              <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/80 space-y-2">
                <label className="block text-slate-300 font-semibold">
                  Batch Extraction Limit
                </label>
                <p className="text-[11px] text-slate-400">
                  Select how many prospects to harvest in this batch:
                </p>
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {[10, 25, 50, 100].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setLimit(num)}
                      className={`py-2 rounded-lg font-bold transition text-center ${
                        limit === num
                          ? 'bg-blue-600 text-white shadow'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* DEDICATED API KEY CONFIGURATION MODAL */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                Configure {provider === 'apify' ? 'Apify Token' : provider === 'outscraper' ? 'Outscraper Key' : 'Google Places Key'}
              </h3>
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-2">
              <label className="block text-slate-300 font-medium">
                {provider === 'apify'
                  ? 'Apify Personal API Token'
                  : provider === 'outscraper'
                  ? 'Outscraper API Key'
                  : 'Google Places API Key'}
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                placeholder={
                  provider === 'apify'
                    ? 'apify_api_...'
                    : provider === 'outscraper'
                    ? 'outscraper_...'
                    : 'AIzaSy...'
                }
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                Your key is stored securely in your browser&apos;s local storage. If left empty, server environment variables (e.g. <code>APIFY_API_TOKEN</code>) will be used.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md transition"
              >
                Save &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
