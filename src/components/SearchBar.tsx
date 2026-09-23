'use client';

import React, { useState } from 'react';
import { Search, MapPin, Briefcase, Filter, Key, Sparkles, Loader2 } from 'lucide-react';

interface SearchBarProps {
  onSearch: (params: {
    niche: string;
    city: string;
    apiKey: string;
    filterNoWebsite: boolean;
    minScore: number;
  }) => Promise<void>;
  loading: boolean;
}

export default function SearchBar({ onSearch, loading }: SearchBarProps) {
  const [niche, setNiche] = useState('Plumbers');
  const [city, setCity] = useState('Austin, TX');
  const [apiKey, setApiKey] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [filterNoWebsite, setFilterNoWebsite] = useState(false);
  const [minScore, setMinScore] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!niche.trim() || !city.trim()) return;
    onSearch({
      niche: niche.trim(),
      city: city.trim(),
      apiKey: apiKey.trim(),
      filterNoWebsite,
      minScore,
    });
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/80 rounded-2xl p-5 shadow-2xl">
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
              placeholder="Niche (e.g. Plumbers, Roofers, Dentists)"
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
              placeholder="City (e.g. Austin, TX or Miami, FL)"
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
                  <span>Scanning Leads...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Pull Leads</span>
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
                Google Places API Key (Optional)
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Leave blank for smart sandbox data"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Without a key, the engine uses real-world intelligent local simulation.
              </span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Intent Filter
              </label>
              <label className="flex items-center gap-2 text-slate-300 py-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterNoWebsite}
                  onChange={(e) => setFilterNoWebsite(e.target.checked)}
                  className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-900"
                />
                <span>Only show businesses with <strong>NO website</strong></span>
              </label>
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
