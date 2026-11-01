import {
  EventPlan,
  SimulationScenario,
  SimulationResult,
  BudgetItem,
  CategoryAllocation,
  Task,
  RecoveryStep,
  BudgetCategory,
} from '../types';
import { calculateTotalEstimated, optimizeBudget } from './budgetOptimizer';
import { calculateSchedule } from './dependencyScheduler';

/**
 * Mid-Flight What-If Stress Simulation Engine
 * Performs deep impact analysis combining budget, timeline, capacity, and vendor dependencies.
 */
export function simulateScenario(
  event: EventPlan,
  scenario: SimulationScenario
): SimulationResult {
  // Snapshot baseline "before" state
  const beforeEstimated = calculateTotalEstimated(event.items);
  const beforeSchedule = calculateSchedule(event.tasks, event.eventDeadlineDays);
  const beforeRemaining = event.totalBudget - beforeEstimated;

  // 1. Calculate Guest Delta Impacts
  const newGuestCount = Math.max(10, event.guestCount + (scenario.guestDelta || 0));
  const guestRatio = newGuestCount / event.guestCount;

  // 2. Calculate Budget Delta Impacts
  let newTotalBudget = event.totalBudget;
  if (scenario.budgetPercentDelta) {
    newTotalBudget = Math.round(event.totalBudget * (1 + scenario.budgetPercentDelta / 100));
  }
  if (scenario.budgetAbsoluteDelta) {
    newTotalBudget = Math.max(10000, newTotalBudget + scenario.budgetAbsoluteDelta);
  }

  // 3. Recalculate Budget Items based on Guest Count scaling and Custom Requirements
  const simulatedItems: BudgetItem[] = event.items.map((item) => {
    let cost = item.estimatedCost;

    // Items with variable cost per guest scale directly with headcount
    if (item.costPerGuest && item.costPerGuest > 0) {
      const fixed = item.fixedCost || 0;
      cost = fixed + item.costPerGuest * newGuestCount;
    } else if (item.categoryId === 'catering') {
      // Catering naturally scales with guest ratio
      cost = Math.round(item.estimatedCost * guestRatio);
    } else if (item.categoryId === 'venue' && scenario.type === 'venue_change') {
      // Venue change might reduce or increase cost
      cost = Math.round(item.estimatedCost * 0.85); // e.g. alternate venue
    }

    return {
      ...item,
      estimatedCost: cost,
    };
  });

  // Check if scenario cancelled a vendor
  let cancelledVendor = event.vendors.find((v) => v.id === scenario.cancelledVendorId);
  if (!cancelledVendor && scenario.type === 'vendor_cancel') {
    // Default to first active catering or decoration vendor if not specified
    cancelledVendor = event.vendors.find((v) => v.category === 'catering') || event.vendors[0];
  }

  // 4. Recalculate Timeline & DAG Tasks
  const newDeadlineDays = Math.max(5, event.eventDeadlineDays + (scenario.eventDeadlineDaysDelta || 0));

  let simulatedTasks: Task[] = event.tasks.map((t) => ({ ...t }));

  // If vendor cancelled, mark tasks assigned to that vendor as blocked, add replacement delay
  if (cancelledVendor) {
    simulatedTasks = simulatedTasks.map((t) => {
      if (t.assignedVendorId === cancelledVendor?.id || t.category === cancelledVendor?.category) {
        return {
          ...t,
          status: 'blocked',
          delayDays: t.delayDays + 4, // 4 days delay to procure replacement vendor
          notes: `Vendor ${cancelledVendor?.name} cancelled. Emergency RFP & onboarding delay added.`,
        };
      }
      return t;
    });
  }

  // If guest count spiked significantly (>20%), RSVP and catering confirmation take 2 additional days
  if (scenario.guestDelta >= 30) {
    simulatedTasks = simulatedTasks.map((t) => {
      if (t.id.includes('cater') || t.id.includes('rsvp') || t.id.includes('guest')) {
        return {
          ...t,
          durationDays: t.durationDays + 1,
        };
      }
      return t;
    });
  }

  // Calculate new schedule with updated tasks and new deadline
  const afterSchedule = calculateSchedule(simulatedTasks, newDeadlineDays);
  const afterEstimated = calculateTotalEstimated(simulatedItems);
  const afterRemaining = newTotalBudget - afterEstimated;
  const overspend = Math.max(0, afterEstimated - newTotalBudget);

  // 5. Check Venue Capacity constraint
  const venueVendor = event.vendors.find((v) => v.category === 'venue');
  const venueCapacity = scenario.newVenueCapacity || venueVendor?.capacity || 220;
  const hasCapacityDeficit = newGuestCount > venueCapacity;
  const capacityShortfall = hasCapacityDeficit ? newGuestCount - venueCapacity : 0;

  // 6. Compute Category Diffs
  const affectedCategories: SimulationResult['budgetDiff']['affectedCategories'] = [];
  const categoryNames: BudgetCategory[] = [
    'venue',
    'catering',
    'decoration',
    'photography',
    'entertainment',
    'transportation',
    'miscellaneous',
  ];

  categoryNames.forEach((cat) => {
    const oldSum = event.items
      .filter((i) => i.categoryId === cat)
      .reduce((s, i) => s + i.estimatedCost, 0);
    const newSum = simulatedItems
      .filter((i) => i.categoryId === cat)
      .reduce((s, i) => s + i.estimatedCost, 0);

    if (Math.abs(newSum - oldSum) > 0) {
      let reason = 'Headcount adjustment';
      if (cat === 'catering') reason = `Catering scaled for ${newGuestCount} guests (was ${event.guestCount})`;
      if (cat === 'venue' && scenario.type === 'venue_change') reason = 'Venue re-negotiation & changeover';
      if (scenario.type === 'budget_cut') reason = 'Proportional budget contraction';

      affectedCategories.push({
        category: cat,
        oldAmount: oldSum,
        newAmount: newSum,
        delta: newSum - oldSum,
        reason,
      });
    }
  });

  // 7. Calculate Composite Feasibility Score (0 to 100)
  let feasibilityScore = 100;

  // Deduct for budget overspend
  if (overspend > 0) {
    const overspendRatio = overspend / newTotalBudget;
    feasibilityScore -= Math.min(50, Math.round(overspendRatio * 100));
  }

  // Deduct for timeline breaches
  if (afterSchedule.isDeadlineBreached) {
    feasibilityScore -= Math.min(40, afterSchedule.daysOverdue * 12);
  }

  // Deduct for capacity shortfall
  if (hasCapacityDeficit) {
    feasibilityScore -= Math.min(25, capacityShortfall * 0.8);
  }

  // Deduct for unreplaced cancelled vendor
  if (cancelledVendor) {
    feasibilityScore -= 15;
  }

  feasibilityScore = Math.max(10, Math.min(100, Math.round(feasibilityScore)));

  let feasibilityStatus: SimulationResult['feasibilityStatus'] = 'feasible';
  if (feasibilityScore < 50 || afterSchedule.daysOverdue > 2 || overspend > newTotalBudget * 0.2) {
    feasibilityStatus = 'critical_overrun';
  } else if (feasibilityScore < 80 || overspend > 0 || afterSchedule.isDeadlineBreached) {
    feasibilityStatus = 'at_risk';
  }

  // 8. Newly Critical Tasks
  const oldCriticalSet = new Set(beforeSchedule.criticalPathTaskIds);
  const newlyCriticalTaskIds = afterSchedule.criticalPathTaskIds.filter((id) => !oldCriticalSet.has(id));

  // 9. Structured Impact Summary
  const impactSummary: string[] = [];
  if (scenario.guestDelta !== 0) {
    impactSummary.push(
      `Guest count shifted by ${scenario.guestDelta > 0 ? '+' : ''}${scenario.guestDelta} to ${newGuestCount} guests.`
    );
  }
  if (overspend > 0) {
    impactSummary.push(
      `Budget deficit of ${event.currency}${overspend.toLocaleString()} detected against revised ${event.currency}${newTotalBudget.toLocaleString()} ceiling.`
    );
  }
  if (afterSchedule.isDeadlineBreached) {
    impactSummary.push(
      `CRITICAL: Schedule overrun by ${afterSchedule.daysOverdue} day(s) beyond Event Day (Day ${newDeadlineDays}).`
    );
  }
  if (hasCapacityDeficit) {
    impactSummary.push(
      `CAPACITY ALERT: Headcount of ${newGuestCount} exceeds venue limit of ${venueCapacity} by ${capacityShortfall} guests.`
    );
  }
  if (cancelledVendor) {
    impactSummary.push(
      `VENDOR RISK: ${cancelledVendor.name} cancelled. Direct tasks blocked and 4-day replacement buffer consumed.`
    );
  }
  if (newlyCriticalTaskIds.length > 0) {
    impactSummary.push(
      `${newlyCriticalTaskIds.length} task(s) newly entered the zero-slack Critical Path.`
    );
  }

  // 10. Concrete Recovery Plan
  const recoveryPlan: RecoveryStep[] = [];
  let step = 1;

  if (overspend > 0) {
    recoveryPlan.push({
      stepNumber: step++,
      title: 'Run Algorithmic Budget Optimizer',
      description: `Execute priority-aware cut on Decoration & Photography to re-absorb the ${event.currency}${overspend.toLocaleString()} deficit without touching core food or venue quality.`,
      actionType: 'budget',
      impactMetric: `Saves ${event.currency}${overspend.toLocaleString()}`,
    });
  }

  if (afterSchedule.isDeadlineBreached) {
    recoveryPlan.push({
      stepNumber: step++,
      title: 'Crash Setup & Fast-Track Critical Path',
      description: `Hire additional setup crew for Stage & Audio to compress task duration by ${afterSchedule.daysOverdue} days and realign with Event Day.`,
      actionType: 'timeline',
      impactMetric: `Recovers ${afterSchedule.daysOverdue} days`,
    });
  }

  if (hasCapacityDeficit) {
    recoveryPlan.push({
      stepNumber: step++,
      title: 'Expand Venue Perimeter or Reserve Overflow Lawn',
      description: `Authorize outdoor garden annex to comfortably accommodate the extra ${capacityShortfall} attendees without room crowding.`,
      actionType: 'vendor',
      impactMetric: `Adds +${capacityShortfall} capacity`,
    });
  }

  if (cancelledVendor) {
    const backup = event.vendors.find(
      (v) => cancelledVendor?.alternativeVendorIds.includes(v.id)
    );
    recoveryPlan.push({
      stepNumber: step++,
      title: `Activate Backup Vendor (${backup?.name || 'Pre-vetted Partner'})`,
      description: `Immediately trigger fast-track SLA with shortlisted backup vendor to bypass the 4-day RFP delay.`,
      actionType: 'vendor',
      impactMetric: `Recovers 3 delay days`,
    });
  }

  if (recoveryPlan.length === 0) {
    recoveryPlan.push({
      stepNumber: 1,
      title: 'Maintain Current Execution Baseline',
      description: 'The simulated change is within all financial and critical path tolerances. No corrective intervention required.',
      actionType: 'timeline',
      impactMetric: '100% On-Track',
    });
  }

  return {
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    scenarioDescription: scenario.description,
    timestamp: new Date().toLocaleTimeString(),
    feasibilityScore,
    feasibilityStatus,
    before: {
      guestCount: event.guestCount,
      totalBudget: event.totalBudget,
      totalEstimated: beforeEstimated,
      budgetRemaining: beforeRemaining,
      eventDeadlineDays: event.eventDeadlineDays,
      projectDurationDays: beforeSchedule.projectDurationDays,
      criticalPathCount: beforeSchedule.criticalPathTaskIds.length,
    },
    after: {
      guestCount: newGuestCount,
      totalBudget: newTotalBudget,
      totalEstimated: afterEstimated,
      budgetRemaining: afterRemaining,
      eventDeadlineDays: newDeadlineDays,
      projectDurationDays: afterSchedule.projectDurationDays,
      criticalPathCount: afterSchedule.criticalPathTaskIds.length,
    },
    budgetDiff: {
      budgetDelta: newTotalBudget - event.totalBudget,
      estimatedCostDelta: afterEstimated - beforeEstimated,
      overspend,
      affectedCategories,
    },
    timelineDiff: {
      deadlineBreached: afterSchedule.isDeadlineBreached,
      daysOverdue: afterSchedule.daysOverdue,
      oldCriticalPath: beforeSchedule.criticalPathTaskIds,
      newCriticalPath: afterSchedule.criticalPathTaskIds,
      newlyCriticalTaskIds,
      conflicts: afterSchedule.tasks.filter((t) => t.hasConflict).map((t) => `${t.name}: ${t.conflictReason}`),
    },
    capacityIssues: {
      hasCapacityDeficit,
      venueCapacity,
      newGuestCount,
      shortfall: capacityShortfall,
    },
    impactSummary,
    recoveryPlan,
  };
}

