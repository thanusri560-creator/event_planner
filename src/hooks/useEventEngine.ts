import { useMemo } from 'react';
import { EventPlan, DAGScheduleResult, BudgetOptimizationResult, CategoryAllocation } from '../types';
import { calculateTotalEstimated, optimizeBudget, aggregateByCategory } from '../logic/budgetOptimizer';
import { calculateSchedule } from '../logic/dependencyScheduler';

export interface EventEngineData {
  totalEstimated: number;
  overspend: number;
  budgetUtilization: number;
  budgetRemaining: number;
  isOverBudget: boolean;
  scheduleResult: DAGScheduleResult;
  criticalTasksCount: number;
  completedTasksCount: number;
  progressPercent: number;
  optimizationResult: BudgetOptimizationResult;
  categoryAggregates: CategoryAllocation[];
}

/**
 * Custom hook providing memoized calculation engine values for an active event plan.
 * Prevents redundant CPM traversals and budget allocations when unrelated component states change.
 */
export function useEventEngine(activeEvent: EventPlan): EventEngineData {
  // Memoized total expenditure calculation
  const totalEstimated = useMemo(() => {
    return calculateTotalEstimated(activeEvent.items);
  }, [activeEvent.items]);

  // Memoized budget health metrics
  const { overspend, budgetUtilization, budgetRemaining, isOverBudget } = useMemo(() => {
    const ov = Math.max(0, totalEstimated - activeEvent.totalBudget);
    const util = Math.round((totalEstimated / Math.max(1, activeEvent.totalBudget)) * 100);
    const rem = activeEvent.totalBudget - totalEstimated;
    return {
      overspend: ov,
      budgetUtilization: util,
      budgetRemaining: rem,
      isOverBudget: ov > 0,
    };
  }, [totalEstimated, activeEvent.totalBudget]);

  // Memoized category allocations aggregation
  const categoryAggregates = useMemo(() => {
    return aggregateByCategory(activeEvent.categories, activeEvent.items);
  }, [activeEvent.categories, activeEvent.items]);

  // Memoized DAG Schedule CPM calculation
  const scheduleResult = useMemo(() => {
    return calculateSchedule(activeEvent.tasks, activeEvent.eventDeadlineDays);
  }, [activeEvent.tasks, activeEvent.eventDeadlineDays]);

  // Memoized task completion metrics
  const { completedTasksCount, criticalTasksCount, progressPercent } = useMemo(() => {
    const completed = activeEvent.tasks.filter((t) => t.status === 'completed').length;
    const critical = scheduleResult.criticalPathTaskIds.length;
    const progress = Math.round((completed / Math.max(1, activeEvent.tasks.length)) * 100);
    return {
      completedTasksCount: completed,
      criticalTasksCount: critical,
      progressPercent: progress,
    };
  }, [activeEvent.tasks, scheduleResult.criticalPathTaskIds]);

  // Memoized optimization proposal
  const optimizationResult = useMemo(() => {
    return optimizeBudget(
      activeEvent.totalBudget,
      activeEvent.categories,
      activeEvent.items
    );
  }, [activeEvent.totalBudget, activeEvent.categories, activeEvent.items]);

  return {
    totalEstimated,
    overspend,
    budgetUtilization,
    budgetRemaining,
    isOverBudget,
    scheduleResult,
    criticalTasksCount,
    completedTasksCount,
    progressPercent,
    optimizationResult,
    categoryAggregates,
  };
}
