import React from 'react';
import {
  Brain,
  Search,
  ShieldAlert,
  FileText,
  CheckCircle,
  Clock,
  RefreshCw,
  Activity,
  Check,
} from 'lucide-react';
import { AgentPhase, SearchQueryPlan, CriticReview } from '../types.ts';

interface AgentFlowGraphProps {
  phase: AgentPhase;
  plan: SearchQueryPlan[];
  criticReview: CriticReview | null;
  sourcesCount: number;
  durationMs?: number;
  queriesPlanned?: number;
  queriesCompleted?: number;
}

export const AgentFlowGraph: React.FC<AgentFlowGraphProps> = ({
  phase,
  plan,
  criticReview,
  sourcesCount,
  durationMs,
  queriesPlanned,
  queriesCompleted,
}) => {
  const getStepStatus = (stepIndex: number) => {
    // 0: Planning, 1: Retrieval, 2: Critic, 3: Synthesis
    if (phase === 'error') return 'error';
    if (phase === 'idle') return 'idle';
    if (phase === 'completed') return 'completed';

    const currentMap: Record<AgentPhase, number> = {
      idle: -1,
      planning: 0,
      retrieving: 1,
      evaluating: 2,
      re_retrieving: 2,
      synthesizing: 3,
      completed: 4,
      error: -1,
    };

    const currentStep = currentMap[phase];
    if (currentStep > stepIndex) return 'completed';
    if (currentStep === stepIndex) return 'active';
    return 'pending';
  };

  const steps = [
    {
      id: 'step-plan',
      title: '1. Strategy & Planning',
      desc: plan.length > 0 ? `${plan.length} search angles generated` : 'Deconstruct prompt into sub-queries',
      icon: <Brain className="h-4 w-4" />,
      status: getStepStatus(0),
    },
    {
      id: 'step-serpapi',
      title: '2. SerpApi Multi-Engine',
      desc: sourcesCount > 0 ? `${sourcesCount} grounded records fetched` : 'Parallel API query fanout',
      icon: <Search className="h-4 w-4" />,
      status: getStepStatus(1),
    },
    {
      id: 'step-critic',
      title: '3. Critic & Fact-Checker',
      desc: criticReview?.consensusLevel
        ? `${String(criticReview.consensusLevel).replace('_', ' ')} (${criticReview.confidenceAssessment || 'EVALUATED'})`
        : 'Gap detection & bias analysis',
      icon: phase === 're_retrieving' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />,
      status: getStepStatus(2),
    },
    {
      id: 'step-synthesis',
      title: '4. Grounded Synthesis',
      desc: phase === 'completed' ? 'Verified dossier generated' : 'Compile citations & verified claims',
      icon: <FileText className="h-4 w-4" />,
      status: getStepStatus(3),
    },
  ];

  // Calculate planned vs completed queries and progress percentage
  const totalPlanned = Math.max(queriesPlanned !== undefined ? queriesPlanned : plan.length, 0);
  const rawCompleted = Math.max(queriesCompleted !== undefined ? queriesCompleted : 0, 0);
  const completed = phase === 'completed' && totalPlanned > 0 ? Math.max(rawCompleted, totalPlanned) : rawCompleted;

  let percentage = 0;
  if (phase === 'completed') {
    percentage = 100;
  } else if (phase === 'idle') {
    percentage = 0;
  } else if (totalPlanned > 0) {
    percentage = Math.min(100, Math.max(0, Math.round((completed / totalPlanned) * 100)));
  } else if (phase === 'planning') {
    percentage = 5;
  }

  // Determine styling and descriptive status for current phase
  let progressBarColor = 'bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400';
  let progressStatusText = 'Awaiting research investigation...';

  switch (phase) {
    case 'idle':
      progressBarColor = 'bg-slate-700';
      progressStatusText = 'Ready for investigation';
      break;
    case 'planning':
      progressBarColor = 'bg-gradient-to-r from-indigo-600 via-blue-500 to-indigo-400';
      progressStatusText = 'Deconstructing research prompt into search queries...';
      break;
    case 'retrieving':
      progressBarColor = 'bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400';
      progressStatusText = `Executing planned queries (${completed} of ${totalPlanned} completed)...`;
      break;
    case 'evaluating':
      progressBarColor = 'bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-400';
      progressStatusText = 'Cross-verifying evidence & checking consensus...';
      break;
    case 're_retrieving':
      progressBarColor = 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400';
      progressStatusText = `Resolving identified knowledge gaps (${completed} of ${totalPlanned} executed)...`;
      break;
    case 'synthesizing':
      progressBarColor = 'bg-gradient-to-r from-teal-500 via-cyan-400 to-emerald-400';
      progressStatusText = 'Synthesizing comprehensive intelligence dossier...';
      break;
    case 'completed':
      progressBarColor = 'bg-gradient-to-r from-emerald-500 to-teal-400';
      progressStatusText = 'All planned queries executed & dossier verified.';
      break;
    case 'error':
      progressBarColor = 'bg-rose-500';
      progressStatusText = 'Investigation encountered an issue';
      break;
  }

  return (
    <div id="agent-orchestration-container" className="bg-slate-900/60 rounded-xl border border-slate-800/80 p-4 space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Autonomous Agent Orchestration Graph
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
            LangGraph / MCP Pattern
          </span>
        </div>
        {durationMs !== undefined && durationMs > 0 && (
          <div className="text-xs font-mono text-slate-400 flex items-center gap-1">
            <Clock className="h-3 w-3 text-indigo-400" />
            <span>{(durationMs / 1000).toFixed(1)}s</span>
          </div>
        )}
      </div>

      {/* Query-Based Progress Section */}
      <div
        id="research-progress-panel"
        className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800/90 shadow-sm transition-all"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Activity className="h-3.5 w-3.5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-200">
                Research Task Progress
              </span>
              <span className="text-slate-500 mx-1.5 hidden sm:inline">|</span>
              <span
                id="progress-query-counter"
                className="text-[11px] font-mono font-medium text-slate-300"
              >
                {completed} of {totalPlanned} {totalPlanned === 1 ? 'query' : 'queries'} completed
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden md:inline">
              {progressStatusText}
            </span>
            <div className="flex items-center gap-1.5">
              <span
                id="progress-percentage"
                className="text-sm font-mono font-bold text-slate-100 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800"
              >
                {percentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar Track & Fill */}
        <div
          id="research-progress-bar-track"
          className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-800/90 relative"
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            id="research-progress-bar-fill"
            className={`h-full rounded-full transition-all duration-500 ease-out relative ${progressBarColor}`}
            style={{ width: `${percentage}%` }}
          >
            {phase !== 'idle' && phase !== 'completed' && phase !== 'error' && (
              <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
            )}
          </div>
        </div>

        {/* Query Pills List (showing planned queries & real-time completion state) */}
        {plan.length > 0 && (
          <div
            id="planned-queries-status-list"
            className="mt-3 pt-2.5 border-t border-slate-800/70 flex flex-wrap items-center gap-1.5"
          >
            <span className="text-[10px] uppercase font-semibold text-slate-400 mr-1 tracking-wider">
              Query Pipeline:
            </span>
            {plan.map((q, idx) => {
              const isDone = idx < completed || phase === 'completed';
              const isCurrent = idx === completed && (phase === 'retrieving' || phase === 're_retrieving');

              let pillBorder = 'border-slate-800 bg-slate-900/50 text-slate-400';
              if (isDone) {
                pillBorder = 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300';
              } else if (isCurrent) {
                pillBorder = 'border-indigo-500/60 bg-indigo-950/40 text-indigo-200 ring-1 ring-indigo-500/30 animate-pulse';
              }

              return (
                <span
                  key={q.id || `q-${idx}`}
                  id={`query-pill-${idx}`}
                  className={`inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-lg border ${pillBorder} transition-all`}
                  title={`${q.engine}: ${q.query}`}
                >
                  {isDone ? (
                    <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                  ) : isCurrent ? (
                    <RefreshCw className="h-3 w-3 text-indigo-400 animate-spin shrink-0" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-600 shrink-0" />
                  )}
                  <span className="truncate max-w-[130px] sm:max-w-[190px]">
                    {q.query}
                  </span>
                  <span className="text-[9px] uppercase px-1 py-0.5 rounded bg-slate-800/90 text-slate-300">
                    {q.engine.replace('google_', '')}
                  </span>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Four Steps Workflow Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
        {steps.map((step) => {
          let stateStyle = 'bg-slate-950/40 border-slate-800/80 text-slate-500';
          let iconBadge = 'bg-slate-900 text-slate-500 border-slate-800';

          if (step.status === 'active') {
            stateStyle = 'bg-indigo-950/30 border-indigo-500/50 text-slate-200 ring-1 ring-indigo-500/30';
            iconBadge = 'bg-indigo-600 text-white border-indigo-400 animate-pulse';
          } else if (step.status === 'completed') {
            stateStyle = 'bg-slate-900/90 border-emerald-500/40 text-slate-200';
            iconBadge = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
          }

          return (
            <div
              key={step.id}
              id={step.id}
              className={`p-3.5 rounded-xl border transition-all relative ${stateStyle}`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg border flex items-center justify-center shrink-0 ${iconBadge}`}>
                  {step.status === 'completed' ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : step.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-100">
                    <span>{step.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

