import React, { useState } from 'react';
import { Search, Sparkles, Sliders, Layers, Globe, Newspaper, GraduationCap, ShoppingBag, Briefcase, Zap, RotateCcw } from 'lucide-react';
import { SerpApiEngine } from '../types.ts';

interface ResearchInputProps {
  onStartResearch: (query: string, depth: 'fast' | 'deep', engines: SerpApiEngine[]) => void;
  isLoading: boolean;
  onCancel?: () => void;
}

const PRESET_TOPICS = [
  {
    category: 'Hardware & Tech India',
    title: 'India Semiconductor Mission 2026',
    query: 'India Semiconductor Mission 2026 commercial fab progress, Tata-PSMC Dholera fab status, and supply chain ecosystem',
    recommendedEngines: ['google', 'google_news', 'google_scholar'] as SerpApiEngine[],
  },
  {
    category: 'Agentic AI & MCP',
    title: 'Autonomous AI Agents vs MCP Benchmark',
    query: 'Autonomous Agentic AI frameworks vs Model Context Protocol (MCP) production benchmarks, tool-calling latency, and architecture',
    recommendedEngines: ['google', 'google_scholar', 'google_news'] as SerpApiEngine[],
  },
  {
    category: 'CleanTech & Energy',
    title: 'Solid-State EV Battery Deployment',
    query: 'Solid-state battery commercial EV deployment timeline, energy density milestones, and verified automotive OEM patent filings',
    recommendedEngines: ['google', 'google_scholar', 'google_news'] as SerpApiEngine[],
  },
  {
    category: 'Quantum Computing',
    title: 'Quantum Error Correction 2026',
    query: 'Quantum error correction 2026 breakthroughs, logical qubit fault-tolerant milestones, and commercial viability',
    recommendedEngines: ['google', 'google_scholar', 'google_news'] as SerpApiEngine[],
  },
];

const ENGINES_CONFIG: { id: SerpApiEngine; label: string; icon: React.ReactNode; badge: string }[] = [
  { id: 'google', label: 'Web', icon: <Globe className="h-3.5 w-3.5 text-blue-400" />, badge: 'Organic' },
  { id: 'google_news', label: 'News', icon: <Newspaper className="h-3.5 w-3.5 text-amber-400" />, badge: 'Breaking' },
  { id: 'google_scholar', label: 'Scholar', icon: <GraduationCap className="h-3.5 w-3.5 text-emerald-400" />, badge: 'Peer-Reviewed' },
  { id: 'google_shopping', label: 'Shopping', icon: <ShoppingBag className="h-3.5 w-3.5 text-pink-400" />, badge: 'Pricing' },
  { id: 'google_jobs', label: 'Jobs', icon: <Briefcase className="h-3.5 w-3.5 text-violet-400" />, badge: 'Hiring' },
];

export const ResearchInput: React.FC<ResearchInputProps> = ({
  onStartResearch,
  isLoading,
  onCancel,
}) => {
  const [query, setQuery] = useState('');
  const [depth, setDepth] = useState<'fast' | 'deep'>('fast');
  const [selectedEngines, setSelectedEngines] = useState<SerpApiEngine[]>([
    'google',
    'google_news',
    'google_scholar',
  ]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || isLoading) return;
    onStartResearch(query.trim(), depth, selectedEngines);
  };

  const toggleEngine = (engine: SerpApiEngine) => {
    if (selectedEngines.includes(engine)) {
      if (selectedEngines.length > 1) {
        setSelectedEngines(selectedEngines.filter((e) => e !== engine));
      }
    } else {
      setSelectedEngines([...selectedEngines, engine]);
    }
  };

  const handleSelectPreset = (preset: typeof PRESET_TOPICS[0]) => {
    setQuery(preset.query);
    setSelectedEngines(preset.recommendedEngines);
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl shadow-slate-950/40">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Main Search Input Bar */}
        <div className="relative flex items-center">
          <div className="absolute left-4 pointer-events-none text-slate-400">
            <Search className="h-5 w-5 text-indigo-400" />
          </div>
          <input
            id="input-research-query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
            placeholder="Enter research topic, disputed claim, or technological thesis to investigate..."
            className="w-full pl-12 pr-32 py-4 bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm md:text-base font-medium transition-all shadow-inner disabled:opacity-60"
          />
          <div className="absolute right-2.5 flex items-center gap-2">
            <button
              id="btn-run-research"
              type="submit"
              disabled={isLoading || !query.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:hover:bg-indigo-600 shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RotateCcw className="h-4 w-4 animate-spin text-white" />
                  <span>Investigating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Deep Verify</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Options Row: Depth Toggle & Multi-Engine Selector */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1 border-t border-slate-800/80 text-xs">
          {/* Engine Multi-Select Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-slate-400" />
              SerpApi Endpoints:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {ENGINES_CONFIG.map((eng) => {
                const isSelected = selectedEngines.includes(eng.id);
                return (
                  <button
                    key={eng.id}
                    id={`toggle-engine-${eng.id}`}
                    type="button"
                    onClick={() => toggleEngine(eng.id)}
                    disabled={isLoading}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800 border-indigo-500/60 text-slate-100 font-medium shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {eng.icon}
                    <span>{eng.label}</span>
                    <span className="text-[10px] text-slate-400 opacity-70">({eng.badge})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Depth Mode Selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Sliders className="h-3.5 w-3.5 text-slate-400" />
              Agent Loop Depth:
            </span>
            <div className="flex rounded-lg bg-slate-950 border border-slate-800 p-0.5">
              <button
                id="btn-depth-fast"
                type="button"
                onClick={() => setDepth('fast')}
                disabled={isLoading}
                className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  depth === 'fast'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="1-Iteration: Rapid factual verification"
              >
                <Zap className="h-3 w-3" />
                <span>⚡ Fast (Quick)</span>
              </button>
              <button
                id="btn-depth-deep"
                type="button"
                onClick={() => setDepth('deep')}
                disabled={isLoading}
                className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  depth === 'deep'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="2-Iterations: Autonomous critic, gap radar, and recursive retrieval"
              >
                <RotateCcw className="h-3 w-3" />
                <span>🔬 Deep (Recursive)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Preset Topics for Rapid Evaluation */}
        <div className="pt-2 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-medium">Try Hackathon Showcases:</span>
          {PRESET_TOPICS.map((preset, idx) => (
            <button
              key={idx}
              id={`btn-preset-${idx}`}
              type="button"
              disabled={isLoading}
              onClick={() => handleSelectPreset(preset)}
              className="text-xs px-2.5 py-1 rounded-md bg-slate-950/80 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 text-slate-300 hover:text-slate-100 transition-colors text-left truncate max-w-xs cursor-pointer"
              title={preset.query}
            >
              <span className="text-indigo-400 font-semibold mr-1">#{preset.category.split(' ')[0]}:</span>
              {preset.title}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
};
