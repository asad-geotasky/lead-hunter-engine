'use client';

import React, { useState, useEffect } from 'react';
import { Lead } from '@/types/lead';
import { X, Send, CheckCircle2, AlertCircle, Loader2, Sparkles, Webhook, Zap } from 'lucide-react';

interface SyncModalProps {
  leads: Lead[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function SyncModal({ leads, onClose, onSuccess }: SyncModalProps) {
  const [platform, setPlatform] = useState<'instantly' | 'smartlead' | 'webhook'>('webhook');
  const [apiKey, setApiKey] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Restore saved settings from localStorage
  useEffect(() => {
    try {
      const savedInstantlyKey = localStorage.getItem('leadhunter_instantly_key') || '';
      const savedInstantlyCampaign = localStorage.getItem('leadhunter_instantly_campaign') || '';
      const savedSmartleadKey = localStorage.getItem('leadhunter_smartlead_key') || '';
      const savedSmartleadCampaign = localStorage.getItem('leadhunter_smartlead_campaign') || '';
      const savedWebhook = localStorage.getItem('leadhunter_webhook_url') || '';

      if (platform === 'instantly') {
        setApiKey(savedInstantlyKey);
        setCampaignId(savedInstantlyCampaign);
      } else if (platform === 'smartlead') {
        setApiKey(savedSmartleadKey);
        setCampaignId(savedSmartleadCampaign);
      } else if (platform === 'webhook') {
        setWebhookUrl(savedWebhook);
      }
    } catch {
      // ignore
    }
  }, [platform]);

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Save to localStorage for convenience
    try {
      if (platform === 'instantly') {
        localStorage.setItem('leadhunter_instantly_key', apiKey);
        localStorage.setItem('leadhunter_instantly_campaign', campaignId);
      } else if (platform === 'smartlead') {
        localStorage.setItem('leadhunter_smartlead_key', apiKey);
        localStorage.setItem('leadhunter_smartlead_campaign', campaignId);
      } else if (platform === 'webhook') {
        localStorage.setItem('leadhunter_webhook_url', webhookUrl);
      }
    } catch {
      // ignore
    }

    try {
      const res = await fetch('/api/outreach/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          apiKey: apiKey.trim(),
          campaignId: campaignId.trim(),
          webhookUrl: webhookUrl.trim(),
          leadIds: leads.map((l) => l.id),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Successfully synced ${data.synced} leads to ${platform.toUpperCase()}! Pipeline stages updated to CONTACTED.`);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2200);
      } else {
        setErrorMsg(data.error || 'Failed to sync leads');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error syncing leads';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <Send className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-bold text-white">Campaign &amp; Outreach Sync</h3>
        </div>
        <p className="text-xs text-slate-400 mb-6">
          Push <strong>{leads.length}</strong> enriched lead{leads.length > 1 ? 's' : ''} directly into your active cold email sequence with custom variables pre-mapped.
        </p>

        {/* Platform Selector */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <button
            type="button"
            onClick={() => setPlatform('webhook')}
            className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
              platform === 'webhook'
                ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Webhook className="w-4 h-4 text-emerald-400" />
            <span>Webhook / Make</span>
          </button>

          <button
            type="button"
            onClick={() => setPlatform('instantly')}
            className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
              platform === 'instantly'
                ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Instantly.ai</span>
          </button>

          <button
            type="button"
            onClick={() => setPlatform('smartlead')}
            className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
              platform === 'smartlead'
                ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Smartlead.ai</span>
          </button>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSync} className="space-y-4">
          {platform === 'webhook' && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Webhook URL (Zapier, Make.com, n8n, etc.)
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://hook.eu1.make.com/..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Dispatches full lead array with mockup URLs, screenshots, phone intel, and owner names.
              </span>
            </div>
          )}

          {platform === 'instantly' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Instantly API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Instantly v1/v2 API Key"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Instantly Campaign ID
                </label>
                <input
                  type="text"
                  value={campaignId}
                  onChange={(e) => setCampaignId(e.target.value)}
                  placeholder="e.g. 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          )}

          {platform === 'smartlead' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Smartlead API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Smartlead API Key"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Smartlead Campaign ID
                </label>
                <input
                  type="text"
                  value={campaignId}
                  onChange={(e) => setCampaignId(e.target.value)}
                  placeholder="e.g. 12345"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          )}

          {/* Feedback Messages */}
          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Syncing {leads.length} Leads...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Push {leads.length} Leads to Campaign</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
