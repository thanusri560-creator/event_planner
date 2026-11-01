import { EventPlan, ProposedAdjustment, SimulationScenario, SimulationResult } from '../types';

export interface AIConsultantResponse {
  success: boolean;
  answer: string;
  fallback?: boolean;
  cached?: boolean;
  error?: string;
}

export interface AIBudgetRationaleResponse {
  success: boolean;
  rationale: string;
  fallback?: boolean;
  cached?: boolean;
}

export interface AIStressAnalysisResponse {
  success: boolean;
  analysis: string;
  fallback?: boolean;
  cached?: boolean;
}

// Client-side in-memory response cache for rapid tab switches
const clientCache = new Map<string, { data: unknown; timestamp: number }>();
const CLIENT_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function getClientCached<T>(key: string): T | null {
  const entry = clientCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CLIENT_CACHE_TTL) {
    clientCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setClientCached<T>(key: string, data: T): void {
  clientCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Client-side service calling secure server endpoints with caching and graceful fallbacks
 */
export async function askAIConsultant(
  event: EventPlan,
  question: string,
  context?: { criticalTasks?: string[]; budgetDeficit?: number }
): Promise<AIConsultantResponse> {
  const cacheKey = `client:consultant:${question.trim().toLowerCase()}`;
  const cached = getClientCached<AIConsultantResponse>(cacheKey);
  if (cached) return cached;

  try {
    const eventSummary = {
      name: event.name,
      type: event.type,
      currency: event.currency,
      totalBudget: event.totalBudget,
      estimatedTotal: event.items.reduce((sum, i) => sum + (i.actualCost ?? i.estimatedCost), 0),
      guestCount: event.guestCount,
      daysLeft: event.eventDeadlineDays,
      healthStatus: event.status,
    };

    const res = await fetch('/api/ai/consultant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventSummary,
        question,
        context,
      }),
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const data = await res.json();
    const result: AIConsultantResponse = {
      success: true,
      answer: data.answer || 'Consultant response received.',
      fallback: Boolean(data.fallback),
      cached: Boolean(data.cached),
    };

    setClientCached(cacheKey, result);
    return result;
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.warn('AI Consultant call failed, falling back to local reasoning:', errMsg);
    return {
      success: true,
      fallback: true,
      answer: `### Strategic Recommendations
- Prioritize high-impact experiential touchpoints (food & music) over temporary backdrops.
- Build in a 7-day float on venue coordination to prevent downstream critical path blockages.
- Pre-negotiate cancellation buffers with all major vendors.`,
    };
  }
}

/**
 * Requests deep AI reasoning for algorithmic budget cuts
 */
export async function fetchBudgetOptimizationRationale(
  event: EventPlan,
  overspendAmount: number,
  adjustments: ProposedAdjustment[]
): Promise<AIBudgetRationaleResponse> {
  const cacheKey = `client:rationale:${overspendAmount}:${adjustments.length}`;
  const cached = getClientCached<AIBudgetRationaleResponse>(cacheKey);
  if (cached) return cached;

  try {
    const eventSummary = {
      name: event.name,
      type: event.type,
      currency: event.currency,
      totalBudget: event.totalBudget,
    };

    const priorities = event.categories.reduce((acc, cat) => {
      acc[cat.category] = cat.priority;
      return acc;
    }, {} as Record<string, string>);

    const res = await fetch('/api/ai/optimize-rationale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventSummary,
        overspendAmount,
        adjustments,
        priorities,
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const result: AIBudgetRationaleResponse = {
      success: true,
      rationale: data.rationale,
      fallback: Boolean(data.fallback),
      cached: Boolean(data.cached),
    };

    setClientCached(cacheKey, result);
    return result;
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.warn('Rationale fetch failed:', errMsg);
    return {
      success: true,
      fallback: true,
      rationale: `### Budget Optimization Justification
- **High-Priority Shielding**: Venue and Catering were protected to preserve essential guest comfort and food quality.
- **Selective Reductions**: Adjustments were limited to flexible decoration elements and redundant media crews where standard alternatives exist.
- **Estimated Savings**: Fully recovers the ₹${overspendAmount.toLocaleString()} deficit without reducing guest headcount.`,
    };
  }
}

/**
 * Requests AI stress analysis for mid-flight scenarios
 */
export async function fetchStressSimulationAnalysis(
  event: EventPlan,
  scenario: SimulationScenario,
  simulationResult: SimulationResult
): Promise<AIStressAnalysisResponse> {
  const cacheKey = `client:stress:${scenario.id}:${simulationResult.feasibilityScore}`;
  const cached = getClientCached<AIStressAnalysisResponse>(cacheKey);
  if (cached) return cached;

  try {
    const eventSummary = {
      name: event.name,
      currency: event.currency,
      totalBudget: event.totalBudget,
    };

    const res = await fetch('/api/ai/stress-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventSummary,
        scenario,
        simulationResult,
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const result: AIStressAnalysisResponse = {
      success: true,
      analysis: data.analysis,
      fallback: Boolean(data.fallback),
      cached: Boolean(data.cached),
    };

    setClientCached(cacheKey, result);
    return result;
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.warn('Stress analysis failed:', errMsg);
    return {
      success: true,
      fallback: true,
      analysis: `### Simulation Assessment
- **Feasibility Score**: ${simulationResult.feasibilityScore}% (${simulationResult.feasibilityStatus})
- **Primary Bottlenecks**: Capacity constraints and critical-path float compression require immediate timeline parallelization and vendor confirmation.
- **Recovery Strategy**: Approve the recommended budget re-allocations and crash the setup timeline with dedicated secondary crew.`,
    };
  }
}
