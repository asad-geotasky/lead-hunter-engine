'use client';

import React, { useState, useEffect } from 'react';
import { X, Server, ShieldCheck, Mail, Key, Hash, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface SystemSmtpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SystemSmtpModal({ isOpen, onClose }: SystemSmtpModalProps) {
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(465);
  const [smtpSecure, setSmtpSecure] = useState(true);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFrom, setSmtpFrom] = useState('');

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSmtpConfig();
    }
  }, [isOpen]);

  const fetchSmtpConfig = async () => {
    try {
      const res = await fetch('/api/auth/smtp');
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setSmtpHost(data.config.smtpHost || 'smtp.gmail.com');
          setSmtpPort(data.config.smtpPort || 465);
          setSmtpSecure(data.config.smtpSecure ?? true);
          setSmtpUser(data.config.smtpUser || '');
          setSmtpPass(data.config.smtpPass || '');
          setSmtpFrom(data.config.smtpFrom || '');
        }
      }
    } catch (err) {
      console.error('Error fetching SMTP config:', err);
    }
  };

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/auth/smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpHost,
          smtpPort,
          smtpSecure,
          smtpUser,
          smtpPass,
          smtpFrom: smtpFrom || smtpUser,
          testOnly: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: '✅ ' + data.message });
      } else {
        setStatusMessage({ type: 'error', text: '❌ ' + (data.message || data.error || 'Connection failed.') });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: '❌ ' + (err.message || 'Test request failed.') });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/auth/smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpHost,
          smtpPort,
          smtpSecure,
          smtpUser,
          smtpPass,
          smtpFrom: smtpFrom || smtpUser,
          testOnly: false,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: '✅ ' + data.message });
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setStatusMessage({ type: 'error', text: '❌ ' + (data.error || 'Failed to save configuration.') });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: '❌ ' + (err.message || 'Save request failed.') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">System SMTP Engine</h2>
              <p className="text-xs text-slate-400">Account verification & password reset mail dispatcher</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-sm flex items-start space-x-2 border ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              )}
              <div className="leading-snug break-all">{statusMessage.text}</div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-300 mb-1 block">SMTP Host</label>
              <div className="relative">
                <Server className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="smtp.gmail.com or smtp.zoho.com"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Port</label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="number"
                  required
                  placeholder="465 / 587"
                  value={smtpPort}
                  onChange={(e) => {
                    const port = parseInt(e.target.value, 10);
                    setSmtpPort(port);
                    if (port === 465) setSmtpSecure(true);
                    if (port === 587) setSmtpSecure(false);
                  }}
                  className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="smtpSecure"
              checked={smtpSecure}
              onChange={(e) => setSmtpSecure(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="smtpSecure" className="text-xs font-medium text-slate-300 cursor-pointer select-none">
              Use SSL / TLS (Usually checked for Port 465, unchecked for Port 587 STARTTLS)
            </label>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1 block">SMTP Username / Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="system-notifications@yourdomain.com"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1 block">
              SMTP Password / App Password
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="Google App Password (16 characters)"
                value={smtpPass}
                onChange={(e) => setSmtpPass(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              For Gmail, use a 16-character <em>App Password</em> generated in Google Account Security.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1 block">
              From Email Address (Optional)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                placeholder="LeadHunter Engine <noreply@yourdomain.com>"
                value={smtpFrom}
                onChange={(e) => setSmtpFrom(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              disabled={testing || !smtpUser || !smtpPass}
              onClick={handleTest}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              {testing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  <span>Testing Connection...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Test Connection</span>
                </>
              )}
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !smtpUser || !smtpPass}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center space-x-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save & Activate</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
