import { SerpApiEngine, SearchResultItem, SearchQueryPlan, StreamEvent, IntelligenceReport } from '../src/types.js';
import { executeSerpApiSearch } from './serpapi.js';
import { getAiClient, planSearchQueries, evaluateEvidence, synthesizeIntelligenceReport } from './gemini.js';

export interface ResearchAgentOptions {
  query: string;
  depth: 'fast' | 'deep'; // 'fast' = 1 loop, 'deep' = 2 loops with recursive critic
  engines?: SerpApiEngine[];
}

export async function* runAutonomousResearch(
  options: ResearchAgentOptions
): AsyncGenerator<StreamEvent, void, unknown> {
  const startTime = Date.now();
  const query = (typeof options?.query === 'string' ? options.query : String(options?.query || '')).trim() || 'General Research';
  const depth = options.depth || 'deep';
  const defaultEngines: SerpApiEngine[] = ['google', 'google_news', 'google_scholar'];
  const engines: SerpApiEngine[] = options.engines && options.engines.length > 0
    ? options.engines
    : defaultEngines;

  let iteration = 1;
  let cacheHitCount = 0;
  let queriesExecuted = 0;
  const allResults: SearchResultItem[] = [];
  const enginesUsedSet = new Set<SerpApiEngine>();

  const sendEvent = (type: StreamEvent['type'], payload: any): StreamEvent => ({
    type,
    payload,
    timestamp: Date.now(),
  });

  try {
    // -------------------------------------------------------------
    // PHASE 1: PLANNING & QUERY DECOMPOSITION
    // -------------------------------------------------------------
    yield sendEvent('phase_change', { phase: 'planning', iteration });
    yield sendEvent('log', {
      phase: 'planning',
      level: 'info',
      message: `Analyzing research domain for: "${query}"`,
    });
    yield sendEvent('log', {
      phase: 'planning',
      level: 'tool',
      message: `Calibrating SerpApi vectors across ${engines.length} engines (${depth.toUpperCase()} Mode)`,
    });

    const ai = getAiClient();
    const plannedQueries = await planSearchQueries(query, engines, depth);

    yield sendEvent('plan_generated', {
      queries: plannedQueries,
      count: plannedQueries.length,
      engines: Array.from(new Set(plannedQueries.map((p) => p.engine))),
    });

    yield sendEvent('log', {
      phase: 'planning',
      level: 'success',
      message: `Formulated ${plannedQueries.length} specialized search vectors across ${new Set(plannedQueries.map(p => p.engine)).size} engines.`,
    });

    // -------------------------------------------------------------
    // PHASE 2: PARALLEL MULTI-ENGINE SEARCH RETRIEVAL (SERPAPI)
    // -------------------------------------------------------------
    yield sendEvent('phase_change', { phase: 'retrieving', iteration });

    // 1. Emit all tool calls so UI shows parallel dispatch immediately
    for (const plan of plannedQueries) {
      queriesExecuted++;
      enginesUsedSet.add(plan.engine);

      yield sendEvent('tool_call', {
        id: plan.id,
        engine: plan.engine,
        query: plan.query,
        rationale: plan.rationale,
      });

      yield sendEvent('log', {
        phase: 'retrieving',
        level: 'tool',
        message: `Dispatching SerpApi [${plan.engine.toUpperCase()}]: "${plan.query}"`,
        metadata: { engine: plan.engine, query: plan.query },
      });
    }

    // 2. Fetch all planned queries in parallel to drastically cut latency
    const searchPromises = plannedQueries.map(async (plan) => {
      const searchRes = await executeSerpApiSearch(plan.query, plan.engine, ai);
      return { plan, ...searchRes };
    });

    const searchResponses = await Promise.all(searchPromises);

    for (const item of searchResponses) {
      if (item.fromCache) cacheHitCount++;
      allResults.push(...item.results);

      yield sendEvent('tool_result', {
        id: item.plan.id,
        engine: item.plan.engine,
        query: item.plan.query,
        count: item.results.length,
        fromCache: item.fromCache,
        fromLiveApi: item.fromLiveApi,
        topItem: item.results[0] ? { title: item.results[0].title, source: item.results[0].source } : null,
      });

      yield sendEvent('log', {
        phase: 'retrieving',
        level: 'info',
        message: `Received ${item.results.length} verified records from SerpApi ${item.plan.engine} ${item.fromCache ? '(Cached)' : item.fromLiveApi ? '(Live API)' : '(Grounded Engine)'}.`,
      });
    }

    // -------------------------------------------------------------
    // PHASE 3: CRITIC & FACT-CHECKING EVALUATION
    // -------------------------------------------------------------
    yield sendEvent('phase_change', { phase: 'evaluating', iteration });
    yield sendEvent('log', {
      phase: 'evaluating',
      level: 'critic',
      message: `Critiquing ${allResults.length} collected evidence points for bias, factual gaps, and consensus...`,
    });

    let criticReview = await evaluateEvidence(query, allResults, iteration);

    yield sendEvent('critic_evaluated', {
      review: criticReview,
      iteration,
    });

    yield sendEvent('log', {
      phase: 'evaluating',
      level: criticReview.isSufficient ? 'success' : 'warning',
      message: `Critic consensus: ${criticReview.consensusLevel.replace('_', ' ')} (${criticReview.confidenceAssessment} confidence). ${criticReview.summaryEvaluation}`,
    });

    // Recursive Loop (if deep mode enabled, gaps found, and iteration < 2)
    if (!criticReview.isSufficient && criticReview.identifiedGaps.length > 0 && depth === 'deep' && iteration === 1) {
      iteration = 2;
      yield sendEvent('phase_change', { phase: 're_retrieving', iteration });

      for (const gap of criticReview.identifiedGaps.slice(0, 2)) {
        if (!gap) continue;
        const targetEngine: SerpApiEngine = (gap.engine && engines.includes(gap.engine)) ? gap.engine : 'google';
        const rawQ = gap.query || gap.topic || gap.reason;
        const gapQueryStr = typeof rawQ === 'string' && rawQ.trim() ? rawQ.trim() : `${query} details`;
        const gapReasonStr = typeof gap.reason === 'string' ? gap.reason : 'Targeting knowledge gap';

        queriesExecuted++;
        enginesUsedSet.add(targetEngine);

        yield sendEvent('tool_call', {
          id: `gap-${Date.now()}`,
          engine: targetEngine,
          query: gapQueryStr,
          rationale: gapReasonStr,
        });

        yield sendEvent('log', {
          phase: 're_retrieving',
          level: 'tool',
          message: `Recursive Loop: SerpApi [${targetEngine.toUpperCase()}] addressing gap: "${gapQueryStr}"`,
        });

        const { results, fromCache, fromLiveApi } = await executeSerpApiSearch(gapQueryStr, targetEngine, ai);
        if (fromCache) cacheHitCount++;
        allResults.push(...results);

        yield sendEvent('tool_result', {
          id: `gap-${Date.now()}`,
          engine: targetEngine,
          query: gapQueryStr,
          count: results.length,
          fromCache,
          fromLiveApi,
          topItem: results[0] ? { title: results[0].title, source: results[0].source } : null,
        });
      }

      // Final critic stamp after loop 2
      criticReview = await evaluateEvidence(query, allResults, iteration);
      yield sendEvent('critic_evaluated', {
        review: criticReview,
        iteration,
      });
    }

    // -------------------------------------------------------------
    // PHASE 4: SYNTHESIS & DOSSIER GENERATION
    // -------------------------------------------------------------
    yield sendEvent('phase_change', { phase: 'synthesizing', iteration });
    yield sendEvent('log', {
      phase: 'synthesizing',
      level: 'info',
      message: `Synthesizing final evidence dossier with verified claims, confidence scores, and citations...`,
    });

    const metrics = {
      totalSourcesConsulted: allResults.length,
      enginesUsed: Array.from(enginesUsedSet),
      searchDurationMs: Date.now() - startTime,
      iterationsCount: iteration,
      cacheHitCount,
      queriesExecuted,
    };

    const report = await synthesizeIntelligenceReport(query, allResults, criticReview, metrics);

    yield sendEvent('report_synthesized', { report });

    yield sendEvent('phase_change', { phase: 'completed', iteration });
    yield sendEvent('log', {
      phase: 'completed',
      level: 'success',
      message: `Dossier compiled in ${(metrics.searchDurationMs / 1000).toFixed(1)}s across ${metrics.totalSourcesConsulted} verified multi-engine citations.`,
    });

    yield sendEvent('done', {
      metrics,
    });
  } catch (error: any) {
    console.error('[Autonomous Agent Loop Failure]', error);
    yield sendEvent('phase_change', { phase: 'error', iteration });
    yield sendEvent('error', {
      message: error.message || 'An unexpected error occurred during deep research execution.',
    });
  }
}
