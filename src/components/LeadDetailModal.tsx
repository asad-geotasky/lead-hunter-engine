'use client';

import React, { useState } from 'react';
import { Lead, PipelineStage } from '@/types/lead';
import { 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  Phone, 
  Globe, 
  Star, 
  User, 
  ShieldAlert, 
  Smartphone, 
  FileText, 
  Sparkles, 
  Send,
  Plus,
  Camera,
  Download,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import SyncModal from './SyncModal';

interface LeadDetailModalProps {
  lead: Lead;
  onClose: () => void;
  onUpdateStage: (leadId: string, stage: PipelineStage) => Promise<void>;
  onAddNote: (leadId: string, note: string) => Promise<void>;
  onGenerateOutreach: (leadId: string) => Promise<void>;
}

export default function LeadDetailModal({
  lead,
  onClose,
  onUpdateStage,
  onAddNote,
  onGenerateOutreach,
}: LeadDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'outreach' | 'signals' | 'intelligence' | 'crm'>('outreach');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Screenshot capture states
  const [capturingScreenshot, setCapturingScreenshot] = useState(false);
  const [screenshotTimestamp, setScreenshotTimestamp] = useState<number>(Date.now());
  const [screenshotExists, setScreenshotExists] = useState<boolean>(!!lead.outreach?.mockupScreenshotUrl);
  const [showSyncModal, setShowSyncModal] = useState(false);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setSavingNote(true);
    await onAddNote(lead.id, newNote.trim());
    setNewNote('');
    setSavingNote(false);
  };

  const handleCaptureScreenshot = async () => {
    try {
      setCapturingScreenshot(true);
      const res = await fetch(`/api/screenshot/${lead.id}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setScreenshotExists(true);
        setScreenshotTimestamp(Date.now());
      } else {
        alert(data.error || 'Failed to capture screenshot');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error capturing screenshot';
      alert(msg);
    } finally {
      setCapturingScreenshot(false);
    }
  };

  const STAGES: PipelineStage[] = [
    'DISCOVERED',
    'ENRICHED',
    'DEMO_READY',
    'CONTACTED',
    'INTERESTED',
    'MEETING',
    'WON',
    'LOST',
  ];

  const currentScreenshotSrc = `/screenshots/${lead.id}.png?t=${screenshotTimestamp}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-900/50">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {lead.category}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400" /> {lead.rating}★ ({lead.reviewCount} reviews)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Opportunity: {lead.opportunityScore}/100
              </span>
            </div>

            <h2 className="text-2xl font-bold text-white leading-tight">{lead.businessName}</h2>
            <p className="text-xs text-slate-400 mt-1">{lead.address}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Stage Selector */}
            <div className="text-xs">
              <label className="block text-slate-400 mb-1 font-medium">Pipeline Stage</label>
              <select
                value={lead.pipeline.stage}
                onChange={(e) => onUpdateStage(lead.id, e.target.value as PipelineStage)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-900/30 text-xs font-semibold text-slate-400">
          <button
            onClick={() => setActiveTab('outreach')}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'outreach'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            Outreach Kit &amp; Scripts
          </button>
          <button
            onClick={() => setActiveTab('intelligence')}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'intelligence'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Phone &amp; Owner Intel
          </button>
          <button
            onClick={() => setActiveTab('signals')}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'signals'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Scoring &amp; Tech Audit
          </button>
          <button
            onClick={() => setActiveTab('crm')}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'crm'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Notes &amp; Activity
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: OUTREACH KIT */}
          {activeTab === 'outreach' && (
            <div className="space-y-6">
              {/* Live Mockup Banner & Screenshot Controller */}
              <div className="p-5 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-500/30 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-400" />
                      Interactive Website Demo &amp; Visual Thumbnail
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Live dynamic mockup and high-resolution screenshot preview ready for cold emails.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCaptureScreenshot}
                      disabled={capturingScreenshot}
                      className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition border border-slate-700 flex items-center gap-1.5 shadow disabled:opacity-50"
                    >
                      {capturingScreenshot ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Capturing...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-3.5 h-3.5 text-amber-400" />
                          <span>{screenshotExists ? 'Retake Screenshot' : 'Capture Screenshot'}</span>
                        </>
                      )}
                    </button>

                    <a
                      href={`/preview/${lead.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition flex items-center gap-1.5 shadow"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Live Preview
                    </a>

                    <button
                      onClick={() => setShowSyncModal(true)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 shadow"
                      title="Push lead directly to Instantly, Smartlead, or Webhook"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Push to Campaign
                    </button>
                  </div>
                </div>

                {/* Screenshot Visual Preview Card */}
                {screenshotExists && (
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400 pb-1 border-b border-slate-800">
                      <span className="flex items-center gap-1.5 font-medium text-slate-300">
                        <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                        Captured Hero Mockup (Desktop Viewport)
                      </span>
                      <a
                        href={currentScreenshotSrc}
                        download={`${lead.businessName.replace(/\s+/g, '_')}_mockup.png`}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download PNG
                      </a>
                    </div>

                    <div className="rounded-lg overflow-hidden border border-slate-800 max-h-56 relative bg-slate-900 group">
                      <img
                        src={currentScreenshotSrc}
                        alt={`Website Preview for ${lead.businessName}`}
                        className="w-full object-cover object-top hover:scale-[1.01] transition duration-300"
                        onError={() => setScreenshotExists(false)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {!lead.outreach ? (
                <div className="text-center py-8 bg-slate-800/40 rounded-xl border border-slate-700/60 p-6">
                  <p className="text-sm text-slate-300 mb-3">
                    Outreach script has not been generated for this lead yet.
                  </p>
                  <button
                    onClick={() => onGenerateOutreach(lead.id)}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow transition"
                  >
                    Generate Email, SMS &amp; Call Script
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Cold Email Section */}
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Cold Email Pitch (Plain Text)
                      </span>
                      <div className="flex items-center gap-3">
                        {lead.outreach.htmlEmailBody && (
                          <button
                            onClick={() => copyToClipboard(lead.outreach!.htmlEmailBody!, 'html')}
                            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                          >
                            {copiedKey === 'html' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedKey === 'html' ? 'Copied HTML!' : 'Copy Rich HTML'}
                          </button>
                        )}
                        <button
                          onClick={() =>
                            copyToClipboard(
                              `Subject: ${lead.outreach!.coldEmailSubject}\n\n${lead.outreach!.coldEmailBody}`,
                              'email'
                            )
                          }
                          className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          {copiedKey === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedKey === 'email' ? 'Copied!' : 'Copy Text Email'}
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono text-slate-300">
                      <strong>Subject:</strong> {lead.outreach.coldEmailSubject}
                    </div>

                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs whitespace-pre-wrap text-slate-300 leading-relaxed font-sans">
                      {lead.outreach.coldEmailBody}
                    </div>
                  </div>

                  {/* Direct SMS Pitch */}
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                        Direct SMS / WhatsApp Opener
                      </span>
                      <button
                        onClick={() => copyToClipboard(lead.outreach!.smsPitch, 'sms')}
                        className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        {copiedKey === 'sms' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedKey === 'sms' ? 'Copied!' : 'Copy SMS'}
                      </button>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs text-slate-300">
                      {lead.outreach.smsPitch}
                    </div>
                  </div>

                  {/* Phone Cold Call Script */}
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        Phone Call Framework
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            `Gatekeeper:\n${lead.outreach!.phoneScript.gatekeeperHook}\n\nOwner:\n${lead.outreach!.phoneScript.ownerPitch}\n\nObjections:\n${lead.outreach!.phoneScript.objectionHandler}`,
                            'phone'
                          )
                        }
                        className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        {copiedKey === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedKey === 'phone' ? 'Copied!' : 'Copy Script'}
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="text-amber-400 font-bold block mb-1">1. Gatekeeper / Receptionist Hook:</span>
                        <p className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-300">
                          {lead.outreach.phoneScript.gatekeeperHook}
                        </p>
                      </div>

                      <div>
                        <span className="text-emerald-400 font-bold block mb-1">2. Owner Pitch (When Connected):</span>
                        <p className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-300">
                          {lead.outreach.phoneScript.ownerPitch}
                        </p>
                      </div>

                      <div>
                        <span className="text-blue-400 font-bold block mb-1">3. Objection Handling:</span>
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-300 whitespace-pre-line">
                          {lead.outreach.phoneScript.objectionHandler}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PHONE & OWNER INTEL */}
          {activeTab === 'intelligence' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Phone Intelligence */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-indigo-400" />
                  Phone Line Classification
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-700/50">
                    <span className="text-slate-400">Phone Number:</span>
                    <span className="font-semibold text-white">{lead.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-700/50">
                    <span className="text-slate-400">Line Type:</span>
                    <span className={`font-bold ${lead.phoneIntelligence.lineType === 'MOBILE' ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {lead.phoneIntelligence.lineType}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-700/50">
                    <span className="text-slate-400">Carrier Network:</span>
                    <span className="text-slate-300">{lead.phoneIntelligence.carrier || 'Unclassified'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-700/50">
                    <span className="text-slate-400">Direct Wireless Mobile:</span>
                    <span className={lead.phoneIntelligence.isCallableMobile ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      {lead.phoneIntelligence.isCallableMobile ? 'Yes (SMS Recommended)' : 'No (Office Line)'}
                    </span>
                  </div>
                  <div className="py-1.5 text-slate-400 italic">
                    {lead.phoneIntelligence.notes || 'No specific carrier notes.'}
                  </div>
                </div>
              </div>

              {/* Owner Discovery */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-400" />
                  Owner &amp; Entity Records
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-700/50">
                    <span className="text-slate-400">Identified Owner:</span>
                    <span className="font-bold text-white">{lead.ownerDiscovery.ownerName || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-700/50">
                    <span className="text-slate-400">Title / Role:</span>
                    <span className="text-slate-300">{lead.ownerDiscovery.title || 'Managing Principal'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-700/50">
                    <span className="text-slate-400">Data Source:</span>
                    <span className="text-slate-300">{lead.ownerDiscovery.source || 'Public Registry'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-700/50">
                    <span className="text-slate-400">Confidence Level:</span>
                    <span className="text-blue-400 font-semibold">{lead.ownerDiscovery.confidence}</span>
                  </div>

                  {lead.ownerDiscovery.socialProfiles && (
                    <div className="pt-2">
                      <span className="text-slate-400 block mb-2 font-medium">Digital Footprint:</span>
                      <div className="flex flex-wrap gap-2">
                        {lead.ownerDiscovery.socialProfiles.facebook && (
                          <a
                            href={lead.ownerDiscovery.socialProfiles.facebook}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-[11px]"
                          >
                            Facebook
                          </a>
                        )}
                        {lead.ownerDiscovery.socialProfiles.yelp && (
                          <a
                            href={lead.ownerDiscovery.socialProfiles.yelp}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-[11px]"
                          >
                            Yelp
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SIGNALS & TECH AUDIT */}
          {activeTab === 'signals' && (
            <div className="space-y-6">
              {/* Score Breakdown List */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center justify-between">
                  <span>Opportunity Score Calculation ({lead.opportunityScore}/100)</span>
                  <span className="text-xs text-emerald-400 font-semibold">High Conversion Probability</span>
                </h4>

                <div className="space-y-2 text-xs">
                  {lead.scoreBreakdown.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-700/50">
                      <span className="text-slate-300">{item.reason}</span>
                      <span className="font-bold text-emerald-400">+{item.points} pts</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Website Tech Audit */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  Website Health &amp; Technical Audit
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block mb-1">SSL Certificate:</span>
                    <span className={lead.websiteAudit?.hasSsl ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                      {lead.websiteAudit?.hasSsl ? 'Valid HTTPS' : 'Insecure / No SSL'}
                    </span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block mb-1">Mobile Viewport:</span>
                    <span className={lead.websiteAudit?.isMobileResponsive ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                      {lead.websiteAudit?.isMobileResponsive ? 'Responsive' : 'Non-responsive / Problematic'}
                    </span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block mb-1">Platform / CMS:</span>
                    <span className="text-slate-200 font-medium">
                      {lead.websiteAudit?.cmsDetected || 'None (No site)'}
                    </span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block mb-1">Copyright Year:</span>
                    <span className="text-slate-200 font-medium">
                      {lead.websiteAudit?.staleCopyrightYear || 'Undetected'}
                    </span>
                  </div>
                </div>

                {lead.websiteAudit?.issuesDetected && lead.websiteAudit.issuesDetected.length > 0 && (
                  <div className="pt-2">
                    <span className="text-xs font-semibold text-slate-300 block mb-2">Identified Pitch Angles:</span>
                    <ul className="list-disc list-inside text-xs text-amber-300 space-y-1">
                      {lead.websiteAudit.issuesDetected.map((issue, idx) => (
                        <li key={idx}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: CRM & ACTIVITY */}
          {activeTab === 'crm' && (
            <div className="space-y-6">
              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">Add Call or Outreach Note</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="e.g. Called owner David, left voicemail about the demo site link"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={savingNote || !newNote.trim()}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Note
                  </button>
                </div>
              </form>

              {/* Notes Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Activity History</h4>
                {lead.pipeline.notes && lead.pipeline.notes.length > 0 ? (
                  <div className="space-y-2">
                    {lead.pipeline.notes.map((n, i) => (
                      <div key={i} className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-lg text-xs text-slate-200">
                        {n}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-4">No notes logged yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showSyncModal && (
        <SyncModal
          leads={[lead]}
          onClose={() => setShowSyncModal(false)}
          onSuccess={() => {
            onUpdateStage(lead.id, 'CONTACTED');
          }}
        />
      )}
    </div>
  );
}
