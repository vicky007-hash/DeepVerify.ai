import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { ShieldCheck, CheckCircle2, AlertTriangle, HelpCircle, Copy, Download, Check, ExternalLink, Sparkles, BookOpen, Layers, Clock } from 'lucide-react';
import { IntelligenceReport, VerifiedClaim, SearchResultItem } from '../types.ts';

interface ReportViewProps {
  report: IntelligenceReport;
  onSelectSource?: (source: SearchResultItem) => void;
}

export const ReportView: React.FC<ReportViewProps> = ({ report, onSelectSource }) => {
  const [copiedMd, setCopiedMd] = useState(false);
  const [activeTab, setActiveTab] = useState<'claims' | 'markdown' | 'findings'>('claims');

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(report.fullMarkdown);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deepverify-dossier-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: VerifiedClaim['status']) => {
    switch (status) {
      case 'verified':
        return (
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="h-3 w-3" />
            Verified
          </span>
        );
      case 'disputed':
        return (
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <AlertTriangle className="h-3 w-3" />
            Disputed / Conflicting
          </span>
        );
      case 'emerging':
        return (
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <HelpCircle className="h-3 w-3" />
            Emerging Thesis
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Dossier Header & Metrics Summary Card */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-500/20">
                Verified Intelligence Dossier
              </span>
              <span className="text-xs text-slate-400">
                Confidence Rating: <strong className="text-emerald-400 font-mono">{report.confidenceScore}%</strong>
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-100 tracking-tight leading-snug">
              {report.title}
            </h2>
          </div>

          {/* Action Export Buttons */}
          <div className="flex items-center gap-2 self-start shrink-0">
            <button
              id="btn-copy-markdown"
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
              title="Copy markdown report"
            >
              {copiedMd ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedMd ? 'Copied' : 'Copy Markdown'}</span>
            </button>
            <button
              id="btn-download-json"
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
              title="Download audit JSON"
            >
              <Download className="h-3.5 w-3.5 text-indigo-400" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Operational Metrics Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
            <span className="text-slate-400 block text-[11px]">Sources Grounded</span>
            <span className="text-sm font-semibold font-mono text-slate-100">
              {report.metrics.totalSourcesConsulted} records
            </span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
            <span className="text-slate-400 block text-[11px]">Engines Orchestrated</span>
            <span className="text-sm font-semibold text-slate-100 flex items-center gap-1">
              <span className="text-indigo-400 font-mono">{report.metrics.enginesUsed.length}</span>
              <span className="text-slate-400 text-[11px]">({report.metrics.enginesUsed.join(', ')})</span>
            </span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
            <span className="text-slate-400 block text-[11px]">Retrieval Latency</span>
            <span className="text-sm font-semibold font-mono text-slate-100 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-indigo-400" />
              {(report.metrics.searchDurationMs / 1000).toFixed(1)}s
            </span>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
            <span className="text-slate-400 block text-[11px]">Cache Hits</span>
            <span className="text-sm font-semibold font-mono text-emerald-400">
              {report.metrics.cacheHitCount} hits (Quota Saved)
            </span>
          </div>
        </div>
      </div>

      {/* Executive Brief Box */}
      <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-2xl p-5 shadow-md">
        <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          Executive Verdict & Bottom-Line
        </h3>
        <p className="text-sm text-slate-200 leading-relaxed font-normal whitespace-pre-line">
          {report.executiveSummary}
        </p>
      </div>

      {/* Sub-Tabs: Verified Claims Matrix vs Full Markdown vs Key Findings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('claims')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'claims'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Verified Claims Radar ({report.verifiedClaims.length})
          </button>
          <button
            onClick={() => setActiveTab('findings')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'findings'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Key Findings ({report.keyFindings.length})
          </button>
          <button
            onClick={() => setActiveTab('markdown')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'markdown'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Full Intelligence Dossier (Markdown)
          </button>
        </div>

        {/* Tab 1: Claims Radar */}
        {activeTab === 'claims' && (
          <div className="space-y-3">
            {report.verifiedClaims.map((claim, idx) => (
              <div
                key={claim.id || idx}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4.5 transition-all space-y-2.5 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <span className="text-slate-500 font-mono text-xs mt-0.5">#{idx + 1}</span>
                    <h4 className="text-sm font-semibold text-slate-100">{claim.claim}</h4>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-xs font-mono text-slate-300">
                      Score: <span className="text-indigo-300 font-bold">{claim.confidenceScore}%</span>
                    </div>
                    {getStatusBadge(claim.status)}
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed pl-6">
                  {claim.analysis}
                </p>

                {/* Supporting Source Badges */}
                {claim.supportingSourceIds && claim.supportingSourceIds.length > 0 && (
                  <div className="pl-6 pt-1 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-slate-400">Grounding Citations:</span>
                    {claim.supportingSourceIds.map((srcId) => {
                      const matchedSource = report.sources.find((s) => s.id === srcId);
                      return (
                        <a
                          key={srcId}
                          href={matchedSource?.link || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-indigo-300 transition-colors"
                        >
                          <span>{matchedSource?.source || 'Source'}</span>
                          <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Key Findings */}
        {activeTab === 'findings' && (
          <div className="space-y-4">
            <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Core Verified Milestones & Empirical Discoveries
              </h4>
              <ul className="space-y-2.5">
                {report.keyFindings.map((finding, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-200">
                    <div className="h-2 w-2 rounded-full bg-indigo-400 mt-2 shrink-0" />
                    <span className="leading-relaxed">{finding}</span>
                  </li>
                ))}
              </ul>
            </div>

            {report.unresolvedGaps && report.unresolvedGaps.length > 0 && (
              <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-5 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                  Unresolved Critic Gaps & Industry Watchouts
                </h4>
                <ul className="space-y-1.5">
                  {report.unresolvedGaps.map((gap, i) => (
                    <li key={i} className="text-xs text-amber-200/90 leading-relaxed list-disc list-inside">
                      {gap}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Markdown View */}
        {activeTab === 'markdown' && (
          <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-6 shadow-inner">
            <div className="markdown-body prose prose-invert prose-indigo max-w-none text-slate-200 text-sm leading-relaxed">
              <Markdown>{report.fullMarkdown}</Markdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
