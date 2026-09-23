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
  X,
  Languages,
  ShieldCheck,
  Building2,
  Clock,
  RotateCcw
} from 'lucide-react';
import { 
  SearchProvider, 
  Project, 
  ApifyFilterOptions, 
  OutscraperFilterOptions, 
  GoogleFilterOptions 
} from '@/types/lead';

interface SearchBarProps {
  onSearch: (params: {
    niche: string;
    city: string;
    provider: SearchProvider;
    apiKey: string;
    projectId?: string;
    limit: number;
    apifyOptions?: ApifyFilterOptions;
    outscraperOptions?: OutscraperFilterOptions;
    googleOptions?: GoogleFilterOptions;
    websiteFilter: 'all' | 'no-website' | 'has-website';
    hasPhoneOnly: boolean;
    hasEmailOnly: boolean;
    minReviews: number;
    minRating: number;
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

  // Common Filters
  const [limit, setLimit] = useState(25);
  const [websiteFilter, setWebsiteFilter] = useState<'all' | 'no-website' | 'has-website'>('all');
  const [hasPhoneOnly, setHasPhoneOnly] = useState(true);
  const [hasEmailOnly, setHasEmailOnly] = useState(false);

  // Apify Native Options
  const [apifyCountry, setApifyCountry] = useState('us');
  const [apifyLanguage, setApifyLanguage] = useState('en');
  const [apifyExtractEmails, setApifyExtractEmails] = useState(true);
  const [apifyMaxReviews, setApifyMaxReviews] = useState(3);

  // Outscraper Native Options
  const [outscraperRegion, setOutscraperRegion] = useState('US');
  const [outscraperLanguage, setOutscraperLanguage] = useState('en');
  const [outscraperDropDuplicates, setOutscraperDropDuplicates] = useState(true);
  const [outscraperSkipEmptyEmail, setOutscraperSkipEmptyEmail] = useState(false);
  const [outscraperSkipEmptyPhone, setOutscraperSkipEmptyPhone] = useState(true);

  // Google Places Native Options
  const [googleRegion, setGoogleRegion] = useState('US');
  const [googleLanguage, setGoogleLanguage] = useState('en');
  const [googleMinRating, setGoogleMinRating] = useState(0);
  const [googleOpenNow, setGoogleOpenNow] = useState(false);

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
      limit,
      websiteFilter,
      hasPhoneOnly,
      hasEmailOnly,
      minReviews: 0,
      minRating: provider === 'google' ? googleMinRating : 0,
      apifyOptions: {
        countryCode: apifyCountry,
        language: apifyLanguage,
        extractEmails: apifyExtractEmails,
        hasPhoneOnly,
        websiteFilter,
        maxReviews: apifyMaxReviews,
      },
      outscraperOptions: {
        region: outscraperRegion,
        language: outscraperLanguage,
        dropDuplicates: outscraperDropDuplicates,
        skipEmptyEmail: outscraperSkipEmptyEmail,
        skipEmptyPhone: outscraperSkipEmptyPhone,
        websiteFilter,
      },
      googleOptions: {
        regionCode: googleRegion,
        languageCode: googleLanguage,
        minRating: googleMinRating,
        openNow: googleOpenNow,
      },
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
            Source Engine:
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
            Apify (Emails + GMaps)
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
            Outscraper API v2
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

        {/* Project Switcher & API Key Configuration */}
        <div className="flex items-center gap-2">
          {/* API Key Modal Button */}
          <button
            type="button"
            onClick={() => setShowKeyModal(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition text-xs font-medium ${
              apiKey.trim() !== '' || provider === 'mock'
                ? 'bg-slate-900/80 border-slate-700 text-slate-300 hover:text-white'
                : 'bg-amber-500/10 border-amber-500/40 text-amber-300 animate-pulse'
            }`}
            title="Configure Provider Credentials"
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
            title="Manage Projects"
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

          {/* City / Location Input */}
          <div className="md:col-span-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <MapPin className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Target Location (e.g. Austin, TX or New York, NY)"
              className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
            />
          </div>

          {/* Action Trigger Buttons */}
          <div className="md:col-span-4 flex items-center gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold py-3 px-5 rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Harvesting {provider.toUpperCase()} Leads...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Pull {limit} Leads</span>
                </>
              )}
            </button>

            {/* Advanced Filters Button */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 rounded-xl border flex items-center gap-1.5 transition ${
                showFilters
                  ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-sm'
                  : 'bg-slate-900/90 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Provider-Specific Advanced Filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PROVIDER-SPECIFIC ADVANCED FILTERS PANEL */}
        {showFilters && (
          <div className="pt-4 border-t border-slate-700/60 space-y-4 animate-in fade-in text-xs">
            <div className="flex items-center justify-between text-slate-400 font-medium">
              <span className="flex items-center gap-2 text-slate-200 font-semibold">
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  {provider === 'apify' && 'Apify Google Maps Scraper Native Filters'}
                  {provider === 'outscraper' && 'Outscraper API v2 Native Filters'}
                  {provider === 'google' && 'Google Places API (New) Parameters'}
                  {provider === 'mock' && 'Sandbox Simulator Settings'}
                </span>
              </span>
            </div>

            {/* CASE 1: APIFY NATIVE FILTERS */}
            {provider === 'apify' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Location & Language */}
                <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/80 space-y-2.5">
                  <label className="block text-slate-300 font-semibold flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-400" />
                    Country & Language
                  </label>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Target Country:</span>
                    <select
                      value={apifyCountry}
                      onChange={(e) => setApifyCountry(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none"
                    >
                      <option value="us">United States (US)</option>
                      <option value="gb">United Kingdom (GB)</option>
                      <option value="ca">Canada (CA)</option>
                      <option value="au">Australia (AU)</option>
                      <option value="de">Germany (DE)</option>
                      <option value="fr">France (FR)</option>
                      <option value="es">Spain (ES)</option>
                      <option value="it">Italy (IT)</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Result Language:</span>
                    <select
                      value={apifyLanguage}
                      onChange={(e) => setApifyLanguage(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none"
                    >
                      <option value="en">English (en)</option>
                      <option value="es">Spanish (es)</option>
                      <option value="fr">French (fr)</option>
                      <option value="de">German (de)</option>
                    </select>
                  </div>
                </div>

                {/* Website Crawling & Email Discovery */}
                <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/80 space-y-2.5">
                  <label className="block text-slate-300 font-semibold flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-purple-400" />
                    Email & Social Extraction
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={apifyExtractEmails}
                      onChange={(e) => setApifyExtractEmails(e.target.checked)}
                      className="rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-900"
                    />
                    <span>Crawl Website for <strong>Emails & Socials</strong></span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={hasPhoneOnly}
                      onChange={(e) => setHasPhoneOnly(e.target.checked)}
                      className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-900"
                    />
                    <span>Must have <strong>Phone Number</strong></span>
                  </label>
                  <p className="text-[10px] text-slate-400 leading-snug">
                    Apify automatically visits the business website to scrape owner contacts.
                  </p>
                </div>

                {/* Website Presence Filter */}
                <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/80 space-y-2">
                  <label className="block text-slate-300 font-semibold flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    Website Presence
                  </label>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                      <input
                        type="radio"
                        name="apifyWebsite"
                        checked={websiteFilter === 'all'}
                        onChange={() => setWebsiteFilter('all')}
                        className="text-blue-600 focus:ring-blue-500 bg-slate-900"
                      />
                      <span>All Businesses</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                      <input
                        type="radio"
                        name="apifyWebsite"
                        checked={websiteFilter === 'no-website'}
                        onChange={() => setWebsiteFilter('no-website')}
                        className="text-blue-600 focus:ring-blue-500 bg-slate-900"
                      />
                      <span className="text-emerald-400 font-medium">No Website (Web Dev Pitch)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                      <input
                        type="radio"
                        name="apifyWebsite"
                        checked={websiteFilter === 'has-website'}
                        onChange={() => setWebsiteFilter('has-website')}
                        className="text-blue-600 focus:ring-blue-500 bg-slate-900"
                      />
                      <span>Has Website (Redesign/SEO)</span>
                    </label>
                  </div>
                </div>

                {/* Batch Limit & Reviews */}
                <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/80 space-y-2.5">
                  <label className="block text-slate-300 font-semibold">
                    Extraction Limit & Reviews
                  </label>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Max Reviews to Scrape:</span>
                    <select
                      value={apifyMaxReviews}
                      onChange={(e) => setApifyMaxReviews(parseInt(e.target.value, 10))}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none"
                    >
                      <option value={0}>0 (Fastest speed)</option>
                      <option value={3}>3 Recent Reviews</option>
                      <option value={5}>5 Reviews (Sentiment)</option>
                      <option value={10}>10 Reviews</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Batch Size:</span>
                    <div className="grid grid-cols-4 gap-1">
                      {[10, 25, 50, 100].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setLimit(num)}
                          className={`py-1.5 rounded-lg font-bold text-center transition ${
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

            {/* CASE 2: OUTSCRAPER NATIVE FILTERS */}
            {provider === 'outscraper' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Region & Language */}
                <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/80 space-y-2.5">
                  <label className="block text-slate-300 font-semibold flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-purple-400" />
                    Region & Language
                  </label>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Region Code:</span>
                    <select
                      value={outscraperRegion}
                      onChange={(e) => setOutscraperRegion(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    >
                      <option value="US">United States (US)</option>
                      <option value="GB">United Kingdom (GB)</option>
                      <option value="CA">Canada (CA)</option>
                      <option value="AU">Australia (AU)</option>
                      <option value="DE">Germany (DE)</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Language:</span>
                    <select
                      value={outscraperLanguage}
                      onChange={(e) => setOutscraperLanguage(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    >
                      <option value="en">English (en)</option>
                      <option value="es">Spanish (es)</option>
                      <option value="de">German (de)</option>
                    </select>
                  </div>
                </div>

                {/* Deduplication & Contact Quality */}
                <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/80 space-y-2.5">
                  <label className="block text-slate-300 font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Outscraper Deduplication
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={outscraperDropDuplicates}
                      onChange={(e) => setOutscraperDropDuplicates(e.target.checked)}
                      className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-900"
                    />
                    <span>Drop Duplicate Places</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={outscraperSkipEmptyPhone}
                      onChange={(e) => setOutscraperSkipEmptyPhone(e.target.checked)}
                      className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-900"
                    />
                    <span>Skip Empty Phone Numbers</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={outscraperSkipEmptyEmail}
                      onChange={(e) => setOutscraperSkipEmptyEmail(e.target.checked)}
                      className="rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-900"
                    />
                    <span>Only Verified Emails</span>
                  </label>
                </div>

                {/* Website Presence */}
                <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/80 space-y-2">
                  <label className="block text-slate-300 font-semibold">
                    Website Filter
                  </label>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="radio"
                        name="outscraperWeb"
                        checked={websiteFilter === 'all'}
                        onChange={() => setWebsiteFilter('all')}
                        className="text-blue-600 bg-slate-900"
                      />
                      <span>All Places</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="radio"
                        name="outscraperWeb"
                        checked={websiteFilter === 'no-website'}
                        onChange={() => setWebsiteFilter('no-website')}
                        className="text-blue-600 bg-slate-900"
                      />
                      <span className="text-emerald-400 font-medium">Without Website Only</span>
                    </label>
                  </div>
                </div>

                {/* Batch Limit */}
                <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/80 space-y-2.5">
                  <label className="block text-slate-300 font-semibold">
                    Limit Batch Volume
                  </label>
                  <div className="grid grid-cols-4 gap-1 pt-1">
                    {[10, 25, 50, 100].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setLimit(num)}
                        className={`py-2 rounded-lg font-bold text-center transition ${
                          limit === num
                            ? 'bg-purple-600 text-white shadow'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* CASE 3: GOOGLE PLACES NATIVE PARAMETERS */}
            {provider === 'google' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Region & Language */}
                <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/80 space-y-2.5">
                  <label className="block text-slate-300 font-semibold flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-amber-400" />
                    Region & Language
                  </label>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Region Code:</span>
                    <select
                      value={googleRegion}
                      onChange={(e) => setGoogleRegion(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    >
                      <option value="US">US - United States</option>
                      <option value="GB">GB - United Kingdom</option>
                      <option value="CA">CA - Canada</option>
                      <option value="AU">AU - Australia</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Language:</span>
                    <select
                      value={googleLanguage}
                      onChange={(e) => setGoogleLanguage(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    >
                      <option value="en">English (en)</option>
                      <option value="es">Spanish (es)</option>
                    </select>
                  </div>
                </div>

                {/* Operating Status & Rating */}
                <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/80 space-y-2.5">
                  <label className="block text-slate-300 font-semibold flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    Rating & Hours
                  </label>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Minimum Rating:</span>
                    <select
                      value={googleMinRating}
                      onChange={(e) => setGoogleMinRating(parseFloat(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    >
                      <option value={0}>Any Rating (0+)</option>
                      <option value={3.5}>3.5★ and above</option>
                      <option value={4.0}>4.0★ and above</option>
                      <option value={4.5}>4.5★ and above</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white pt-1">
                    <input
                      type="checkbox"
                      checked={googleOpenNow}
                      onChange={(e) => setGoogleOpenNow(e.target.checked)}
                      className="rounded border-slate-700 text-amber-600 bg-slate-900"
                    />
                    <span>Open Now Only</span>
                  </label>
                </div>

                {/* Website Presence */}
                <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/80 space-y-2">
                  <label className="block text-slate-300 font-semibold">
                    Website Filter
                  </label>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="radio"
                        name="googleWeb"
                        checked={websiteFilter === 'all'}
                        onChange={() => setWebsiteFilter('all')}
                        className="text-blue-600 bg-slate-900"
                      />
                      <span>All Places</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="radio"
                        name="googleWeb"
                        checked={websiteFilter === 'no-website'}
                        onChange={() => setWebsiteFilter('no-website')}
                        className="text-blue-600 bg-slate-900"
                      />
                      <span className="text-emerald-400 font-medium">Without Website Only</span>
                    </label>
                  </div>
                </div>

                {/* Page Size */}
                <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/80 space-y-2.5">
                  <label className="block text-slate-300 font-semibold">
                    Page Size (Google API)
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Google Places API New allows up to 20 places per request:
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {[10, 20].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setLimit(num)}
                        className={`py-2 rounded-lg font-bold text-center transition ${
                          limit === num
                            ? 'bg-amber-600 text-white shadow'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {num} Places
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* CASE 4: SANDBOX SIMULATOR */}
            {provider === 'mock' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/80 space-y-2">
                  <label className="block text-slate-300 font-semibold">Website Simulation</label>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="radio"
                        name="mockWeb"
                        checked={websiteFilter === 'all'}
                        onChange={() => setWebsiteFilter('all')}
                        className="text-emerald-600 bg-slate-900"
                      />
                      <span>Mixed (With & Without Web)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="radio"
                        name="mockWeb"
                        checked={websiteFilter === 'no-website'}
                        onChange={() => setWebsiteFilter('no-website')}
                        className="text-emerald-600 bg-slate-900"
                      />
                      <span className="text-emerald-400 font-medium">100% Without Website</span>
                    </label>
                  </div>
                </div>

                <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/80 space-y-2">
                  <label className="block text-slate-300 font-semibold">Batch Volume</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[10, 25, 50].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setLimit(num)}
                        className={`py-2 rounded-lg font-bold text-center transition ${
                          limit === num
                            ? 'bg-emerald-600 text-white shadow'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
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
