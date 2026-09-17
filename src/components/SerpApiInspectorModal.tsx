import React, { useState } from 'react';
import { X, Terminal, Search, Play, Copy, Check, ExternalLink, Database } from 'lucide-react';
import { SerpApiEngine } from '../types.ts';

interface SerpApiInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SerpApiInspectorModal: React.FC<SerpApiInspectorModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('Tata electronics semiconductor Dholera fab');
  const [engine, setEngine] = useState<SerpApiEngine>('google_news');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleTestEndpoint = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/serpapi/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), engine }),
      });
      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyJson = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Terminal className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>SerpApi Direct Payload & Endpoint Inspector</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  Live Tester
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Execute queries directly against individual SerpApi engines and verify structured JSON outputs.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Query Controls */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/40 space-y-3">
          <form onSubmit={handleTestEndpoint} className="flex flex-col sm:flex-row items-center gap-2.5">
            {/* Engine Select */}
            <select
              value={engine}
              onChange={(e) => setEngine(e.target.value as SerpApiEngine)}
              className="w-full sm:w-48 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="google">google (Web Search)</option>
              <option value="google_news">google_news (Breaking News)</option>
              <option value="google_scholar">google_scholar (Papers)</option>
              <option value="google_shopping">google_shopping (Market/Hardware)</option>
              <option value="google_jobs">google_jobs (Talent & Roles)</option>
            </select>

            {/* Query Input */}
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter query to test..."
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Run Button */}
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Play className="h-3 w-3 fill-current" />
              <span>{loading ? 'Querying...' : 'Fetch Schema'}</span>
            </button>
          </form>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>Quick Query Examples:</span>
            <button
              type="button"
              onClick={() => { setEngine('google_scholar'); setQuery('quantum error correction surface codes 2026'); }}
              className="hover:text-indigo-300 underline cursor-pointer"
            >
              Scholar: QEC 2026
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => { setEngine('google_news'); setQuery('India semiconductor fab Tata TSMC PSMC'); }}
              className="hover:text-indigo-300 underline cursor-pointer"
            >
              News: India Fab
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => { setEngine('google_shopping'); setQuery('NVIDIA H100 GPU server'); }}
              className="hover:text-indigo-300 underline cursor-pointer"
            >
              Shopping: NVIDIA H100
            </button>
          </div>
        </div>

        {/* Modal Results Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 font-mono text-xs">
          {loading && (
            <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
              <div className="h-4 w-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <span>Querying SerpApi Engine `{engine}`...</span>
            </div>
          )}

          {!loading && !result && (
            <div className="text-center py-12 text-slate-500 italic">
              Click &quot;Fetch Schema&quot; above to inspect the live structured response returned for `{engine}`.
            </div>
          )}

          {!loading && result && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Engine: <strong className="text-indigo-300 font-mono">{engine}</strong></span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-400">Status: <strong className="text-emerald-400">{result.fromCache ? 'Cache Hit' : result.fromLiveApi ? 'Live SerpApi' : 'Grounded Engine'}</strong></span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-400">Parsed: <strong className="text-slate-200">{result.results?.length || 0} items</strong></span>
                </div>
                <button
                  onClick={handleCopyJson}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>

              {/* Parsed Cards Preview */}
              {result.results && result.results.length > 0 && (
                <div className="space-y-2 font-sans mb-4">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                    Extracted SerpApi Records:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {result.results.map((r: any, i: number) => (
                      <div key={i} className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-1">
                        <div className="font-semibold text-slate-200 text-xs">{r.title}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-2">{r.snippet}</div>
                        <div className="text-[10px] text-indigo-400 flex items-center justify-between pt-1">
                          <span>{r.source}</span>
                          <a href={r.link} target="_blank" rel="noreferrer" className="flex items-center gap-0.5 hover:underline">
                            View <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw JSON viewer */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-mono mb-1.5">
                  Raw JSON Payload:
                </span>
                <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 text-[11px] overflow-x-auto max-h-72 leading-relaxed">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
