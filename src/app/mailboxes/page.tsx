'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Mailbox } from '@/types/lead';
import { 
  Mail, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Key, 
  Send,
  HelpCircle,
  Hash,
  Server
} from 'lucide-react';

export default function MailboxesPage() {
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [senderName, setSenderName] = useState('');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [dailyLimit, setDailyLimit] = useState(50);
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(465);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Test single mailbox send state
  const [testingSendId, setTestingSendId] = useState<string | null>(null);
  const [testSendResult, setTestSendResult] = useState<{ [id: string]: { success: boolean; msg: string } }>({});

  const fetchMailboxes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/mailboxes');
      const data = await res.json();
      if (data.success) {
        setMailboxes(data.mailboxes || []);
      }
    } catch (err) {
      console.error('Failed to load mailboxes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMailboxes();
  }, []);

  const handleTestConnection = async () => {
    if (!smtpUser.trim() || !smtpPass.trim()) {
      alert('Please enter SMTP user and App Password first');
      return;
    }

    try {
      setTesting(true);
      setTestResult(null);
      const res = await fetch('/api/mailboxes/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpHost,
          smtpPort,
          smtpSecure: smtpPort === 465,
          smtpUser: smtpUser.trim(),
          smtpPass: smtpPass.trim(),
        }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Test failed';
      setTestResult({ success: false, message: msg });
    } finally {
      setTesting(false);
    }
  };

  const handleAddMailbox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !senderName.trim() || !smtpPass.trim()) return;

    try {
      setSaving(true);
      setError(null);
      const res = await fetch('/api/mailboxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          senderName: senderName.trim(),
          smtpUser: (smtpUser.trim() || email.trim()).toLowerCase(),
          smtpPass: smtpPass.trim(),
          replyTo: replyTo.trim().toLowerCase() || undefined,
          dailyLimit: Number(dailyLimit),
          smtpHost,
          smtpPort: Number(smtpPort),
          smtpSecure: smtpPort === 465,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEmail('');
        setSenderName('');
        setSmtpUser('');
        setSmtpPass('');
        setReplyTo('');
        setTestResult(null);
        setShowAddForm(false);
        await fetchMailboxes();
      } else {
        setError(data.error || 'Failed to add mailbox');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save mailbox';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await fetch(`/api/mailboxes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      await fetchMailboxes();
    } catch (err) {
      console.error('Toggle active failed:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to disconnect this mailbox?')) return;
    try {
      await fetch(`/api/mailboxes/${id}`, { method: 'DELETE' });
      await fetchMailboxes();
    } catch (err) {
      console.error('Delete mailbox failed:', err);
    }
  };

  // Quick 1-off send test to user's address
  const handleQuickSendTest = async (mailbox: Mailbox) => {
    const targetEmail = prompt('Enter an email address to send a deliverability test to:', mailbox.email);
    if (!targetEmail) return;

    setTestingSendId(mailbox.id);
    try {
      const res = await fetch('/api/mailboxes/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpHost: mailbox.smtpHost,
          smtpPort: mailbox.smtpPort,
          smtpSecure: mailbox.smtpSecure,
          smtpUser: mailbox.smtpUser,
          smtpPass: mailbox.smtpPass,
          testRecipient: targetEmail,
        }),
      });
      const data = await res.json();
      setTestSendResult((prev) => ({
        ...prev,
        [mailbox.id]: { success: data.success, msg: data.message },
      }));
    } catch (err: any) {
      setTestSendResult((prev) => ({
        ...prev,
        [mailbox.id]: { success: false, msg: err.message },
      }));
    } finally {
      setTestingSendId(null);
    }
  };

  const totalDailyQuota = mailboxes.reduce((acc, m) => acc + (m.isActive ? m.dailyLimit : 0), 0);
  const totalSentToday = mailboxes.reduce((acc, m) => acc + m.sentToday, 0);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Mail className="w-6 h-6 text-purple-400" />
              <span>Multi-Mailbox Gmail Rotation</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Connect 2-3 sender accounts to rotate outreach, prevent spam flags, and route replies to your primary inbox
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchMailboxes}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
              title="Refresh Mailboxes"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'Close Form' : 'Connect Mailbox'}</span>
            </button>
          </div>
        </div>

        {/* Quota Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-bold text-white">{mailboxes.length} Accounts</div>
              <div className="text-xs text-slate-400">
                {mailboxes.filter((m) => m.isActive).length} active in rotation
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-bold text-white">{totalDailyQuota} Emails / Day</div>
              <div className="text-xs text-slate-400">Safe combined sending limit</div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-bold text-white">{totalSentToday} Sent Today</div>
              <div className="text-xs text-slate-400">Auto-resets midnight UTC</div>
            </div>
          </div>
        </div>

        {/* Connect Mailbox Form */}
        {showAddForm && (
          <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-purple-400" />
                <h2 className="text-base font-bold text-white">Connect Sender Account (Gmail / Google Workspace)</h2>
              </div>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleAddMailbox} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Sender Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="sales.outreach@yourcompany.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (!smtpUser) setSmtpUser(e.target.value);
                    }}
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Sender Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex from LeadHunter"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">
                    Google App Password (16 chars) *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="abcd efgh ijkl mnop"
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Generate this in your Google Account Security &gt; 2-Step Verification &gt; App Passwords.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Daily Send Limit</label>
                  <input
                    type="number"
                    min={5}
                    max={200}
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(Number(e.target.value))}
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Recommended: 40-50 / day</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">
                  Primary Reply-To Address (Crucial for rotation!)
                </label>
                <input
                  type="email"
                  placeholder="your-primary-inbox@yourcompany.com"
                  value={replyTo}
                  onChange={(e) => setReplyTo(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Emails are sent using this rotating account, but customer replies will land directly in this Primary Inbox.
                </p>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                    testResult.success
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing || !smtpPass}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {testing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  )}
                  <span>Test Connection</span>
                </button>

                <button
                  type="submit"
                  disabled={saving || !email || !smtpPass}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Save Mailbox Account</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Connected Mailboxes Grid */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Connected Mailbox Rotation Pool</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-mono">
              {mailboxes.length}
            </span>
          </h2>

          {mailboxes.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl p-8">
              <Mail className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">No Mailboxes Connected</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                Click &ldquo;Connect Mailbox&rdquo; above to link Gmail or Google Workspace accounts for automated cold email campaigns.
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition"
              >
                Add Your First Mailbox
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mailboxes.map((mailbox) => {
                const percent = Math.min(100, Math.round((mailbox.sentToday / mailbox.dailyLimit) * 100));
                const sendTest = testSendResult[mailbox.id];

                return (
                  <div
                    key={mailbox.id}
                    className={`p-6 rounded-2xl border transition-all ${
                      mailbox.isActive
                        ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                        : 'bg-slate-900/40 border-slate-800/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          <span>{mailbox.senderName}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                            mailbox.isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {mailbox.isActive ? 'IN ROTATION' : 'PAUSED'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">{mailbox.email}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleActive(mailbox.id, mailbox.isActive)}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition ${
                            mailbox.isActive
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
                          }`}
                        >
                          {mailbox.isActive ? 'Pause' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(mailbox.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 transition"
                          title="Disconnect Mailbox"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Quota Progress */}
                    <div className="space-y-1.5 mb-4">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Daily Quota Usage:</span>
                        <span className="font-mono text-white">
                          {mailbox.sentToday} / {mailbox.dailyLimit} sent ({percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            percent >= 90 ? 'bg-rose-500' : percent >= 60 ? 'bg-amber-500' : 'bg-purple-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Metadata Details */}
                    <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                      <div>
                        <span>Reply-To: </span>
                        <strong className="text-slate-300">{mailbox.replyTo || mailbox.email}</strong>
                      </div>
                      <div className="text-right font-mono text-[10px] text-slate-500">
                        {mailbox.smtpHost}:{mailbox.smtpPort}
                      </div>
                    </div>

                    {/* Quick Send Test Button */}
                    <div className="pt-3 mt-3 border-t border-slate-800/60 flex items-center justify-between">
                      <button
                        onClick={() => handleQuickSendTest(mailbox)}
                        disabled={testingSendId === mailbox.id}
                        className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1.5"
                      >
                        {testingSendId === mailbox.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>Send Deliverability Test</span>
                      </button>

                      {sendTest && (
                        <span className={`text-[11px] ${sendTest.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {sendTest.success ? 'Test Sent!' : 'Send Failed'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
