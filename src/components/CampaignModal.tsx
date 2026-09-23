'use client';

import React, { useState, useEffect } from 'react';
import { Campaign, Project, EmailLog } from '@/types/lead';
import { 
  X, 
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
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  activeProjectId: string | null;
  onOpenMailboxModal: () => void;
}

export default function CampaignModal({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onOpenMailboxModal,
}: CampaignModalProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  // New Campaign Form
  const [projectId, setProjectId] = useState<string>(activeProjectId || (projects[0]?.id || ''));
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
    if (isOpen) {
      fetchCampaigns();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedCampaign) {
      fetchCampaignLogs(selectedCampaign.id);
    }
  }, [selectedCampaign?.id]);

  if (!isOpen) return null;

  const insertVariable = (tag: string) => {
    setBodyTemplate((prev) => `${prev} {{${tag}}}`);
  };

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
          delaySeconds,
        }),
      });

      const data = await res.json();
      if (data.success && data.campaign) {
        setShowCreate(false);
        await fetchCampaigns();
        setSelectedCampaign(data.campaign);
      } else {
        alert(data.error || 'Failed to create campaign');
      }
    } catch (err) {
      console.error('Error creating campaign:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail || !testEmail.includes('@') || !selectedCampaign) {
      alert('Please enter a valid test email address.');
      return;
    }

    try {
      setSendingTest(true);
      setTestStatus(null);
      const res = await fetch(`/api/campaigns/${selectedCampaign.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmail: testEmail.trim() }),
      });
      const data = await res.json();
      setTestStatus({
        success: data.success,
        message: data.message || data.error || 'Test email completed',
      });
      await fetchCampaignLogs(selectedCampaign.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send test email';
      setTestStatus({ success: false, message: msg });
    } finally {
      setSendingTest(false);
    }
  };

  const handleLaunchBatch = async () => {
    if (!selectedCampaign) return;
    if (!confirm('Start sending cold email batch for this project? Emails will be rotated across your configured mailboxes.')) {
      return;
    }

    try {
      setRunningBatch(true);
      setBatchStatus('Dispatching batch with anti-spam rotation...');
      const res = await fetch(`/api/campaigns/${selectedCampaign.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxToSend: 20 }),
      });
      const data = await res.json();
      if (data.success) {
        setBatchStatus(data.message);
      } else {
        setBatchStatus(`Error: ${data.error}`);
      }
      await fetchCampaignLogs(selectedCampaign.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Batch send error';
      setBatchStatus(`Failed: ${msg}`);
    } finally {
      setRunningBatch(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Cold Email Campaign Automation</h2>
              <p className="text-xs text-slate-400">
                Multi-mailbox rotation, personalized dynamic preview links, and reply preservation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenMailboxModal}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-purple-300 border border-purple-500/30 flex items-center gap-1.5 transition"
            >
              <Mail className="w-3.5 h-3.5 text-purple-400" />
              Configure Mailboxes
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Container */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          {/* Left Column: Campaigns List */}
          <div className="md:col-span-4 border-r border-slate-800 p-4 overflow-y-auto space-y-3 bg-slate-900/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Campaigns ({campaigns.length})
              </span>
              <button
                onClick={() => setShowCreate(true)}
                className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                New
              </button>
            </div>

            {campaigns.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs bg-slate-800/30 rounded-xl border border-slate-800">
                No campaigns yet. Click New to create your first outreach sequence.
              </div>
            ) : (
              campaigns.map((c) => {
                const isSelected = selectedCampaign?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedCampaign(c);
                      setShowCreate(false);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? 'bg-blue-600/10 border-blue-500/60 text-white'
                        : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-xs text-white truncate max-w-[180px]">{c.name}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                        {c.sentCount || 0} sent
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                      <Layers className="w-3 h-3 text-indigo-400" />
                      <span>{c.projectName || 'Default Project'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Campaign Content / Creation / Execution */}
          <div className="md:col-span-8 p-6 overflow-y-auto space-y-5">
            {showCreate ? (
              /* Create Campaign Form */
              <form onSubmit={handleCreateCampaign} className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    Create New Outreach Campaign
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Target Project</label>
                    <select
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          📁 {p.name} ({p.leadCount || 0} leads)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Campaign Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Italian Restaurants - Spring Outreach"
                      required
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500"
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block text-slate-300 font-medium mb-1">Subject Line</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs"
                  />
                </div>

                <div className="text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-medium">Email Body Template</label>
                    <div className="flex flex-wrap gap-1">
                      {['businessName', 'city', 'ownerName', 'previewUrl', 'category'].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => insertVariable(tag)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 text-[10px]"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    rows={8}
                    value={bodyTemplate}
                    onChange={(e) => setBodyTemplate(e.target.value)}
                    required
                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Pacing Delay:</span>
                    <input
                      type="number"
                      min="30"
                      max="300"
                      value={delaySeconds}
                      onChange={(e) => setDelaySeconds(parseInt(e.target.value, 10))}
                      className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white"
                    />
                    <span>seconds</span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !name.trim()}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-md transition"
                  >
                    Save & Initialize Campaign
                  </button>
                </div>
              </form>
            ) : selectedCampaign ? (
              /* Campaign Details & Execution */
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white">{selectedCampaign.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Subject: <strong className="text-slate-200">{selectedCampaign.subject}</strong>
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {selectedCampaign.status}
                  </span>
                </div>

                {/* Test Send Box */}
                <div className="p-4 bg-slate-800/40 border border-slate-700/80 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Test Deliverability (Single Send)
                  </h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="Enter your personal email (e.g. me@gmail.com)"
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500"
                    />
                    <button
                      onClick={handleSendTest}
                      disabled={sendingTest || !testEmail.trim()}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      {sendingTest ? 'Sending Test...' : 'Send Test'}
                    </button>
                  </div>

                  {testStatus && (
                    <div
                      className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                        testStatus.success
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                          : 'bg-red-500/10 text-red-300 border border-red-500/30'
                      }`}
                    >
                      {testStatus.success ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                      <span>{testStatus.message}</span>
                    </div>
                  )}
                </div>

                {/* Batch Launcher */}
                <div className="p-4 bg-blue-600/10 border border-blue-500/30 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">Automate Project Outreach</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Rotates emails across your configured accounts with safe jitter delays
                    </p>
                    {batchStatus && (
                      <p className="text-xs text-blue-300 font-medium mt-1">{batchStatus}</p>
                    )}
                  </div>
                  <button
                    onClick={handleLaunchBatch}
                    disabled={runningBatch}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    {runningBatch ? 'Dispatching...' : 'Launch Batch (20 Leads)'}
                  </button>
                </div>

                {/* Delivery Logs */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Recent Delivery Logs ({logs.length})
                    </h4>
                    <button
                      onClick={() => fetchCampaignLogs(selectedCampaign.id)}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Refresh
                    </button>
                  </div>

                  {logs.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-xs bg-slate-800/30 rounded-xl border border-slate-800">
                      No emails sent yet for this campaign.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {logs.map((log) => (
                        <div
                          key={log.id}
                          className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-lg flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-semibold text-white">{log.recipient}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              {log.mailboxEmail && <span>Via: {log.mailboxEmail}</span>}
                              {log.sentAt && <span>• {new Date(log.sentAt).toLocaleTimeString()}</span>}
                            </div>
                          </div>

                          <div>
                            {log.status === 'SENT' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Sent
                              </span>
                            ) : (
                              <span
                                className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-1"
                                title={log.error || 'Failed'}
                              >
                                <AlertCircle className="w-3 h-3" /> Failed
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 text-xs">
                Select a campaign from the left or create a new one.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
