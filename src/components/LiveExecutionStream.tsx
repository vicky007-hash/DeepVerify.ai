import React, { useEffect, useRef, useState } from 'react';
import { Terminal, Copy, Check, ChevronDown, ChevronUp, Cpu, Database, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AgentLogEntry } from '../types.ts';

interface LiveExecutionStreamProps {
  logs: AgentLogEntry[];
  isLoading: boolean;
}

export const LiveExecutionStream: React.FC<LiveExecutionStreamProps> = ({ logs, isLoading }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleCopyLogs = () => {
    const text = logs.map((l) => `[${new Date(l.timestamp).toLocaleTimeString()}] [${l.phase.toUpperCase()}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLogBadge = (level: AgentLogEntry['level']) => {
    switch (level) {
      case 'tool':
        return <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">TOOL</span>;
      case 'critic':
        return <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">CRITIC</span>;
      case 'success':
        return <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">OK</span>;
      case 'warning':
        return <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">GAP</span>;
      default:
        return <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">INFO</span>;
    }
  };

  return (
    <div className="bg-slate-950 rounded-xl border border-slate-800/90 overflow-hidden font-mono text-xs shadow-lg">
      {/* Header bar */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-indigo-400" />
          <span className="font-semibold text-slate-200 text-xs">Live Agent Reasoning & Tool Trace</span>
          {isLoading && (
            <span className="flex items-center gap-1 text-[11px] text-indigo-400">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping" />
              Streaming steps...
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLogs}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Copy log trace"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Log Output Body */}
      {isExpanded && (
        <div
          ref={containerRef}
          className="p-3.5 max-h-56 overflow-y-auto space-y-2 select-text bg-slate-950/90 font-mono text-[11px] leading-relaxed"
        >
          {logs.length === 0 ? (
            <div className="text-slate-600 italic py-3 text-center">
              Agent idle. Launch an investigation to see live reasoning steps and SerpApi tool invocations.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2.5 text-slate-300 hover:bg-slate-900/40 p-1 rounded">
                <span className="text-slate-600 select-none shrink-0 text-[10px]">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })}
                </span>
                <div className="shrink-0">{getLogBadge(log.level)}</div>
                <div className="flex-1 break-words">
                  <span className="text-slate-300">{log.message}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
