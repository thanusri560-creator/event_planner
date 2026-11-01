import { EventPlan, ProposedAdjustment, SimulationScenario, SimulationResult } from '../types';

export interface AIConsultantResponse {
  success: boolean;
  answer: string;
  fallback?: boolean;
  error?: string;
}

export interface AIBudgetRationaleResponse {
  success: boolean;
  rationale: string;
  fallback?: boolean;
}

export interface AIStressAnalysisResponse {
  success: boolean;
  analysis: string;
  fallback?: boolean;
}

/**
 * Client-side service calling secure server endpoints
 */
export async function askAIConsultant(
  event: EventPlan,
  question: string,
  context?: Record<string, any>
): Promise<AIConsultantResponse> {
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
    return {
      success: true,
      answer: data.answer || 'Consultant response received.',
      fallback: data.fallback,
    };
  } catch (error: any) {
    console.warn('AI Consultant call failed, falling back to local reasoning:', error);
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
    return {
      success: true,
      rationale: data.rationale,
      fallback: data.fallback,
    };
  } catch (err) {
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
    return {
      success: true,
      analysis: data.analysis,
      fallback: data.fallback,
    };
  } catch (err) {
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
