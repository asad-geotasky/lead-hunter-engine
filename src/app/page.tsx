'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { Lead, PipelineStage } from '@/types/lead';
import SearchBar from '@/components/SearchBar';
import LeadCard from '@/components/LeadCard';
import PipelineBoard from '@/components/PipelineBoard';
import LeadDetailModal from '@/components/LeadDetailModal';
import ExportModal from '@/components/ExportModal';
import SyncModal from '@/components/SyncModal';
import { 
  Target, 
  LayoutGrid, 
  Kanban, 
  Download, 
  Sparkles, 
  Globe, 
  Smartphone, 
  Zap,
  Search,
  RefreshCw,
  Send
} from 'lucide-react';

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'pipeline'>('grid');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showSync, setShowSync] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState<'all' | 'no-website' | 'high-score' | 'mobile'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Per-card loading states
  const [enrichingId, setEnrichingId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const [, startTransition] = useTransition();

  // Load existing leads on mount
  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/leads');
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

  useEffect(() => {
    fetchLeads();
  }, []);

  // Run Search
  const handleSearch = async (params: {
    niche: string;
    city: string;
    apiKey: string;
    filterNoWebsite: boolean;
    minScore: number;
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
        // Refetch full leads to refresh states
        await fetchLeads();
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
    if (filterType === 'no-website' && l.website) return false;
    if (filterType === 'high-score' && l.opportunityScore < 70) return false;
    if (filterType === 'mobile' && l.phoneIntelligence?.lineType !== 'MOBILE') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = l.businessName.toLowerCase().includes(q);
      const matchCity = l.city.toLowerCase().includes(q);
      const matchOwner = l.ownerDiscovery?.ownerName?.toLowerCase().includes(q);
      const matchNiche = l.category.toLowerCase().includes(q);
      if (!matchName && !matchCity && !matchOwner && !matchNiche) return false;
    }
    return true;
  });

  // Top Metrics
  const totalLeads = leads.length;
  const noWebsiteCount = leads.filter((l) => !l.website).length;
  const highScoreCount = leads.filter((l) => l.opportunityScore >= 70).length;
  const mobileCount = leads.filter((l) => l.phoneIntelligence?.lineType === 'MOBILE').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                LeadHunter Engine
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                  v2.0 PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Enrichment &amp; Instant Mockup Outreach CRM</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Switcher */}
            <div className="flex items-center bg-slate-800 border border-slate-700 p-0.5 rounded-xl text-xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white font-semibold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid</span>
              </button>
              <button
                onClick={() => setViewMode('pipeline')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'pipeline'
                    ? 'bg-blue-600 text-white font-semibold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>Pipeline</span>
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
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3.5 py-2 rounded-xl transition"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Export</span>
            </button>

            {/* Campaign Sync */}
            <button
              onClick={() => setShowSync(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-md transition"
              title="Push filtered leads to Instantly, Smartlead, or Webhook"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Sync ({filteredLeads.length})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-8">
        {/* Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-amber-400">{highScoreCount}</div>
              <div className="text-xs text-slate-400">High Intent (70+ Pts)</div>
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

        {/* Search Engine Form */}
        <SearchBar onSearch={handleSearch} loading={loading} />

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
              placeholder="Search business, city, owner..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* View Mode Switching */}
        {viewMode === 'grid' ? (
          <div>
            {filteredLeads.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl p-8">
                <Target className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white mb-1">No leads match this view</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                  Run a search above for any niche and city (e.g., &ldquo;Plumbers in Austin, TX&rdquo;) to pull high-intent prospects.
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
        ) : (
          <PipelineBoard
            leads={filteredLeads}
            onSelectLead={setSelectedLead}
            onUpdateStage={handleUpdateStage}
          />
        )}
      </main>

      {/* Lead Detail / Outreach Modal */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdateStage={handleUpdateStage}
          onAddNote={handleAddNote}
          onGenerateOutreach={handleGenerateOutreach}
        />
      )}

      {/* Export Modal */}
      {showExport && (
        <ExportModal
          leads={filteredLeads}
          onClose={() => setShowExport(false)}
        />
      )}

      {/* Campaign Sync Modal */}
      {showSync && (
        <SyncModal
          leads={filteredLeads}
          onClose={() => setShowSync(false)}
          onSuccess={fetchLeads}
        />
      )}
    </div>
  );
}
