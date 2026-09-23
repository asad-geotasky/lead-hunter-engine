'use client';

import React from 'react';
import { Lead } from '@/types/lead';
import { Download, X } from 'lucide-react';

interface ExportModalProps {
  leads: Lead[];
  onClose: () => void;
}

export default function ExportModal({ leads, onClose }: ExportModalProps) {
  const exportCsv = () => {
    const headers = [
      'Business Name',
      'Category',
      'City',
      'Address',
      'Phone',
      'Line Type',
      'Carrier',
      'Owner Name',
      'Rating',
      'Reviews Count',
      'Has Website',
      'Website',
      'Opportunity Score',
      'Pipeline Stage',
      'Mockup URL',
      'Email Subject',
      'SMS Pitch',
    ];

    const rows = leads.map((l) => [
      `"${(l.businessName || '').replace(/"/g, '""')}"`,
      `"${(l.category || '').replace(/"/g, '""')}"`,
      `"${(l.city || '').replace(/"/g, '""')}"`,
      `"${(l.address || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      `"${l.phoneIntelligence?.lineType || ''}"`,
      `"${(l.phoneIntelligence?.carrier || '').replace(/"/g, '""')}"`,
      `"${(l.ownerDiscovery?.ownerName || '').replace(/"/g, '""')}"`,
      l.rating || 0,
      l.reviewCount || 0,
      l.website ? 'YES' : 'NO',
      `"${(l.website || '').replace(/"/g, '""')}"`,
      l.opportunityScore || 0,
      l.pipeline.stage,
      `"${(l.outreach?.mockupUrl || '').replace(/"/g, '""')}"`,
      `"${(l.outreach?.coldEmailSubject || '').replace(/"/g, '""')}"`,
      `"${(l.outreach?.smsPitch || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onClose();
  };

  const exportJson = () => {
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(leads, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', jsonStr);
    link.setAttribute('download', `leads_export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <Download className="w-5 h-5 text-blue-400" />
          Export Leads ({leads.length})
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Download your enriched leads complete with verified phone lines, owner names, Opportunity Scores, and generated mockup URLs.
        </p>

        <div className="space-y-3">
          <button
            onClick={exportCsv}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-xl shadow transition flex items-center justify-center gap-2 text-sm"
          >
            Export as CSV (Instantly / Lemlist / Excel)
          </button>

          <button
            onClick={exportJson}
            className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 text-sm"
          >
            Export as JSON (Full CRM state)
          </button>
        </div>
      </div>
    </div>
  );
}
