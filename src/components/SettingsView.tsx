'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Lock, 
  Server, 
  Key, 
  Shield, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Save, 
  ShieldCheck, 
  Sliders,
  Mail,
  Hash
} from 'lucide-react';

interface SettingsViewProps {
  currentUser: {
    id: string;
    email: string;
    name: string;
    role: string;
  } | null;
  onUserUpdated?: (user: any) => void;
}

export default function SettingsView({ currentUser, onUserUpdated }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'smtp' | 'apikeys'>('profile');

  // Profile & Password State
  const [name, setName] = useState(currentUser?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // System SMTP State
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(465);
  const [smtpSecure, setSmtpSecure] = useState(true);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFrom, setSmtpFrom] = useState('');
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [smtpMsg, setSmtpMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Provider API Keys State (Stored in localStorage for convenience)
  const [apifyKey, setApifyKey] = useState('');
  const [outscraperKey, setOutscraperKey] = useState('');
  const [googleKey, setGoogleKey] = useState('');
  const [keysSavedMsg, setKeysSavedMsg] = useState(false);

  useEffect(() => {
    if (currentUser?.name) {
      setName(currentUser.name);
    }
  }, [currentUser]);

  // Load existing SMTP config
  useEffect(() => {
    const fetchSmtp = async () => {
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
        console.error('Failed to load SMTP settings:', err);
      }
    };

    fetchSmtp();

    // Load saved API keys from localStorage
    if (typeof window !== 'undefined') {
      setApifyKey(localStorage.getItem('lead_hunter_key_apify') || localStorage.getItem('leadhunter_apify_key') || '');
      setOutscraperKey(localStorage.getItem('lead_hunter_key_outscraper') || localStorage.getItem('leadhunter_outscraper_key') || '');
      setGoogleKey(localStorage.getItem('lead_hunter_key_google') || localStorage.getItem('leadhunter_google_key') || '');
    }
  }, []);

  // Update Profile Name
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProfileMsg({ type: 'success', text: 'Name updated successfully!' });
        if (onUserUpdated && data.user) onUserUpdated(data.user);
      } else {
        setProfileMsg({ type: 'error', text: data.error || 'Failed to update name.' });
      }
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Network error.' });
    } finally {
      setProfileLoading(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      setPasswordLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters long.' });
      setPasswordLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMsg({ type: 'error', text: data.error || 'Failed to change password.' });
      }
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Network error.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Test System SMTP
  const handleTestSmtp = async () => {
    setSmtpTesting(true);
    setSmtpMsg(null);
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
        setSmtpMsg({ type: 'success', text: '✅ ' + data.message });
      } else {
        setSmtpMsg({ type: 'error', text: '❌ ' + (data.message || data.error || 'SMTP test failed.') });
      }
    } catch (err: any) {
      setSmtpMsg({ type: 'error', text: '❌ ' + err.message });
    } finally {
      setSmtpTesting(false);
    }
  };

  // Save System SMTP
  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmtpLoading(true);
    setSmtpMsg(null);
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
        setSmtpMsg({ type: 'success', text: '✅ ' + data.message });
      } else {
        setSmtpMsg({ type: 'error', text: '❌ ' + (data.error || 'Failed to save SMTP config.') });
      }
    } catch (err: any) {
      setSmtpMsg({ type: 'error', text: '❌ ' + err.message });
    } finally {
      setSmtpLoading(false);
    }
  };

  // Save Provider API Keys
  const handleSaveApiKeys = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('lead_hunter_key_apify', apifyKey.trim());
      localStorage.setItem('lead_hunter_key_outscraper', outscraperKey.trim());
      localStorage.setItem('lead_hunter_key_google', googleKey.trim());
      localStorage.setItem('leadhunter_apify_key', apifyKey.trim());
      localStorage.setItem('leadhunter_outscraper_key', outscraperKey.trim());
      localStorage.setItem('leadhunter_google_key', googleKey.trim());
      setKeysSavedMsg(true);
      setTimeout(() => setKeysSavedMsg(false), 3000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Settings Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System & Account Settings</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your credentials, change password, and configure system-level SMTP delivery
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition ${
              activeTab === 'profile'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile & Security</span>
          </button>
          <button
            onClick={() => setActiveTab('smtp')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition ${
              activeTab === 'smtp'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>System SMTP</span>
          </button>
          <button
            onClick={() => setActiveTab('apikeys')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition ${
              activeTab === 'apikeys'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>API Keys</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Profile & Security */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Operator Profile</h2>
                <p className="text-xs text-slate-400">Account identity and role privileges</p>
              </div>
            </div>

            {profileMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                  profileMsg.type === 'success'
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                }`}
              >
                {profileMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Email Address (Read-only)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    disabled
                    value={currentUser?.email || ''}
                    className="w-full bg-slate-950/40 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Account Role</label>
                <div className="flex items-center gap-2 p-2.5 bg-slate-950/40 border border-slate-800 rounded-xl">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono font-bold text-cyan-300">{currentUser?.role || 'USER'}</span>
                  <span className="text-[11px] text-slate-500 ml-auto">Full administrative permissions</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={profileLoading}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {profileLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Profile Changes</span>
              </button>
            </form>
          </div>

          {/* Change Password Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Change Password</h2>
                <p className="text-xs text-slate-400">Update your credentials securely</p>
              </div>
            </div>

            {passwordMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                  passwordMsg.type === 'success'
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                }`}
              >
                {passwordMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Current Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Confirm New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-cyan-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {passwordLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5" />
                )}
                <span>Update Password</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: System SMTP Engine */}
      {activeTab === 'smtp' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">System SMTP Mailer Configuration</h2>
                <p className="text-xs text-slate-400">
                  Used for registration confirmation and self-service password recovery emails
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>TLS / SSL Encrypted</span>
            </div>
          </div>

          {smtpMsg && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-start gap-2 border ${
                smtpMsg.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
              }`}
            >
              {smtpMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed break-all">{smtpMsg.text}</div>
            </div>
          )}

          <form onSubmit={handleSaveSmtp} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-300 mb-1 block">SMTP Host</label>
                <div className="relative">
                  <Server className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="smtp.gmail.com"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Port</label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
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
                    className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="smtpSecureCheckbox"
                checked={smtpSecure}
                onChange={(e) => setSmtpSecure(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-600 focus:ring-cyan-500"
              />
              <label htmlFor="smtpSecureCheckbox" className="text-xs font-medium text-slate-300 cursor-pointer select-none">
                Use Direct SSL/TLS (Recommended for Port 465)
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">SMTP Username / Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="notifications@yourdomain.com"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">
                  SMTP Password / Google App Password
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="16-character App Password"
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">
                Sender &quot;From&quot; Display Address (Optional)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="LeadHunter Engine <notifications@yourdomain.com>"
                  value={smtpFrom}
                  onChange={(e) => setSmtpFrom(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
              <button
                type="button"
                disabled={smtpTesting || !smtpUser || !smtpPass}
                onClick={handleTestSmtp}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-2 disabled:opacity-50"
              >
                {smtpTesting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    <span>Verifying SMTP...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Test Connection</span>
                  </>
                )}
              </button>

              <button
                type="submit"
                disabled={smtpLoading || !smtpUser || !smtpPass}
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-600/30 transition flex items-center gap-2 disabled:opacity-50"
              >
                {smtpLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save & Activate SMTP</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: Provider API Keys */}
      {activeTab === 'apikeys' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Scraping Provider API Keys</h2>
              <p className="text-xs text-slate-400">
                Store keys here to automatically populate your prospecting search bar
              </p>
            </div>
          </div>

          {keysSavedMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>API keys saved to browser storage!</span>
            </div>
          )}

          <form onSubmit={handleSaveApiKeys} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Apify API Token</label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  placeholder="apify_api_..."
                  value={apifyKey}
                  onChange={(e) => setApifyKey(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Outscraper API Key</label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  placeholder="outscraper_key_..."
                  value={outscraperKey}
                  onChange={(e) => setOutscraperKey(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Google Places API Key</label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={googleKey}
                  onChange={(e) => setGoogleKey(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="py-2.5 px-6 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save API Keys Locally</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
