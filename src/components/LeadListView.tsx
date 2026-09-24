'use client';

import React, { useState } from 'react';
import { Lead, PipelineStage } from '@/types/lead';
import { 
  Phone, 
  Globe, 
  Star, 
  Smartphone, 
  UserCheck, 
  Sparkles, 
  ExternalLink, 
  Send, 
  Zap, 
  CheckCircle, 
  AlertCircle,
  ChevronRight,
  Copy,
  Check,
  MapPin,
  Mail
} from 'lucide-react';

interface LeadListViewProps {
  leads: Lead[];
  onSelect: (lead: Lead) => void;
  onEnrich: (leadId: string) => Promise<void>;
  onGenerateOutreach: (leadId: string) => Promise<void>;
  onUpdateStage?: (leadId: string, stage: PipelineStage) => void;
  enrichingId: string | null;
  generatingId: string | null;
}

export default function LeadListView({
  leads,
  onSelect,
  onEnrich,
  onGenerateOutreach,
  onUpdateStage,
  enrichingId,
  generatingId,
}: LeadListViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (e: React.MouseEvent, text: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  if (leads.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
        <p className="text-sm">No leads match the current filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-4">Business & Rating</th>
              <th className="py-3.5 px-4">Location</th>
              <th className="py-3.5 px-4">Contacts</th>
              <th className="py-3.5 px-4 text-center">Score</th>
              <th className="py-3.5 px-4">Stage</th>
              <th className="py-3.5 px-4">Website</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
            {leads.map((lead) => {
              const isEnriching = enrichingId === lead.id;
              const isGenerating = generatingId === lead.id;
              const score = lead.opportunityScore;

              let scoreClass = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
              if (score >= 75) scoreClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
              else if (score >= 50) scoreClass = 'bg-amber-500/10 text-amber-400 border-amber-500/30';

              const isMobile = lead.phoneIntelligence?.lineType === 'MOBILE';
              const ownerName = lead.ownerDiscovery?.ownerName;

              return (
                <tr
                  key={lead.id}
                  onClick={() => onSelect(lead)}
                  className="hover:bg-slate-800/50 transition cursor-pointer group"
                >
                  {/* Business & Category */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white group-hover:text-cyan-400 transition flex items-center gap-1.5">
                      <span>{lead.businessName}</span>
                      {lead.googleMapsUrl && (
                        <a
                          href={lead.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-slate-500 hover:text-cyan-400 p-0.5 rounded"
                          title="View on Google Maps"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
                        {lead.category}
                      </span>
                      <div className="flex items-center text-[11px] text-amber-400 gap-0.5">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="font-bold">{lead.rating.toFixed(1)}</span>
                        <span className="text-slate-500">({lead.reviewCount})</span>
                      </div>
                    </div>
                  </td>

                  {/* Location */}
                  <td className="py-3.5 px-4 text-slate-400">
                    <div className="flex items-center gap-1 text-slate-200">
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>{lead.city}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate max-w-[180px] mt-0.5">
                      {lead.address}
                    </div>
                  </td>

                  {/* Contacts */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-1">
                      {lead.phone && (
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="text-slate-300">{lead.phone}</span>
                          {isMobile && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              SMS
                            </span>
                          )}
                        </div>
                      )}

                      {lead.email ? (
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Mail className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span className="text-cyan-300 font-medium truncate max-w-[150px]">
                            {lead.email}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopy(e, lead.email!, `email-${lead.id}`)}
                            className="text-slate-500 hover:text-white p-0.5 rounded transition"
                            title="Copy Email"
                          >
                            {copiedId === `email-${lead.id}` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-500 italic">No email found</div>
                      )}

                      {ownerName && (
                        <div className="flex items-center gap-1 text-[10px] text-indigo-400">
                          <UserCheck className="w-3 h-3" />
                          <span>{ownerName}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Opportunity Score */}
                  <td className="py-3.5 px-4 text-center">
                    <div
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold ${scoreClass}`}
                    >
                      <Zap className="w-3 h-3" />
                      <span>{score}%</span>
                    </div>
                  </td>

                  {/* Stage */}
                  <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                    {onUpdateStage ? (
                      <select
                        value={lead.pipeline?.stage || 'DISCOVERED'}
                        onChange={(e) => onUpdateStage(lead.id, e.target.value as PipelineStage)}
                        className="bg-slate-950/80 border border-slate-700/80 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                      >
                        <option value="DISCOVERED">Discovered</option>
                        <option value="CONTACTED">Contacted</option>
                        <option value="PITCHED">Pitched</option>
                        <option value="WON">Won 🎉</option>
                        <option value="LOST">Lost</option>
                      </select>
                    ) : (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                        {lead.pipeline?.stage || 'DISCOVERED'}
                      </span>
                    )}
                  </td>

                  {/* Website */}
                  <td className="py-3.5 px-4">
                    {lead.website ? (
                      <a
                        href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-slate-300 hover:text-cyan-400 font-medium truncate max-w-[140px] transition"
                      >
                        <Globe className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="truncate">{lead.website.replace(/^https?:\/\//, '')}</span>
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-semibold">
                        <AlertCircle className="w-3 h-3" />
                        <span>Needs Website</span>
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onEnrich(lead.id)}
                        disabled={isEnriching}
                        className={`p-1.5 rounded-lg border text-xs transition flex items-center gap-1 ${
                          isEnriching
                            ? 'bg-indigo-950/40 text-indigo-400 border-indigo-500/30 animate-pulse'
                            : 'bg-slate-800 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-300 border-slate-700 hover:border-indigo-500/40'
                        }`}
                        title="AI Deep Enrichment"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onGenerateOutreach(lead.id)}
                        disabled={isGenerating}
                        className={`p-1.5 rounded-lg border text-xs transition flex items-center gap-1 ${
                          isGenerating
                            ? 'bg-cyan-950/40 text-cyan-400 border-cyan-500/30 animate-pulse'
                            : 'bg-slate-800 hover:bg-cyan-600/20 text-slate-300 hover:text-cyan-300 border-slate-700 hover:border-cyan-500/40'
                        }`}
                        title="Generate AI Cold Pitch"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onSelect(lead)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
                        title="Open Details Modal"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
