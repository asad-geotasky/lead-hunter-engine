'use client';

import React, { useState, useEffect } from 'react';
import { Mailbox } from '@/types/lead';
import { 
  X, 
  Mail, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Key, 
  Send,
  HelpCircle
} from 'lucide-react';

interface MailboxSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MailboxSettingsModal({
  isOpen,
  onClose,
}: MailboxSettingsModalProps) {
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
    if (isOpen) {
      fetchMailboxes();
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
    if (!email.trim() || !smtpUser.trim() || !smtpPass.trim()) return;

    try {
      setSaving(true);
      setError(null);
      const res = await fetch('/api/mailboxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          senderName: senderName.trim() || email.trim(),
          smtpHost,
          smtpPort,
          smtpSecure: smtpPort === 465,
          smtpUser: smtpUser.trim(),
          smtpPass: smtpPass.trim(),
          replyTo: replyTo.trim() || undefined,
          dailyLimit: Number(dailyLimit) || 50,
          isActive: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Reset form
        setEmail('');
        setSenderName('');
        setSmtpUser('');
        setSmtpPass('');
        setReplyTo('');
        setTestResult(null);
        setShowAddForm(false);
        await fetchMailboxes();
      } else {
        setError(data.error || 'Failed to save mailbox');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving mailbox';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this mailbox?')) return;
    try {
      await fetch(`/api/mailboxes/${id}`, { method: 'DELETE' });
      await fetchMailboxes();
    } catch (err) {
      console.error('Failed to delete mailbox:', err);
    }
  };

  const totalDailyCapacity = mailboxes.reduce((acc, m) => acc + m.dailyLimit, 0);
  const totalSentToday = mailboxes.reduce((acc, m) => acc + m.sentToday, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Sending Mailbox Management</h2>
              <p className="text-xs text-slate-400">
                Rotate multiple Gmail / Workspace accounts to maximize cold email deliverability
              </p>
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
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5">
              <div className="text-xs text-slate-400">Configured Mailboxes</div>
              <div className="text-2xl font-bold text-white mt-1">{mailboxes.length} accounts</div>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5">
              <div className="text-xs text-slate-400">Total Daily Sending Capacity</div>
              <div className="text-2xl font-bold text-purple-400 mt-1">{totalDailyCapacity} emails/day</div>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5">
              <div className="text-xs text-slate-400">Sent Today (Safety Quota)</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                {totalSentToday} / {totalDailyCapacity}
              </div>
            </div>
          </div>

          {/* Add Mailbox Button / Form */}
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-3 border border-dashed border-slate-700 hover:border-purple-500 rounded-xl text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-center gap-2 transition bg-slate-800/30 hover:bg-slate-800/60"
            >
              <Plus className="w-4 h-4 text-purple-400" />
              Add New Gmail / Google Workspace Mailbox
            </button>
          ) : (
            <form onSubmit={handleAddMailbox} className="bg-slate-800/80 border border-purple-500/40 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-purple-400" />
                  Connect Gmail / Google Workspace Account
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              {/* Helpful instructions banner */}
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg text-xs text-purple-200 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <strong>How to connect Gmail:</strong> Enable 2-Step Verification on your Google Account, go to Security &gt; <em>App Passwords</em>, generate a 16-character password for &quot;Mail&quot;, and paste it below.
                </div>
              </div>

              {error && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Sender Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (!smtpUser) setSmtpUser(e.target.value);
                    }}
                    placeholder="sales@yourdomain.com"
                    required
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Sender Display Name</label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Asad - Growth Specialist"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Google App Password (16 chars)</label>
                  <input
                    type="password"
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    placeholder="xxxx xxxx xxxx xxxx"
                    required
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Reply-To Address (Where client replies go)
                  </label>
                  <input
                    type="email"
                    value={replyTo}
                    onChange={(e) => setReplyTo(e.target.value)}
                    placeholder="your-primary-inbox@gmail.com"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Daily Sending Limit</label>
                  <input
                    type="number"
                    min="5"
                    max="500"
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Recommended: 40-50 for high deliverability</span>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">SMTP Host & Port</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                    <input
                      type="number"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(parseInt(e.target.value, 10))}
                      className="w-20 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                </div>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    testResult.success
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                      : 'bg-red-500/10 border border-red-500/30 text-red-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  {testing ? 'Testing SMTP...' : 'Test Connection'}
                </button>

                <button
                  type="submit"
                  disabled={saving || !email.trim() || !smtpPass.trim()}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-md transition"
                >
                  {saving ? 'Saving...' : 'Save Mailbox'}
                </button>
              </div>
            </form>
          )}

          {/* Connected Mailboxes List */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Connected Mailboxes ({mailboxes.length})
            </h3>

            {mailboxes.length === 0 ? (
              <div className="p-8 text-center bg-slate-800/30 border border-slate-800 rounded-xl text-slate-400 text-xs">
                No mailboxes connected yet. Add 2-3 Gmail accounts to enable cold email automation.
              </div>
            ) : (
              mailboxes.map((m) => {
                const percent = Math.min(100, Math.round((m.sentToday / m.dailyLimit) * 100));
                return (
                  <div
                    key={m.id}
                    className="p-4 bg-slate-800/40 border border-slate-700/80 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-white">{m.senderName}</h4>
                          <span className="text-xs text-slate-400">({m.email})</span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>Host: {m.smtpHost}:{m.smtpPort}</span>
                          {m.replyTo && (
                            <span>• Reply-To: <strong className="text-purple-300">{m.replyTo}</strong></span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Daily Quota Progress */}
                      <div className="w-36 text-xs">
                        <div className="flex justify-between text-slate-300 mb-1">
                          <span>Today&apos;s sent</span>
                          <span className="font-bold">{m.sentToday}/{m.dailyLimit}</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              percent >= 90 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(m.id)}
                        className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition"
                        title="Remove Mailbox"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
