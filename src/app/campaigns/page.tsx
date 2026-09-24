'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { Campaign, Project, EmailLog } from '@/types/lead';
import { 
  Flame, 
  Send, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Play, 
  Sparkles, 
  Mail, 
  Layers, 
  ChevronRight, 
  RefreshCw,
  Trash2,
  Eye,
  FileText
} from 'lucide-react';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  // New Campaign Form
  const [projectId, setProjectId] = useState<string>('');
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('Quick question regarding {{businessName}} mobile experience');
  const [bodyTemplate, setBodyTemplate] = useState(`Hi {{ownerName}},

I noticed {{businessName}} has great local reviews in {{city}}, but when potential customers visit your website on mobile, there are a few conversion leaks that might be costing you calls and bookings.

We built a live interactive mobile preview showing how a modern, fast booking interface could look for {{businessName}}:

{{previewUrl}}

Take a look whenever you have 2 minutes. Would love to hear your thoughts!

Best regards,
Lead Hunter Team`);
  const [delaySeconds, setDelaySeconds] = useState(90);

  // Sending state
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testStatus, setTestStatus] = useState<{ success: boolean; message: string } | null>(null);

  const [runningBatch, setRunningBatch] = useState(false);
  const [batchStatus, setBatchStatus] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns || []);
        if (data.campaigns?.length > 0 && !selectedCampaign) {
          setSelectedCampaign(data.campaigns[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.success && data.projects) {
        setProjects(data.projects);
        if (!projectId && data.projects.length > 0) {
          setProjectId(data.projects[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  };

  const fetchCampaignLogs = async (campId: string) => {
    try {
      const res = await fetch(`/api/campaigns/${campId}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        if (data.campaign) {
          setSelectedCampaign(data.campaign);
        }
      }
    } catch (err) {
      console.error('Failed to fetch campaign logs:', err);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedCampaign) {
      fetchCampaignLogs(selectedCampaign.id);
    }
  }, [selectedCampaign?.id]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !projectId) return;

    try {
      setLoading(true);
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          name: name.trim(),
          subject: subject.trim(),
          bodyTemplate,
          delaySeconds: Number(delaySeconds),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setName('');
        setShowCreate(false);
        await fetchCampaigns();
        setSelectedCampaign(data.campaign);
      } else {
        alert(data.error || 'Failed to create campaign');
      }
    } catch (err) {
      console.error('Failed to create campaign:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTest = async () => {
    if (!selectedCampaign || !testEmail.trim()) {
      alert('Please enter your email to receive the test pitch.');
      return;
    }

    try {
      setSendingTest(true);
      setTestStatus(null);
      const res = await fetch('/api/mailboxes/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testRecipient: testEmail.trim(),
          sampleSubject: selectedCampaign.subject.replace('{{businessName}}', 'Acme Services LLC'),
          sampleBody: selectedCampaign.bodyTemplate
            .replace(/{{businessName}}/g, 'Acme Services LLC')
            .replace(/{{ownerName}}/g, 'John Doe')
            .replace(/{{city}}/g, 'Austin, TX')
            .replace(/{{category}}/g, 'HVAC Services')
            .replace(/{{previewUrl}}/g, window.location.origin + '/preview/sample'),
        }),
      });

      const data = await res.json();
      setTestStatus(data);
    } catch (err: any) {
      setTestStatus({ success: false, message: err?.message || 'Failed to send test email' });
    } finally {
      setSendingTest(false);
    }
  };

  const handleStartBatch = async () => {
    if (!selectedCampaign) return;
    if (!confirm(`Are you ready to launch "${selectedCampaign.name}"? Outreach will rotate through your active connected mailboxes with a ${selectedCampaign.delaySeconds}s delay.`)) {
      return;
    }

    try {
      setRunningBatch(true);
      setBatchStatus('Dispatching sequence in background...');
      const res = await fetch(`/api/campaigns/${selectedCampaign.id}/send`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setBatchStatus(data.message);
        await fetchCampaignLogs(selectedCampaign.id);
        await fetchCampaigns();
      } else {
        setBatchStatus('Sequence stopped: ' + data.error);
      }
    } catch (err: any) {
      setBatchStatus('Error: ' + err.message);
    } finally {
      setRunningBatch(false);
    }
  };

  const insertToken = (token: string) => {
    setBodyTemplate((prev) => prev + token);
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Flame className="w-6 h-6 text-amber-400" />
              <span>Cold Email Campaigns & Sequences</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Personalized prospect outreach with round-robin mailbox rotation and anti-spam delay protection
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/mailboxes"
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-800 transition"
            >
              <Mail className="w-3.5 h-3.5 text-purple-400" />
              <span>Manage Mailboxes</span>
            </Link>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showCreate ? 'Close Form' : 'New Campaign Sequence'}</span>
            </button>
          </div>
        </div>

        {/* Create Campaign Form View */}
        {showCreate && (
          <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">Create New Outreach Sequence</h2>
              </div>
              <button
                onClick={() => setShowCreate(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Campaign Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Austin Plumbers Redesign Pitch"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Target Project Workspace *</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.leadCount || 0} leads)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Email Subject Template</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">Email Body Template</label>
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="text-slate-400">Insert tag:</span>
                    {['{{businessName}}', '{{city}}', '{{ownerName}}', '{{previewUrl}}', '{{category}}'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => insertToken(tag)}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 font-mono border border-slate-700 transition"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  rows={8}
                  value={bodyTemplate}
                  onChange={(e) => setBodyTemplate(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-amber-500 resize-y"
                />
              </div>

              <div className="w-full sm:w-64">
                <label className="text-xs font-semibold text-slate-300 mb-1 block">
                  Delay Between Sends (Seconds)
                </label>
                <input
                  type="number"
                  min={30}
                  max={600}
                  value={delaySeconds}
                  onChange={(e) => setDelaySeconds(Number(e.target.value))}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">Recommended: 90s to keep sender domain healthy</p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl shadow-lg transition"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Main 2-Column Interface: Campaigns List on Left, Active Campaign & Logs on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Campaigns List */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center justify-between">
              <span>All Campaigns ({campaigns.length})</span>
            </h2>

            {campaigns.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 text-xs text-slate-400">
                No campaigns yet. Click &ldquo;New Campaign Sequence&rdquo; above.
              </div>
            ) : (
              <div className="space-y-2.5">
                {campaigns.map((camp) => {
                  const isSelected = selectedCampaign?.id === camp.id;
                  const sentCount = camp.sentCount || 0;

                  return (
                    <div
                      key={camp.id}
                      onClick={() => setSelectedCampaign(camp)}
                      className={`p-4 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 border-amber-500/80 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/20'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="font-bold text-white text-xs truncate">{camp.name}</div>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full border font-mono ${
                          camp.status === 'RUNNING'
                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 animate-pulse'
                            : camp.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {camp.status}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 truncate mb-3">
                        {camp.subject}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/80 pt-2 font-mono">
                        <span>Workspace: {projects.find((p) => p.id === camp.projectId)?.name || 'Project'}</span>
                        <span className="text-amber-400 font-bold">{sentCount} sent</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right 2 Columns: Selected Campaign Workspace & Logs */}
          <div className="lg:col-span-2 space-y-6">
            {selectedCampaign ? (
              <>
                {/* Active Campaign Card */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                    <div>
                      <div className="text-base font-bold text-white flex items-center gap-2">
                        <span>{selectedCampaign.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-mono">
                          {selectedCampaign.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Target Workspace: <strong>{projects.find((p) => p.id === selectedCampaign.projectId)?.name || 'Selected Project'}</strong>
                      </div>
                    </div>

                    {/* Launch Batch Button */}
                    <button
                      onClick={handleStartBatch}
                      disabled={runningBatch}
                      className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                    >
                      {runningBatch ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Dispatching Sequence...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-white" />
                          <span>Launch Sequence</span>
                        </>
                      )}
                    </button>
                  </div>

                  {batchStatus && (
                    <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-xl text-cyan-300 text-xs flex items-center gap-2">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>{batchStatus}</span>
                    </div>
                  )}

                  {/* Template Subject & Preview */}
                  <div className="space-y-2">
                    <div className="text-xs text-slate-400 font-medium">Subject Line:</div>
                    <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-mono text-cyan-300">
                      {selectedCampaign.subject}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs text-slate-400 font-medium">Email Body Template:</div>
                    <pre className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                      {selectedCampaign.bodyTemplate}
                    </pre>
                  </div>

                  {/* Send 1-Off Test Email */}
                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-amber-400" />
                      <span>Send 1-Off Test to Personal Inbox</span>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="email"
                        placeholder="your-personal-email@domain.com"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        className="flex-1 bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={handleSendTest}
                        disabled={sendingTest || !testEmail.trim()}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {sendingTest ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        <span>Send Test</span>
                      </button>
                    </div>

                    {testStatus && (
                      <div
                        className={`p-2.5 rounded-xl text-xs flex items-center gap-2 border ${
                          testStatus.success
                            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                            : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                        }`}
                      >
                        {testStatus.success ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                        <span>{testStatus.message}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Email Logs Table */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Delivery Logs & Activity</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-mono">
                        {logs.length}
                      </span>
                    </h3>
                    <button
                      onClick={() => fetchCampaignLogs(selectedCampaign.id)}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Refresh Logs</span>
                    </button>
                  </div>

                  {logs.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500">
                      No emails sent yet for this campaign. Click &ldquo;Launch Sequence&rdquo; above to start.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-500">
                            <th className="py-2 px-3">Recipient</th>
                            <th className="py-2 px-3">Status</th>
                            <th className="py-2 px-3">Sent At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono">
                          {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-800/40">
                              <td className="py-2.5 px-3 text-slate-200">{log.recipient}</td>
                              <td className="py-2.5 px-3">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                  log.status === 'SENT'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                    : log.status === 'FAILED'
                                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                }`}>
                                  {log.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 text-[10px]">
                                {log.sentAt ? new Date(log.sentAt).toLocaleString() : 'Pending'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-24 bg-slate-900/40 border border-slate-800 rounded-2xl p-8 text-slate-400 text-xs">
                Select a campaign from the left column to view details, test, and launch sequences.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
