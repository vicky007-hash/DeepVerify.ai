import React, { useState } from 'react';
import { ExternalLink, Globe, Newspaper, GraduationCap, ShoppingBag, Briefcase, Search, Filter } from 'lucide-react';
import { SearchResultItem, SerpApiEngine } from '../types.ts';

interface SourcesMatrixProps {
  sources: SearchResultItem[];
}

export const SourcesMatrix: React.FC<SourcesMatrixProps> = ({ sources }) => {
  const [selectedEngine, setSelectedEngine] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState('');

  const filteredSources = sources.filter((s) => {
    const matchesEngine = selectedEngine === 'all' || s.engine === selectedEngine;
    const matchesSearch =
      !searchFilter.trim() ||
      s.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.snippet.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.source.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesEngine && matchesSearch;
  });

  const getEngineBadge = (engine: SerpApiEngine) => {
    switch (engine) {
      case 'google_news':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Newspaper className="h-3 w-3" />
            News
          </span>
        );
      case 'google_scholar':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <GraduationCap className="h-3 w-3" />
            Scholar
          </span>
        );
      case 'google_shopping':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
            <ShoppingBag className="h-3 w-3" />
            Shopping
          </span>
        );
      case 'google_jobs':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
            <Briefcase className="h-3 w-3" />
            Jobs
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <Globe className="h-3 w-3" />
            Web
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span>Evidence & Citation Directory</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {sources.length} sources
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Structured records gathered across SerpApi search engines for this investigation.
          </p>
        </div>

        {/* Search within sources */}
        <div className="relative w-full sm:w-64">
          <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter citations by keyword..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Engine Tabs */}
      <div className="flex items-center gap-1.5 flex-wrap border-b border-slate-800 pb-2.5">
        <button
          onClick={() => setSelectedEngine('all')}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
            selectedEngine === 'all'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          All Sources ({sources.length})
        </button>
        {['google', 'google_news', 'google_scholar', 'google_shopping', 'google_jobs'].map((eng) => {
          const count = sources.filter((s) => s.engine === eng).length;
          if (count === 0) return null;
          return (
            <button
              key={eng}
              onClick={() => setSelectedEngine(eng)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                selectedEngine === eng
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {eng.replace('google_', '').toUpperCase()} ({count})
            </button>
          );
        })}
      </div>

      {/* Sources List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredSources.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between space-y-2.5 group"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {getEngineBadge(item.engine)}
                  <span className="text-xs text-slate-400 font-medium truncate max-w-[160px]">
                    {item.source}
                  </span>
                </div>
                {item.publishedDate && (
                  <span className="text-[11px] text-slate-500 font-mono">
                    {item.publishedDate}
                  </span>
                )}
              </div>

              <h4 className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition-colors leading-snug line-clamp-2">
                {item.title}
              </h4>

              <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3">
                {item.snippet}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
              <div className="text-slate-500 font-mono">
                {item.citationCount !== undefined && `Cited by ${item.citationCount} papers`}
                {item.price && `Price: ${item.price}`}
                {item.authors && `Authors: ${item.authors}`}
              </div>

              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                <span>Visit Source</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
