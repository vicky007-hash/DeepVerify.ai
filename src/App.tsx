import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header.tsx';
import { ResearchInput } from './components/ResearchInput.tsx';
import { AgentFlowGraph } from './components/AgentFlowGraph.tsx';
import { LiveExecutionStream } from './components/LiveExecutionStream.tsx';
import { ReportView } from './components/ReportView.tsx';
import { SourcesMatrix } from './components/SourcesMatrix.tsx';
import { SerpApiInspectorModal } from './components/SerpApiInspectorModal.tsx';
import { HackathonGuideModal } from './components/HackathonGuideModal.tsx';
import {
  AgentPhase,
  AgentLogEntry,
  SearchQueryPlan,
  CriticReview,
  IntelligenceReport,
  SerpApiEngine,
  SystemStatus,
  StreamEvent,
} from './types.ts';
import { ShieldCheck, Sparkles, BookOpen, Layers, AlertCircle, FileSearch, RotateCw, X } from 'lucide-react';

export default function App() {
  const [phase, setPhase] = useState<AgentPhase>('idle');
  const [logs, setLogs] = useState<AgentLogEntry[]>([]);
  const [plan, setPlan] = useState<SearchQueryPlan[]>([]);
  const [criticReview, setCriticReview] = useState<CriticReview | null>(null);
  const [report, setReport] = useState<IntelligenceReport | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [activeViewTab, setActiveViewTab] = useState<'dossier' | 'citations'>('dossier');
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentDurationMs, setCurrentDurationMs] = useState<number>(0);
  const [completedQueriesCount, setCompletedQueriesCount] = useState<number>(0);
  const [totalPlannedQueries, setTotalPlannedQueries] = useState<number>(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<any>(null);
  const lastSearchRef = useRef<{ query: string; depth: 'fast' | 'deep'; engines: SerpApiEngine[] } | null>(null);

  useEffect(() => {
    // Fetch system status on startup
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => setSystemStatus(data))
      .catch((err) => console.warn('Could not fetch status:', err));
  }, []);

  const handleStartResearch = async (
    query: string,
    depth: 'fast' | 'deep',
    engines: SerpApiEngine[]
  ) => {
    // Reset state
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    lastSearchRef.current = { query, depth, engines };
    setPhase('planning');
    setLogs([]);
    setPlan([]);
    setCriticReview(null);
    setReport(null);
    setErrorMessage(null);
    setActiveViewTab('dossier');
    setCurrentDurationMs(0);
    setCompletedQueriesCount(0);
    setTotalPlannedQueries(engines.length);

    const startTime = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrentDurationMs(Date.now() - startTime);
    }, 200);

    try {
      const response = await fetch('/api/research/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, depth, engines }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No readable stream received from server');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const dataStr = trimmed.slice(6).trim();
          if (dataStr === '[DONE]') {
            break;
          }

          try {
            const event: StreamEvent = JSON.parse(dataStr);
            handleStreamEvent(event);
          } catch (parseErr) {
            console.warn('[Stream Parse Error]', parseErr, dataStr);
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        const isNetworkErr = err.message?.toLowerCase().includes('network') || err.message?.toLowerCase().includes('fetch');
        const msg = isNetworkErr
          ? 'Network stream connection was momentarily interrupted. The agent engine is ready—click Retry below to resume.'
          : (err.message || 'An error occurred during agent execution');
        setErrorMessage(msg);
        setPhase('error');
      }
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleStreamEvent = (event: StreamEvent) => {
    switch (event.type) {
      case 'phase_change':
        setPhase(event.payload.phase);
        break;

      case 'log':
        setLogs((prev) => [
          ...prev,
          {
            id: `log-${Date.now()}-${Math.random()}`,
            timestamp: event.timestamp,
            phase: event.payload.phase,
            level: event.payload.level,
            message: event.payload.message,
            metadata: event.payload.metadata,
          },
        ]);
        break;

      case 'plan_generated': {
        const queries = event.payload.queries || [];
        setPlan(queries);
        setTotalPlannedQueries(queries.length);
        break;
      }

      case 'tool_call':
        // If an unexpected or gap query is invoked beyond the initial plan:
        setTotalPlannedQueries((prev) => Math.max(prev, completedQueriesCount + 1));
        break;

      case 'tool_result':
        setCompletedQueriesCount((prev) => prev + 1);
        break;

      case 'critic_evaluated':
        setCriticReview(event.payload.review);
        break;

      case 'report_synthesized':
        setReport(event.payload.report);
        setPhase('completed');
        if (event.payload.metrics?.queriesExecuted) {
          setCompletedQueriesCount(event.payload.metrics.queriesExecuted);
          setTotalPlannedQueries((prev) => Math.max(prev, event.payload.metrics.queriesExecuted));
        }
        break;

      case 'done':
        setPhase('completed');
        if (event.payload.metrics?.queriesExecuted) {
          setCompletedQueriesCount(event.payload.metrics.queriesExecuted);
          setTotalPlannedQueries((prev) => Math.max(prev, event.payload.metrics.queriesExecuted));
        }
        if (event.payload.metrics?.searchDurationMs) {
          setCurrentDurationMs(event.payload.metrics.searchDurationMs);
        }
        break;

      case 'error':
        setErrorMessage(event.payload.message);
        setPhase('error');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        phase={phase}
        systemStatus={systemStatus}
        onOpenInspector={() => setIsInspectorOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Research Input & Presets Bar */}
        <ResearchInput
          onStartResearch={handleStartResearch}
          isLoading={phase !== 'idle' && phase !== 'completed' && phase !== 'error'}
        />

        {/* Error Alert Banner if any */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-rose-400 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <strong className="font-semibold block text-rose-100">Investigation Notice:</strong>
                <p className="text-rose-200/90">{errorMessage}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {lastSearchRef.current && (
                <button
                  type="button"
                  onClick={() => {
                    if (lastSearchRef.current) {
                      handleStartResearch(
                        lastSearchRef.current.query,
                        lastSearchRef.current.depth,
                        lastSearchRef.current.engines
                      );
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-900/80 hover:bg-rose-800 text-rose-100 border border-rose-600/50 flex items-center gap-1.5 font-medium transition cursor-pointer"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  <span>Retry Investigation</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="p-1.5 rounded-lg hover:bg-rose-900/50 text-rose-300 hover:text-white transition"
                title="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Agent Orchestration Graph */}
        <AgentFlowGraph
          phase={phase}
          plan={plan}
          criticReview={criticReview}
          sourcesCount={report?.sources?.length || 0}
          durationMs={currentDurationMs}
          queriesPlanned={totalPlannedQueries}
          queriesCompleted={completedQueriesCount}
        />

        {/* Live Reasoning Terminal Trace */}
        <LiveExecutionStream
          logs={logs}
          isLoading={phase !== 'idle' && phase !== 'completed' && phase !== 'error'}
        />

        {/* Intelligence Workspace (Shown when report exists or when completed) */}
        {report && (
          <div className="space-y-4 pt-2">
            {/* View Tab Switcher: Dossier vs Sources */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <button
                  id="tab-view-dossier"
                  onClick={() => setActiveViewTab('dossier')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeViewTab === 'dossier'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Intelligence Dossier</span>
                </button>
                <button
                  id="tab-view-citations"
                  onClick={() => setActiveViewTab('citations')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeViewTab === 'citations'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Sources & Grounded Citations ({report.sources.length})</span>
                </button>
              </div>

              <span className="text-xs text-slate-400 font-mono hidden sm:inline-block">
                Confidence: <strong className="text-emerald-400">{report.confidenceScore}%</strong>
              </span>
            </div>

            {/* Active Tab View */}
            {activeViewTab === 'dossier' ? (
              <ReportView report={report} />
            ) : (
              <SourcesMatrix sources={report.sources} />
            )}
          </div>
        )}

        {/* Welcome Empty State if Idle */}
        {phase === 'idle' && !report && (
          <div className="text-center py-12 px-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 max-w-2xl mx-auto space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
              <FileSearch className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-100">
                Ready for Multi-Engine Deep Research
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-lg mx-auto">
                DeepVerify deconstructs complex topics, executes parallel queries across Google Web, News, Scholar, and Shopping endpoints, audits facts with a recursive critic loop, and synthesizes an authoritative intelligence dossier.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3 text-xs">
              <span className="px-3 py-1 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700">
                ⚡ Multi-Engine Fanout
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700">
                🛡️ Zero Hallucination Citations
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700">
                🔄 Recursive Gap Radar
              </span>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>DeepVerify • SerpApi India Hackathon 2026 (Track 1: Autonomous Agentic AI & Deep Research)</span>
          <span className="font-mono text-slate-400">LangGraph Orchestrator • Gemini 3.8 Flash • SerpApi Engine Suite</span>
        </div>
      </footer>

      {/* Modals */}
      <SerpApiInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
      />
      <HackathonGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
