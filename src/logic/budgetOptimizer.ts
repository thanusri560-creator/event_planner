/**
 * @file budgetOptimizer.ts
 * @description Priority-Aware Deterministic Budget Optimization Engine.
 *
 * Mathematical Formulation:
 * Let B be the total event budget ceiling.
 * Let I = {item_1, item_2, ..., item_n} be the set of expense items.
 * Each item_i has:
 *   - c_i: current estimated cost
 *   - m_i: minimum viable cost floor (m_i <= c_i) below which quality degrades
 *   - p_i in {high, medium, low}: priority tier
 *
 * Total estimated expenditure: S = sum_{i=1}^n c_i
 * Overspend deficit: Delta = max(0, S - B)
 * Reducible margin per item: R_i = max(0, c_i - m_i)
 *
 * Proportional Relaxation Protocol:
 * 1. Low Priority Phase:
 *    Let L = {i | p_i = low, R_i > 0}.
 *    Total low-tier reducible capacity: R_low = sum_{i in L} R_i.
 *    If R_low > 0: cutRatio = min(1.0, Delta / R_low).
 *    delta_i = round(R_i * cutRatio). Delta_remaining = Delta - sum delta_i.
 *
 * 2. Medium Priority Phase:
 *    If Delta_remaining > 0:
 *    Let M = {i | p_i = medium, R_i > 0}.
 *    Repeat proportional scaling over M until Delta_remaining = 0 or M exhausted.
 *
 * 3. High Priority Shielding:
 *    Items with p_i = high are shielded from mandatory reductions to preserve
 *    foundational guest hospitality (e.g. food quality and venue safety).
 */

import {
  BudgetCategory,
  BudgetItem,
  CategoryAllocation,
  ProposedAdjustment,
  BudgetOptimizationResult,
  PriorityLevel,
} from '../types';

export interface OptimizeOptions {
  preserveHighPriority?: boolean;
  minViableCostFactor?: number;
}

/**
 * Calculates current total expenditure across all budget items
 */
export function calculateTotalEstimated(items: BudgetItem[]): number {
  return items.reduce((sum, item) => sum + (item.actualCost ?? item.estimatedCost), 0);
}

/**
 * Aggregates expenditures by category
 */
export function aggregateByCategory(
  categories: CategoryAllocation[],
  items: BudgetItem[]
): CategoryAllocation[] {
  return categories.map((cat) => {
    const categoryItems = items.filter((i) => i.categoryId === cat.category);
    const estimatedSum = categoryItems.reduce(
      (sum, item) => sum + (item.actualCost ?? item.estimatedCost),
      0
    );
    return {
      ...cat,
      estimatedAmount: estimatedSum,
    };
  });
}

/**
 * Generates an alternative reduction suggestion based on item category and priority
 */
function getAdjustmentReason(item: BudgetItem, amountSaved: number): { reason: string; impact: string } {
  switch (item.categoryId) {
    case 'decoration':
      return {
        reason: `Shift from bespoke fresh-floral stage arches to high-impact architectural uplighting, reusable fabric drapes, and minimalist centerpieces.`,
        impact: `Preserves the elegant aesthetic while trimming premium floral waste; saves ₹${amountSaved.toLocaleString()}.`,
      };
    case 'photography':
      return {
        reason: `Transition from multi-drone cinematic package to single principal photographer + high-speed 4K digital album.`,
        impact: `Covers every key milestone moment without high-crew travel overhead; saves ₹${amountSaved.toLocaleString()}.`,
      };
    case 'entertainment':
      return {
        reason: `Re-negotiate sound equipment rider and switch from live celebrity setup to top-rated local resident DJ & sound engineer.`,
        impact: `Keeps dance floor energy high while reducing rider backline costs; saves ₹${amountSaved.toLocaleString()}.`,
      };
    case 'transportation':
      return {
        reason: `Consolidate individual passenger car rentals into a scheduled 40-seater luxury transit shuttle.`,
        impact: `Streamlines arrivals and reduces fuel & parking tariffs; saves ₹${amountSaved.toLocaleString()}.`,
      };
    case 'miscellaneous':
      return {
        reason: `Migrate printed brochures and paper badges to interactive QR digital portals and lightweight eco-passes.`,
        impact: `Reduces print turnaround risk and eliminates paper scrap; saves ₹${amountSaved.toLocaleString()}.`,
      };
    case 'catering':
      return {
        reason: `Streamline buffet stations by swapping 2 redundant live dessert counters for curated plated desserts.`,
        impact: `Zero compromise on entree portion sizes or main dish quality; saves ₹${amountSaved.toLocaleString()}.`,
      };
    case 'venue':
      return {
        reason: `Negotiate standard hall hire with complimentary green-room access in exchange for early load-out timing.`,
        impact: `Same venue grandeur without peak overtime penalty rates; saves ₹${amountSaved.toLocaleString()}.`,
      };
    default:
      return {
        reason: `Optimized component scale to meet target event budget baseline.`,
        impact: `Saves ₹${amountSaved.toLocaleString()} with minimal guest perception.`,
      };
  }
}

