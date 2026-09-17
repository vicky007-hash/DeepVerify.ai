import React from 'react';
import { Bot, Sparkles, Terminal, Award, CheckCircle2, ShieldCheck, Database } from 'lucide-react';
import { AgentPhase, SystemStatus } from '../types.ts';

interface HeaderProps {
  phase: AgentPhase;
  systemStatus: SystemStatus | null;
  onOpenInspector: () => void;
  onOpenGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  phase,
  systemStatus,
  onOpenInspector,
  onOpenGuide,
}) => {
  const getPhaseStatusBadge = () => {
    switch (phase) {
      case 'planning':
        return { label: 'Phase 1: Planning & Decomposing', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'retrieving':
        return { label: 'Phase 2: Multi-Engine Retrieval', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
      case 'evaluating':
        return { label: 'Phase 3: Fact-Checking & Gap Radar', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      case 're_retrieving':
        return { label: 'Recursive Loop 2: Addressing Gaps', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' };
      case 'synthesizing':
        return { label: 'Phase 4: Synthesizing Dossier', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'completed':
        return { label: 'Dossier Verified & Grounded', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'error':
        return { label: 'Execution Exception', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
      default:
        return { label: 'Autonomous Agent Ready', color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const statusBadge = getPhaseStatusBadge();

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand & Track Info */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-500/10 border border-indigo-400/30">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-1.5">
                DeepVerify
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Track 1
                </span>
              </h1>
              <div className={`text-xs px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 font-medium ${statusBadge.color}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${phase === 'idle' || phase === 'completed' ? 'bg-current' : 'animate-ping bg-current'}`} />
                {statusBadge.label}
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous Multi-Engine Deep Research & Fact-Verification Agent • SerpApi India Hackathon 2026
            </p>
          </div>
        </div>

        {/* Action Controls & Badges */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* SerpApi Status Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <Database className="h-3.5 w-3.5 text-cyan-400" />
            <span>SerpApi:</span>
            <span className="text-cyan-300 font-mono font-medium">
              {systemStatus?.serpapiConfigured ? 'Live API Key' : 'Grounded Engine'}
            </span>
          </div>

          {/* Raw JSON Inspector Button */}
          <button
            id="btn-open-inspector"
            onClick={onOpenInspector}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
            title="Inspect raw SerpApi JSON payloads for all endpoints"
          >
            <Terminal className="h-3.5 w-3.5 text-indigo-400" />
            <span>SerpApi Inspector</span>
          </button>

          {/* Hackathon Guide Modal Button */}
          <button
            id="btn-open-guide"
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-xs font-medium text-indigo-200 transition-colors cursor-pointer shadow-sm"
            title="View Hackathon Track 1 Rubric, MCP architecture & pitch notes"
          >
            <Award className="h-3.5 w-3.5 text-amber-400" />
            <span>Track 1 Pitch Guide</span>
          </button>
        </div>
      </div>
    </header>
  );
};
