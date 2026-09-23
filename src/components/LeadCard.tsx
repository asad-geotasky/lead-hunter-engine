'use client';

import React from 'react';
import { Lead } from '@/types/lead';
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
  AlertCircle
} from 'lucide-react';

interface LeadCardProps {
  lead: Lead;
  onSelect: (lead: Lead) => void;
  onEnrich: (leadId: string) => Promise<void>;
  onGenerateOutreach: (leadId: string) => Promise<void>;
  enrichingId: string | null;
  generatingId: string | null;
}

export default function LeadCard({
  lead,
  onSelect,
  onEnrich,
  onGenerateOutreach,
  enrichingId,
  generatingId,
}: LeadCardProps) {
  const isEnriching = enrichingId === lead.id;
  const isGenerating = generatingId === lead.id;

  const score = lead.opportunityScore;
  let scoreBadgeClass = 'bg-slate-700 text-slate-300 border-slate-600';
  if (score >= 75) {
    scoreBadgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  } else if (score >= 50) {
    scoreBadgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  } else {
    scoreBadgeClass = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
  }

  const isMobile = lead.phoneIntelligence?.lineType === 'MOBILE';
  const hasWebsite = !!lead.website;
  const ownerName = lead.ownerDiscovery?.ownerName;

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all flex flex-col justify-between group">
      <div>
        {/* Top Badges Bar */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            {lead.category}
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${scoreBadgeClass}`}
            >
              <Zap className="w-3 h-3" />
              {score} pts
            </span>
          </div>
        </div>

        {/* Business Title */}
        <h3
          onClick={() => onSelect(lead)}
          className="text-base font-bold text-white group-hover:text-blue-400 transition cursor-pointer mb-1 leading-snug"
        >
          {lead.businessName}
        </h3>

        {/* Address / City */}
        <p className="text-xs text-slate-400 mb-3">{lead.address}</p>

        {/* Reviews and Phone */}
        <div className="flex flex-wrap items-center gap-3 text-xs mb-4">
          <div className="flex items-center gap-1 text-amber-400 font-semibold bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>{lead.rating.toFixed(1)}</span>
            <span className="text-slate-400 font-normal">({lead.reviewCount})</span>
          </div>

          <div className="flex items-center gap-1 text-slate-300">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>{lead.phone || 'No phone listed'}</span>
          </div>
        </div>

        {/* Signal Indicators */}
        <div className="space-y-1.5 mb-4 text-[11px]">
          {/* Website indicator */}
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            {!hasWebsite ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> No Website (Prime Target)
              </span>
            ) : (
              <a
                href={lead.website!}
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-blue-400 truncate max-w-[200px]"
              >
                {lead.website}
              </a>
            )}
          </div>

          {/* Phone Intelligence */}
          <div className="flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-slate-400" />
            {isMobile ? (
              <span className="text-indigo-400 font-medium">
                Direct Mobile ({lead.phoneIntelligence.carrier || 'Wireless'})
              </span>
            ) : (
              <span className="text-slate-400">
                {lead.phoneIntelligence?.lineType || 'Landline / Office'}
              </span>
            )}
          </div>

          {/* Owner details */}
          {ownerName && (
            <div className="flex items-center gap-1.5 text-blue-300">
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Owner: <strong>{ownerName}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          {/* Enrich Button */}
          <button
            onClick={() => onEnrich(lead.id)}
            disabled={isEnriching}
            className="px-2.5 py-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-200 transition font-medium flex items-center gap-1 disabled:opacity-50"
            title="Enrich Phone, Owner & Tech Details"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            {isEnriching ? 'Enriching...' : 'Enrich'}
          </button>

          {/* Outreach / Kit Button */}
          <button
            onClick={() => onGenerateOutreach(lead.id)}
            disabled={isGenerating}
            className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition font-medium flex items-center gap-1 disabled:opacity-50"
            title="Generate Email, SMS & Phone Pitch"
          >
            <Send className="w-3 h-3 text-blue-400" />
            {isGenerating ? 'Drafting...' : 'Outreach'}
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Live Preview Button */}
          <a
            href={`/preview/${lead.id}`}
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition font-medium flex items-center gap-1"
            title="Open Live Mockup Landing Page"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Mockup</span>
          </a>

          {/* Details */}
          <button
            onClick={() => onSelect(lead)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium transition"
          >
            CRM
          </button>
        </div>
      </div>
    </div>
  );
}