/**
 * Applies a simulation result directly to the live event plan
 */
export function commitSimulationToEvent(event: EventPlan, scenario: SimulationScenario): EventPlan {
  const result = simulateScenario(event, scenario);

  const newGuestCount = Math.max(10, event.guestCount + (scenario.guestDelta || 0));
  const guestRatio = newGuestCount / event.guestCount;

  let newTotalBudget = event.totalBudget;
  if (scenario.budgetPercentDelta) {
    newTotalBudget = Math.round(event.totalBudget * (1 + scenario.budgetPercentDelta / 100));
  }
  if (scenario.budgetAbsoluteDelta) {
    newTotalBudget = Math.max(10000, newTotalBudget + scenario.budgetAbsoluteDelta);
  }

  const updatedItems = event.items.map((item) => {
    let cost = item.estimatedCost;
    if (item.costPerGuest && item.costPerGuest > 0) {
      cost = (item.fixedCost || 0) + item.costPerGuest * newGuestCount;
    } else if (item.categoryId === 'catering') {
      cost = Math.round(item.estimatedCost * guestRatio);
    }
    return { ...item, estimatedCost: cost };
  });

  const newDeadlineDays = Math.max(5, event.eventDeadlineDays + (scenario.eventDeadlineDaysDelta || 0));

  let updatedTasks = event.tasks.map((t) => ({ ...t }));
  if (scenario.cancelledVendorId) {
    updatedTasks = updatedTasks.map((t) => {
      if (t.assignedVendorId === scenario.cancelledVendorId) {
        return { ...t, status: 'blocked', delayDays: t.delayDays + 3 };
      }
      return t;
    });
  }

  const schedule = calculateSchedule(updatedTasks, newDeadlineDays);

  return {
    ...event,
    guestCount: newGuestCount,
    totalBudget: newTotalBudget,
    eventDeadlineDays: newDeadlineDays,
    items: updatedItems,
    tasks: schedule.tasks,
    simulationHistory: [result, ...event.simulationHistory].slice(0, 10),
  };
}
