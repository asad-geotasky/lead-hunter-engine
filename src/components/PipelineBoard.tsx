'use client';

import React from 'react';
import { Lead, PipelineStage } from '@/types/lead';
import { Zap, Phone, ExternalLink, ChevronRight, ChevronLeft } from 'lucide-react';

interface PipelineBoardProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onUpdateStage: (leadId: string, stage: PipelineStage) => Promise<void>;
}

const COLUMNS: Array<{ stage: PipelineStage; label: string; color: string }> = [
  { stage: 'DISCOVERED', label: 'Discovered', color: 'border-slate-500 text-slate-400' },
  { stage: 'ENRICHED', label: 'Enriched', color: 'border-blue-500 text-blue-400' },
  { stage: 'DEMO_READY', label: 'Demo Ready', color: 'border-indigo-500 text-indigo-400' },
  { stage: 'CONTACTED', label: 'Contacted', color: 'border-amber-500 text-amber-400' },
  { stage: 'INTERESTED', label: 'Interested / Call', color: 'border-emerald-500 text-emerald-400' },
  { stage: 'WON', label: 'Won Deal', color: 'border-purple-500 text-purple-400' },
];

export default function PipelineBoard({
  leads,
  onSelectLead,
  onUpdateStage,
}: PipelineBoardProps) {
  const getStageLeads = (stage: PipelineStage) => {
    return leads.filter((l) => l.pipeline.stage === stage);
  };

  const moveLead = (lead: Lead, direction: 'prev' | 'next') => {
    const stageOrder: PipelineStage[] = [
      'DISCOVERED',
      'ENRICHED',
      'DEMO_READY',
      'CONTACTED',
      'INTERESTED',
      'WON',
    ];
    const currentIndex = stageOrder.indexOf(lead.pipeline.stage);
    if (currentIndex === -1) return;

    if (direction === 'next' && currentIndex < stageOrder.length - 1) {
      onUpdateStage(lead.id, stageOrder[currentIndex + 1]);
    } else if (direction === 'prev' && currentIndex > 0) {
      onUpdateStage(lead.id, stageOrder[currentIndex - 1]);
    }
  };

  return (
    <div className="overflow-x-auto pb-6">
      <div className="flex gap-4 min-w-[1200px]">
        {COLUMNS.map((col) => {
          const colLeads = getStageLeads(col.stage);
          return (
            <div
              key={col.stage}
              className="flex-1 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col min-w-[240px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <span className={`text-xs font-bold uppercase tracking-wider ${col.color}`}>
                  {col.label}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {colLeads.length}
                </span>
              </div>

              {/* Column Content */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[70vh] pr-1">
                {colLeads.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-600 border border-dashed border-slate-800/80 rounded-xl">
                    No leads in this stage
                  </div>
                ) : (
                  colLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="bg-slate-800/90 border border-slate-700/70 hover:border-slate-600 p-3.5 rounded-xl shadow transition flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-[10px] uppercase font-bold text-slate-400 truncate max-w-[120px]">
                            {lead.category}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5" />
                            {lead.opportunityScore}
                          </span>
                        </div>

                        <h4
                          onClick={() => onSelectLead(lead)}
                          className="text-xs font-bold text-white hover:text-blue-400 cursor-pointer transition leading-snug mb-1"
                        >
                          {lead.businessName}
                        </h4>

                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-2">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{lead.phone || 'No phone'}</span>
                        </div>

                        {lead.ownerDiscovery?.ownerName && (
                          <div className="text-[10px] text-blue-300 font-medium mb-2">
                            Owner: {lead.ownerDiscovery.ownerName}
                          </div>
                        )}
                      </div>

                      {/* Card Footer / Move controls */}
                      <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between text-xs">
                        <button
                          onClick={() => moveLead(lead, 'prev')}
                          title="Move to previous stage"
                          className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>

                        <a
                          href={`/preview/${lead.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          Demo
                        </a>

                        <button
                          onClick={() => moveLead(lead, 'next')}
                          title="Move to next stage"
                          className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
