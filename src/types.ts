export type SerpApiEngine = 
  | 'google' 
  | 'google_news' 
  | 'google_scholar' 
  | 'google_shopping' 
  | 'google_jobs';

export interface SearchQueryPlan {
  id: string;
  query: string;
  engine: SerpApiEngine;
  rationale: string;
  priority: 'high' | 'medium';
}

export interface SearchResultItem {
  id: string;
  title: string;
  snippet: string;
  link: string;
  source: string;
  engine: SerpApiEngine;
  publishedDate?: string;
  authors?: string;
  price?: string;
  citationCount?: number;
  relevanceScore?: number;
}

export interface CriticGap {
  topic: string;
  query: string;
  engine: SerpApiEngine;
  reason: string;
}

export interface CriticReview {
  isSufficient: boolean;
  confidenceAssessment: 'HIGH' | 'MEDIUM' | 'LOW';
  consensusLevel: 'STRONG_CONSENSUS' | 'MODERATE_CONSENSUS' | 'CONFLICTING_REPORTS' | 'LIMITED_DATA';
  biasOrConflictNotes?: string;
  identifiedGaps: CriticGap[];
  summaryEvaluation: string;
}

export interface VerifiedClaim {
  id: string;
  claim: string;
  status: 'verified' | 'disputed' | 'emerging';
  confidenceScore: number; // 0 to 100
  supportingSourceIds: string[];
  divergentSourceIds?: string[];
  analysis: string;
}

export interface IntelligenceReport {
  title: string;
  executiveSummary: string;
  verifiedClaims: VerifiedClaim[];
  keyFindings: string[];
  unresolvedGaps: string[];
  fullMarkdown: string;
  confidenceScore: number;
  sources: SearchResultItem[];
  metrics: {
    totalSourcesConsulted: number;
    enginesUsed: SerpApiEngine[];
    searchDurationMs: number;
    iterationsCount: number;
    cacheHitCount: number;
    queriesExecuted: number;
  };
}

export type AgentPhase = 
  | 'idle' 
  | 'planning' 
  | 'retrieving' 
  | 'evaluating' 
  | 're_retrieving' 
  | 'synthesizing' 
  | 'completed' 
  | 'error';

export interface AgentLogEntry {
  id: string;
  timestamp: number;
  phase: AgentPhase;
  level: 'info' | 'tool' | 'critic' | 'success' | 'warning';
  message: string;
  metadata?: Record<string, any>;
}

export interface StreamEvent {
  type: 
    | 'phase_change' 
    | 'log' 
    | 'plan_generated' 
    | 'tool_call' 
    | 'tool_result' 
    | 'critic_evaluated' 
    | 'report_chunk' 
    | 'report_synthesized' 
    | 'done' 
    | 'error';
  payload: any;
  timestamp: number;
}

export interface SystemStatus {
  geminiConfigured: boolean;
  serpapiConfigured: boolean;
  activeEngines: SerpApiEngine[];
  cacheStats: {
    totalCachedQueries: number;
  };
}
