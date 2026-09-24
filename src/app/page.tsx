'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Lead, PipelineStage, Project } from '@/types/lead';
import SearchBar from '@/components/SearchBar';
import LeadCard from '@/components/LeadCard';
import LeadListView from '@/components/LeadListView';
import PipelineBoard from '@/components/PipelineBoard';
import DashboardLayout from '@/components/DashboardLayout';
import LeadDetailModal from '@/components/LeadDetailModal';
import ExportModal from '@/components/ExportModal';
import SyncModal from '@/components/SyncModal';
import { 
  Target, 
  LayoutGrid, 
  List,
  Kanban, 
  Download, 
  Sparkles, 
  Globe, 
  Smartphone, 
  Zap, 
  Search, 
  RefreshCw, 
  Send,
  Mail
} from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'pipeline'>('grid');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  // Modals for lead actions
  const [showExport, setShowExport] = useState(false);
  const [showSync, setShowSync] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState<'all' | 'no-website' | 'high-score' | 'mobile' | 'has-email'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Per-card loading states
  const [enrichingId, setEnrichingId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const [, startTransition] = useTransition();

  // Load existing leads & projects on mount
  const fetchLeads = async () => {
    try {
      setLoading(true);
      const url = activeProjectId ? `/api/leads?projectId=${activeProjectId}` : '/api/leads';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads || []);
      }
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.success) {
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lead_hunter_active_project');
      if (saved) setActiveProjectId(saved);
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'settings') {
        router.push('/settings');
      }
    }
  }, [router]);

  useEffect(() => {
    fetchLeads();
    fetchProjects();
  }, [activeProjectId]);

  const handleSelectProject = (projectId: string | null) => {
    setActiveProjectId(projectId);
    if (typeof window !== 'undefined') {
      if (projectId) {
        localStorage.setItem('lead_hunter_active_project', projectId);
      } else {
        localStorage.removeItem('lead_hunter_active_project');
      }
    }
  };

  // Run Search
  const handleSearch = async (params: {
    niche: string;
    city: string;
    provider: any;
    apiKey: string;
    projectId?: string;
    limit: number;
    apifyOptions?: any;
    outscraperOptions?: any;
    googleOptions?: any;
    websiteFilter: 'all' | 'no-website' | 'has-website';
    hasPhoneOnly: boolean;
    hasEmailOnly: boolean;
    minReviews: number;
    minRating: number;
  }) => {
    try {
      setLoading(true);
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (data.success) {
        await fetchLeads();
        await fetchProjects();
      } else {
        alert(data.error || 'Search failed');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Search error';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  // Enrich Single Lead
  const handleEnrich = async (leadId: string) => {
    try {
      setEnrichingId(leadId);
      const res = await fetch(`/api/enrich/${leadId}`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.lead) {
        setLeads((prev) => prev.map((l) => (l.id === leadId ? data.lead : l)));
        if (selectedLead?.id === leadId) setSelectedLead(data.lead);
      }
    } catch (err) {
      console.error('Enrichment failed:', err);
    } finally {
      setEnrichingId(null);
    }
  };

  // Generate Outreach for Single Lead
  const handleGenerateOutreach = async (leadId: string) => {
    try {
      setGeneratingId(leadId);
      const res = await fetch(`/api/outreach/${leadId}`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.lead) {
        setLeads((prev) => prev.map((l) => (l.id === leadId ? data.lead : l)));
        if (selectedLead?.id === leadId) setSelectedLead(data.lead);
      }
    } catch (err) {
      console.error('Outreach generation failed:', err);
    } finally {
      setGeneratingId(null);
    }
  };

  // Update Pipeline Stage
  const handleUpdateStage = async (leadId: string, stage: PipelineStage) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipeline: { ...leads.find(l => l.id === leadId)?.pipeline, stage } }),
      });
      const data = await res.json();
      if (data.success && data.lead) {
        setLeads((prev) => prev.map((l) => (l.id === leadId ? data.lead : l)));
        if (selectedLead?.id === leadId) setSelectedLead(data.lead);
      }
    } catch (err) {
      console.error('Failed to update stage:', err);
    }
  };

  // Add Note
  const handleAddNote = async (leadId: string, note: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    const existingNotes = lead.pipeline.notes || [];
    const updatedNotes = [`[${new Date().toLocaleDateString()}] ${note}`, ...existingNotes];

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipeline: { ...lead.pipeline, notes: updatedNotes } }),
      });
      const data = await res.json();
      if (data.success && data.lead) {
        setLeads((prev) => prev.map((l) => (l.id === leadId ? data.lead : l)));
        if (selectedLead?.id === leadId) setSelectedLead(data.lead);
      }
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  };

  // Filter Leads
  const filteredLeads = leads.filter((l) => {
    if (activeProjectId && l.projectId !== activeProjectId) return false;
    if (filterType === 'no-website' && l.website) return false;
    if (filterType === 'high-score' && l.opportunityScore < 70) return false;
    if (filterType === 'mobile' && l.phoneIntelligence?.lineType !== 'MOBILE') return false;
    if (filterType === 'has-email' && !l.email) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = l.businessName.toLowerCase().includes(q);
      const matchCity = l.city.toLowerCase().includes(q);
      const matchOwner = l.ownerDiscovery?.ownerName?.toLowerCase().includes(q);
      const matchNiche = l.category.toLowerCase().includes(q);
      const matchEmail = l.email?.toLowerCase().includes(q);
      if (!matchName && !matchCity && !matchOwner && !matchNiche && !matchEmail) return false;
    }
    return true;
  });

  // Top Metrics
  const totalLeads = filteredLeads.length;
  const noWebsiteCount = filteredLeads.filter((l) => !l.website).length;
  const highScoreCount = filteredLeads.filter((l) => l.opportunityScore >= 70).length;
  const mobileCount = filteredLeads.filter((l) => l.phoneIntelligence?.lineType === 'MOBILE').length;
  const emailCount = filteredLeads.filter((l) => !!l.email).length;

  const currentProjectName = projects.find((p) => p.id === activeProjectId)?.name || 'All Leads';

  return (
    <DashboardLayout activeProjectId={activeProjectId} leadCount={leads.length}>
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <div className="text-base font-bold text-white tracking-tight flex items-center gap-2 truncate">
                <span>Prospecting & Leads</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono truncate">
                  {currentProjectName}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate hidden sm:block">
                Real-time multi-source B2B scraping, scoring & outreach
              </p>
            </div>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* View Switcher: Cards | List | Pipeline */}
            <div className="flex items-center bg-slate-800 border border-slate-700 p-0.5 rounded-xl text-xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'grid'
                    ? 'bg-cyan-600 text-white font-semibold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Card Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Cards</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'list'
                    ? 'bg-cyan-600 text-white font-semibold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Table List View"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden md:inline">List</span>
              </button>
              <button
                onClick={() => setViewMode('pipeline')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'pipeline'
                    ? 'bg-cyan-600 text-white font-semibold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Kanban Pipeline Board"
              >
                <Kanban className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Pipeline</span>
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={fetchLeads}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
              title="Refresh Leads"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Export */}
            <button
              onClick={() => setShowExport(true)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3 py-2 rounded-xl transition"
              title="Export Leads"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* Sync */}
            <button
              onClick={() => setShowSync(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-md transition"
              title="Push filtered leads to external webhook or CRM"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sync</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        {/* Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{totalLeads}</div>
              <div className="text-xs text-slate-400">Total Leads</div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-emerald-400">{noWebsiteCount}</div>
              <div className="text-xs text-slate-400">Zero Web Presence</div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-purple-400">{emailCount}</div>
              <div className="text-xs text-slate-400">Emails Scraped</div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-amber-400">{highScoreCount}</div>
              <div className="text-xs text-slate-400">High Intent (70+)</div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-indigo-400">{mobileCount}</div>
              <div className="text-xs text-slate-400">Mobile Verified</div>
            </div>
          </div>
        </div>

        {/* Multi-Source Search Bar with Project Selector */}
        <SearchBar
          onSearch={handleSearch}
          loading={loading}
          projects={projects}
          activeProjectId={activeProjectId}
          onSelectProject={handleSelectProject}
          onOpenProjectModal={() => router.push('/projects')}
        />

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All Leads ({leads.length})
            </button>

            <button
              onClick={() => setFilterType('has-email')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                filterType === 'has-email'
                  ? 'bg-purple-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>Emails Available</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-900/60 text-[10px]">
                {emailCount}
              </span>
            </button>

            <button
              onClick={() => setFilterType('no-website')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                filterType === 'no-website'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>No Website</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-900/60 text-[10px]">
                {noWebsiteCount}
              </span>
            </button>

            <button
              onClick={() => setFilterType('high-score')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                filterType === 'high-score'
                  ? 'bg-amber-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>Top Drawer (70+)</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-900/60 text-[10px]">
                {highScoreCount}
              </span>
            </button>

            <button
              onClick={() => setFilterType('mobile')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                filterType === 'mobile'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>Direct Mobiles</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-900/60 text-[10px]">
                {mobileCount}
              </span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search business, city, email..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* View Mode Switching: Cards | List | Pipeline */}
        {viewMode === 'grid' && (
          <div>
            {filteredLeads.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl p-8">
                <Target className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white mb-1">No leads in this project view</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                  Select a scraper provider above (Apify, Outscraper, or Sandbox) and pull leads directly into &ldquo;{currentProjectName}&rdquo;.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onSelect={setSelectedLead}
                    onEnrich={handleEnrich}
                    onGenerateOutreach={handleGenerateOutreach}
                    enrichingId={enrichingId}
                    generatingId={generatingId}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {viewMode === 'list' && (
          <LeadListView
            leads={filteredLeads}
            onSelect={setSelectedLead}
            onEnrich={handleEnrich}
            onGenerateOutreach={handleGenerateOutreach}
            onUpdateStage={handleUpdateStage}
            enrichingId={enrichingId}
            generatingId={generatingId}
          />
        )}

        {viewMode === 'pipeline' && (
          <PipelineBoard
            leads={filteredLeads}
            onSelectLead={setSelectedLead}
            onUpdateStage={handleUpdateStage}
          />
        )}
      </main>

      {/* Modals specifically for individual lead actions */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdateStage={handleUpdateStage}
          onAddNote={handleAddNote}
          onGenerateOutreach={handleGenerateOutreach}
        />
      )}

      {showExport && (
        <ExportModal
          leads={filteredLeads}
          onClose={() => setShowExport(false)}
        />
      )}

      {showSync && (
        <SyncModal
          leads={filteredLeads}
          onClose={() => setShowSync(false)}
          onSuccess={fetchLeads}
        />
      )}
    </DashboardLayout>
  );
}