/**
 * Deterministic Dynamic Budget Optimization Engine
 * Evaluates overspending, prioritizes protective shielding for high-priority items,
 * and proportionally distributes cuts across flexible low and medium priority categories.
 */
export function optimizeBudget(
  totalBudget: number,
  categories: CategoryAllocation[],
  items: BudgetItem[],
  options: OptimizeOptions = { preserveHighPriority: true }
): BudgetOptimizationResult {
  const currentTotal = calculateTotalEstimated(items);
  const overspend = currentTotal - totalBudget;

  if (overspend <= 0) {
    return {
      isOverBudget: false,
      totalBudget,
      totalEstimated: currentTotal,
      overspendAmount: 0,
      targetReductionNeeded: 0,
      adjustments: [],
      totalSaved: 0,
      remainingDeficit: 0,
      projectedNewTotal: currentTotal,
      feasibilityRating: 'fully_balanced',
      aiSummaryExplanation: `Budget is fully balanced. Projected expenses (₹${currentTotal.toLocaleString()}) are within the allocated ₹${totalBudget.toLocaleString()} limit.`,
    };
  }

  // Create a priority map for quick lookup from category allocations
  const categoryPriorityMap = new Map<BudgetCategory, PriorityLevel>();
  categories.forEach((c) => categoryPriorityMap.set(c.category, c.priority));

  // Determine effective priority of each item (item priority takes precedence, fallback to category)
  const itemsWithEffectivePriority = items.map((item) => {
    const effectivePriority = item.priority || categoryPriorityMap.get(item.categoryId) || 'medium';
    // Max reduction possible is item.estimatedCost - minViableCost
    const minCost = item.minViableCost > 0 ? item.minViableCost : item.estimatedCost * 0.4;
    const reducibleAmount = Math.max(0, item.estimatedCost - minCost);

    return {
      item,
      effectivePriority,
      minCost,
      reducibleAmount,
    };
  });

  let remainingToCut = overspend;
  const proposedAdjustments: ProposedAdjustment[] = [];

  // Phase 1: Cut from LOW priority items first
  const lowPriorityItems = itemsWithEffectivePriority.filter(
    (x) => x.effectivePriority === 'low' && x.reducibleAmount > 0
  );
  const totalLowReducible = lowPriorityItems.reduce((sum, x) => sum + x.reducibleAmount, 0);

  if (totalLowReducible > 0 && remainingToCut > 0) {
    const cutRatio = Math.min(1.0, remainingToCut / totalLowReducible);

    for (const entry of lowPriorityItems) {
      const cut = Math.round(entry.reducibleAmount * cutRatio);
      if (cut > 0) {
        const itemSaved = Math.min(cut, remainingToCut);
        const { reason, impact } = getAdjustmentReason(entry.item, itemSaved);
        proposedAdjustments.push({
          itemId: entry.item.id,
          itemName: entry.item.name,
          category: entry.item.categoryId,
          priority: 'low',
          currentCost: entry.item.estimatedCost,
          proposedCost: entry.item.estimatedCost - itemSaved,
          amountSaved: itemSaved,
          reason,
          impactDescription: impact,
          approved: true, // Default checked for user preview
        });
        remainingToCut -= itemSaved;
        if (remainingToCut <= 0) break;
      }
    }
  }

  // Phase 2: If still over budget, cut from MEDIUM priority items
  if (remainingToCut > 0) {
    const medPriorityItems = itemsWithEffectivePriority.filter(
      (x) => x.effectivePriority === 'medium' && x.reducibleAmount > 0
    );
    const totalMedReducible = medPriorityItems.reduce((sum, x) => sum + x.reducibleAmount, 0);

    if (totalMedReducible > 0) {
      const cutRatio = Math.min(1.0, remainingToCut / totalMedReducible);

      for (const entry of medPriorityItems) {
        const cut = Math.round(entry.reducibleAmount * cutRatio);
        if (cut > 0) {
          const itemSaved = Math.min(cut, remainingToCut);
          const { reason, impact } = getAdjustmentReason(entry.item, itemSaved);
          proposedAdjustments.push({
            itemId: entry.item.id,
            itemName: entry.item.name,
            category: entry.item.categoryId,
            priority: 'medium',
            currentCost: entry.item.estimatedCost,
            proposedCost: entry.item.estimatedCost - itemSaved,
            amountSaved: itemSaved,
            reason,
            impactDescription: impact,
            approved: true,
          });
          remainingToCut -= itemSaved;
          if (remainingToCut <= 0) break;
        }
      }
    }
  }

  // Phase 3: Only if NOT preserving high priority and still running deficit, touch high priority items
  if (remainingToCut > 0 && !options.preserveHighPriority) {
    const highPriorityItems = itemsWithEffectivePriority.filter(
      (x) => x.effectivePriority === 'high' && x.reducibleAmount > 0
    );
    const totalHighReducible = highPriorityItems.reduce((sum, x) => sum + x.reducibleAmount, 0);

    if (totalHighReducible > 0) {
      const cutRatio = Math.min(1.0, remainingToCut / totalHighReducible);
      for (const entry of highPriorityItems) {
        const cut = Math.round(entry.reducibleAmount * cutRatio);
        if (cut > 0) {
          const itemSaved = Math.min(cut, remainingToCut);
          const { reason, impact } = getAdjustmentReason(entry.item, itemSaved);
          proposedAdjustments.push({
            itemId: entry.item.id,
            itemName: entry.item.name,
            category: entry.item.categoryId,
            priority: 'high',
            currentCost: entry.item.estimatedCost,
            proposedCost: entry.item.estimatedCost - itemSaved,
            amountSaved: itemSaved,
            reason,
            impactDescription: impact,
            approved: false, // Default unchecked because it's high priority
          });
          remainingToCut -= itemSaved;
          if (remainingToCut <= 0) break;
        }
      }
    }
  }

  const totalSaved = proposedAdjustments.reduce((sum, a) => sum + a.amountSaved, 0);
  const remainingDeficit = Math.max(0, overspend - totalSaved);
  const projectedNewTotal = currentTotal - totalSaved;

  let feasibilityRating: 'fully_balanced' | 'achievable_with_tradeoffs' | 'severe_deficit' =
    'fully_balanced';
  if (remainingDeficit > 0) {
    feasibilityRating = remainingDeficit > totalBudget * 0.1 ? 'severe_deficit' : 'achievable_with_tradeoffs';
  }

  return {
    isOverBudget: true,
    totalBudget,
    totalEstimated: currentTotal,
    overspendAmount: overspend,
    targetReductionNeeded: overspend,
    adjustments: proposedAdjustments,
    totalSaved,
    remainingDeficit,
    projectedNewTotal,
    feasibilityRating,
    aiSummaryExplanation: `Detected ₹${overspend.toLocaleString()} overspend above ₹${totalBudget.toLocaleString()} limit. Preserved core High-Priority items while identifying ₹${totalSaved.toLocaleString()} in safe cuts across ${proposedAdjustments.length} flexible line-items.`,
  };
}

/**
 * Applies approved adjustments to the event's line items and updates category allocations
 */
export function applyApprovedAdjustments(
  items: BudgetItem[],
  categories: CategoryAllocation[],
  adjustments: ProposedAdjustment[]
): { updatedItems: BudgetItem[]; updatedCategories: CategoryAllocation[] } {
  const approvedMap = new Map<string, number>();
  adjustments.forEach((adj) => {
    if (adj.approved !== false) {
      approvedMap.set(adj.itemId, adj.proposedCost);
    }
  });

  const updatedItems = items.map((item) => {
    if (approvedMap.has(item.id)) {
      return {
        ...item,
        estimatedCost: approvedMap.get(item.id)!,
      };
    }
    return item;
  });

  const updatedCategories = aggregateByCategory(categories, updatedItems);
  return { updatedItems, updatedCategories };
}
