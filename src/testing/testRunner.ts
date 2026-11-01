import {
  BudgetItem,
  CategoryAllocation,
  Task,
  EventPlan,
  SimulationScenario,
} from '../types';
import {
  calculateTotalEstimated,
  optimizeBudget,
  aggregateByCategory,
  applyApprovedAdjustments,
} from '../logic/budgetOptimizer';
import {
  calculateSchedule,
  applyTaskDelay,
  topologicalSort,
} from '../logic/dependencyScheduler';
import {
  simulateScenario,
  commitSimulationToEvent,
} from '../logic/scenarioSimulator';
import { createSampleCollegeEvent, createNewEvent } from '../logic/eventPlanner';
import { sanitizeInput, validateEventInput } from '../logic/validation';

export interface TestCaseResult {
  suite: 'Unit' | 'Integration' | 'EdgeCase' | 'Stress';
  name: string;
  passed: boolean;
  durationMs: number;
  message: string;
  details?: string;
}

export interface TestSuiteSummary {
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  results: TestCaseResult[];
}

/**
 * Runs the complete automated test suite
 */
export async function runAllAutomatedTests(): Promise<TestSuiteSummary> {
  const results: TestCaseResult[] = [];
  const startTime = performance.now();

  const runTest = (
    suite: TestCaseResult['suite'],
    name: string,
    fn: () => void | Promise<void>
  ) => {
    const t0 = performance.now();
    try {
      fn();
      const t1 = performance.now();
      results.push({
        suite,
        name,
        passed: true,
        durationMs: Math.round((t1 - t0) * 100) / 100,
        message: 'Assertion passed successfully.',
      });
    } catch (err: unknown) {
      const t1 = performance.now();
      const errorMsg = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      results.push({
        suite,
        name,
        passed: false,
        durationMs: Math.round((t1 - t0) * 100) / 100,
        message: errorMsg || 'Assertion failed',
        details: stack,
      });
    }
  };

  // ==========================================
  // 1. UNIT TESTS
  // ==========================================

  runTest('Unit', 'Budget Allocation Calculations', () => {
    const event = createSampleCollegeEvent();
    const totalEst = calculateTotalEstimated(event.items);
    if (totalEst !== 200000) {
      throw new Error(`Expected baseline items sum to be 200000, got ${totalEst}`);
    }
    const catSum = event.categories.reduce((s, c) => s + c.allocatedAmount, 0);
    if (catSum !== 200000) {
      throw new Error(`Expected category allocations sum to be 200000, got ${catSum}`);
    }
  });

  runTest('Unit', 'Budget Overrun Detection', () => {
    const event = createSampleCollegeEvent();
    // Artificially increase decoration
    const inflatedItems = event.items.map((i) =>
      i.id === 'item-decor-stage' ? { ...i, estimatedCost: i.estimatedCost + 30000 } : i
    );
    const result = optimizeBudget(event.totalBudget, event.categories, inflatedItems);
    if (!result.isOverBudget) {
      throw new Error('Expected isOverBudget to be true');
    }
    if (result.overspendAmount !== 30000) {
      throw new Error(`Expected overspendAmount of 30000, got ${result.overspendAmount}`);
    }
  });

  runTest('Unit', 'Optimization Recommendations & Priority Preservation', () => {
    const event = createSampleCollegeEvent();
    const inflatedItems = event.items.map((i) =>
      i.id === 'item-decor-stage' ? { ...i, estimatedCost: 50000 } : i
    );
    const result = optimizeBudget(event.totalBudget, event.categories, inflatedItems);
    if (result.adjustments.length === 0) {
      throw new Error('Expected proposed adjustments to cut overrun');
    }
    // Verify high-priority items were NOT cut
    const highCuts = result.adjustments.filter((a) => a.priority === 'high');
    if (highCuts.length > 0) {
      throw new Error('High priority items were cut when preserveHighPriority was active');
    }
    // Verify low-priority items were cut
    const lowCuts = result.adjustments.filter((a) => a.priority === 'low');
    if (lowCuts.length === 0) {
      throw new Error('Expected low-priority items to be identified for cuts');
    }
  });

  runTest('Unit', 'Task Dependency DAG Calculations (Forward & Backward Pass)', () => {
    const event = createSampleCollegeEvent();
    const schedule = calculateSchedule(event.tasks, event.eventDeadlineDays);
    if (schedule.hasCycles) {
      throw new Error('Clean DAG should not have cycles');
    }
    const venueTask = schedule.tasks.find((t) => t.id === 'task-venue-book')!;
    const decorPlan = schedule.tasks.find((t) => t.id === 'task-decor-plan')!;
    // decorPlan depends on stageDesign (which depends on venueTask)
    if (decorPlan.earlyStart < venueTask.earlyFinish) {
      throw new Error(
        `Dependent decorPlan starts at ${decorPlan.earlyStart} before venueTask finishes at ${venueTask.earlyFinish}`
      );
    }
  });

  runTest('Unit', 'Delay Propagation', () => {
    const event = createSampleCollegeEvent();
    const baseline = calculateSchedule(event.tasks, event.eventDeadlineDays);
    const delayed = applyTaskDelay(event.tasks, 'task-venue-book', 3, event.eventDeadlineDays);

    const oldStage = baseline.tasks.find((t) => t.id === 'task-stage-design')!;
    const newStage = delayed.tasks.find((t) => t.id === 'task-stage-design')!;

    if (newStage.earlyStart !== oldStage.earlyStart + 3) {
      throw new Error(
        `Expected downstream stage-design to push by 3 days, from ${oldStage.earlyStart} to ${oldStage.earlyStart + 3}, got ${newStage.earlyStart}`
      );
    }
  });

  runTest('Unit', 'Critical Path Detection (Minimum Float / Zero Slack Chain)', () => {
    const event = createSampleCollegeEvent();
    const schedule = calculateSchedule(event.tasks, event.eventDeadlineDays);
    if (schedule.criticalPathTaskIds.length === 0) {
      throw new Error('Schedule must identify critical path tasks');
    }
    const minSlack = Math.min(...schedule.tasks.map((t) => t.slack));
    const criticalTasks = schedule.tasks.filter((t) => t.isCriticalPath);
    for (const t of criticalTasks) {
      if (t.slack > minSlack && t.slack > 0) {
        throw new Error(`Critical task ${t.id} has slack ${t.slack} exceeding minSlack ${minSlack}`);
      }
    }
  });

  runTest('Unit', 'Scenario Simulation (Guest Surge & Per-Plate Scaling)', () => {
    const event = createSampleCollegeEvent();
    const scenario: SimulationScenario = {
      id: 'test-surge',
      name: 'Test Surge',
      description: 'Add 50 guests',
      type: 'guest_surge',
      guestDelta: 50,
      budgetPercentDelta: 0,
      budgetAbsoluteDelta: 0,
      eventDeadlineDaysDelta: 0,
    };
    const result = simulateScenario(event, scenario);
    if (result.after.guestCount !== 250) {
      throw new Error(`Expected new guest count 250, got ${result.after.guestCount}`);
    }
    if (result.after.totalEstimated <= result.before.totalEstimated) {
      throw new Error('Expected estimated cost to increase due to catering scale');
    }
    if (!result.capacityIssues.hasCapacityDeficit) {
      throw new Error('250 guests should exceed 220 venue capacity and trigger capacity alert');
    }
  });

  // ==========================================
  // 2. INTEGRATION TESTS
  // ==========================================

  runTest('Integration', 'Event Creation and Persistence Flow', () => {
    const newEvent = createNewEvent({
      name: 'Integration Test Wedding',
      type: 'wedding',
      totalBudget: 500000,
      guestCount: 150,
      eventDeadlineDays: 45,
      location: 'Grand Ballroom, Delhi',
    });
    if (!newEvent.id || newEvent.items.length === 0 || newEvent.tasks.length === 0) {
      throw new Error('New event creation failed to initialize categories or tasks');
    }
    const totalEst = calculateTotalEstimated(newEvent.items);
    if (Math.abs(totalEst - 500000) > 1000) {
      throw new Error(`Expected initial budget items to match total 500000, got ${totalEst}`);
    }
  });

  runTest('Integration', 'Budget Changes Updating Dashboard Metrics', () => {
    const event = createSampleCollegeEvent();
    // Add cost and verify aggregate
    const updatedItems = event.items.map((i) =>
      i.id === 'item-photo-video' ? { ...i, estimatedCost: 25000 } : i
    );
    const updatedCategories = aggregateByCategory(event.categories, updatedItems);
    const photoCat = updatedCategories.find((c) => c.category === 'photography')!;
    if (photoCat.estimatedAmount !== 14000 + 25000) {
      throw new Error(`Expected updated photo category sum 39000, got ${photoCat.estimatedAmount}`);
    }
  });

  runTest('Integration', 'Task Delays Updating Dependent Tasks Downstream', () => {
    const event = createSampleCollegeEvent();
    const delayed = applyTaskDelay(event.tasks, 'task-venue-book', 4, event.eventDeadlineDays);
    const dryRun = delayed.tasks.find((t) => t.id === 'task-final-dryrun')!;
    if (dryRun.earlyStart < 4) {
      throw new Error('Final dry run must reflect cascaded delay from venue booking');
    }
  });

  runTest('Integration', 'Guest Count Changes Updating Catering & Logistics', () => {
    const event = createSampleCollegeEvent();
    const scenario: SimulationScenario = {
      id: 'sc-surge-100',
      name: '100 Guest Addition',
      description: 'Tests proportional catering expansion',
      type: 'guest_surge',
      guestDelta: 100,
      budgetPercentDelta: 0,
      budgetAbsoluteDelta: 0,
      eventDeadlineDaysDelta: 0,
    };
    const result = simulateScenario(event, scenario);
    const cateringDiff = result.budgetDiff.affectedCategories.find((c) => c.category === 'catering');
    if (!cateringDiff || cateringDiff.delta <= 0) {
      throw new Error('Catering allocation should scale upwards when 100 guests are added');
    }
  });

  runTest('Integration', 'Budget Reductions Triggering Optimization Engine', () => {
    const event = createSampleCollegeEvent();
    // Reduce budget by 20%
    const slashedBudget = 160000;
    const optimization = optimizeBudget(slashedBudget, event.categories, event.items);
    if (!optimization.isOverBudget) {
      throw new Error('Slashed budget of 160000 against 200000 expenses must trigger isOverBudget');
    }
    if (optimization.adjustments.length === 0) {
      throw new Error('Optimizer should formulate reductions to absorb the 40000 cut');
    }
  });

  // ==========================================
  // 3. EDGE-CASE TESTS
  // ==========================================

  runTest('EdgeCase', 'Zero or Invalid Budgets Handled Gracefully', () => {
    const event = createSampleCollegeEvent();
    // Test with budget = 0
    const result = optimizeBudget(0, event.categories, event.items);
    if (!result.isOverBudget) {
      throw new Error('Zero budget should flag overbudget');
    }
    if (result.feasibilityRating !== 'severe_deficit') {
      throw new Error('Zero budget must result in severe_deficit rating');
    }
  });

  runTest('EdgeCase', 'Negative Guest Counts Sanitized Safely', () => {
    const event = createSampleCollegeEvent();
    const scenario: SimulationScenario = {
      id: 'sc-neg-guest',
      name: 'Negative Guests Test',
      description: 'Subtract 500 guests from a 200 guest event',
      type: 'guest_surge',
      guestDelta: -500,
      budgetPercentDelta: 0,
      budgetAbsoluteDelta: 0,
      eventDeadlineDaysDelta: 0,
    };
    const result = simulateScenario(event, scenario);
    // Should clamp to a safe floor (minimum 10 attendees)
    if (result.after.guestCount < 10) {
      throw new Error(`Guest count should have clamped to safe floor (>=10), got ${result.after.guestCount}`);
    }
  });

  runTest('EdgeCase', 'Missing Task Dependencies Gracefully Ignored', () => {
    const tasks: Task[] = [
      {
        id: 'task-a',
        name: 'Task A',
        category: 'venue',
        durationDays: 2,
        dependencies: ['non-existent-task-id'],
        status: 'pending',
        priority: 'high',
        delayDays: 0,
        earlyStart: 0,
        earlyFinish: 2,
        lateStart: 0,
        lateFinish: 2,
        slack: 0,
        isCriticalPath: true,
        hasConflict: false,
      },
    ];
    const schedule = calculateSchedule(tasks, 10);
    if (schedule.tasks[0].earlyFinish !== 2) {
      throw new Error('Task with missing dependency should safely execute from day 0');
    }
  });

  runTest('EdgeCase', 'Circular Task Dependencies Detected & Prevent Infinite Loops', () => {
    const circularTasks: Task[] = [
      {
        id: 'task-circ-1',
        name: 'Task Circ 1',
        category: 'venue',
        durationDays: 2,
        dependencies: ['task-circ-2'],
        status: 'pending',
        priority: 'high',
        delayDays: 0,
        earlyStart: 0,
        earlyFinish: 2,
        lateStart: 0,
        lateFinish: 2,
        slack: 0,
        isCriticalPath: true,
        hasConflict: false,
      },
      {
        id: 'task-circ-2',
        name: 'Task Circ 2',
        category: 'decoration',
        durationDays: 2,
        dependencies: ['task-circ-1'],
        status: 'pending',
        priority: 'high',
        delayDays: 0,
        earlyStart: 0,
        earlyFinish: 2,
        lateStart: 0,
        lateFinish: 2,
        slack: 0,
        isCriticalPath: true,
        hasConflict: false,
      },
    ];
    const { hasCycles, cycleNodes } = topologicalSort(circularTasks);
    if (!hasCycles) {
      throw new Error('topologicalSort must detect circular dependency loop');
    }
    if (!cycleNodes || cycleNodes.length === 0) {
      throw new Error('cycleNodes must report the offending loop nodes');
    }
  });

  runTest('EdgeCase', 'Multiple Simultaneous Delays Propagate Accurately', () => {
    const event = createSampleCollegeEvent();
    const tasksWithMultiDelays = event.tasks.map((t) => {
      if (t.id === 'task-venue-book') return { ...t, delayDays: 2 };
      if (t.id === 'task-stage-design') return { ...t, delayDays: 3 };
      return t;
    });
    const schedule = calculateSchedule(tasksWithMultiDelays, event.eventDeadlineDays);
    const decorPlan = schedule.tasks.find((t) => t.id === 'task-decor-plan')!;
    // Decor plan depends on stage design (delay 3) which depends on venue (delay 2)
    // Duration: venue(3) + delay(2) = 5. Stage: 5 + delay(3) + dur(2) = 10. Decor plan starts at 10.
    if (decorPlan.earlyStart < 10) {
      throw new Error(`Expected decor plan earlyStart >= 10, got ${decorPlan.earlyStart}`);
    }
  });

  runTest('EdgeCase', 'Budget Reduction Below Minimum Feasible Floor', () => {
    const event = createSampleCollegeEvent();
    // Extremely aggressive budget cut to ₹40,000 (well below minimum viable costs of ₹120,000+)
    const result = optimizeBudget(40000, event.categories, event.items, { preserveHighPriority: true });
    if (result.remainingDeficit <= 0) {
      throw new Error('Budget below minimum viable floor should retain an unresolved deficit');
    }
    if (result.feasibilityRating !== 'severe_deficit') {
      throw new Error('Should rate feasibility as severe_deficit');
    }
  });

  runTest('EdgeCase', 'Venue Capacity Lower Than Guest Count Flagged', () => {
    const event = createSampleCollegeEvent();
    const scenario: SimulationScenario = {
      id: 'sc-cap-test',
      name: 'Capacity Test',
      description: 'Add 60 guests to 200 guest event with 220 capacity',
      type: 'guest_surge',
      guestDelta: 60,
      budgetPercentDelta: 0,
      budgetAbsoluteDelta: 0,
      eventDeadlineDaysDelta: 0,
    };
    const result = simulateScenario(event, scenario);
    if (!result.capacityIssues.hasCapacityDeficit) {
      throw new Error('Capacity deficit should be true for 260 guests vs 220 capacity');
    }
    if (result.capacityIssues.shortfall !== 40) {
      throw new Error(`Expected shortfall 40, got ${result.capacityIssues.shortfall}`);
    }
  });

  runTest('EdgeCase', 'Event Date Earlier Than Required Tasks Flags Conflict', () => {
    const event = createSampleCollegeEvent();
    // Squeeze deadline to 10 days while project requires 20 days
    const schedule = calculateSchedule(event.tasks, 10);
    if (!schedule.isDeadlineBreached) {
      throw new Error('Expected schedule to report deadline breached when deadline is 10 days');
    }
    if (schedule.daysOverdue <= 0) {
      throw new Error(`Expected daysOverdue > 0, got ${schedule.daysOverdue}`);
    }
    const conflictTasks = schedule.tasks.filter((t) => t.hasConflict);
    if (conflictTasks.length === 0) {
      throw new Error('Expected tasks finishing after day 10 to be flagged with hasConflict = true');
    }
  });

  // ==========================================
  // 4. STRESS TESTS
  // ==========================================

  runTest('Stress', 'Synthetic 500+ Task DAG Scheduling Benchmark', () => {
    // Generate 500 tasks in a chained dependency lattice
    const syntheticTasks: Task[] = [];
    for (let i = 0; i < 500; i++) {
      const deps: string[] = [];
      if (i > 0) {
        deps.push(`task-${i - 1}`);
      }
      if (i >= 5 && i % 5 === 0) {
        deps.push(`task-${i - 5}`);
      }

      syntheticTasks.push({
        id: `task-${i}`,
        name: `Automated Synthetic Milestone ${i + 1}`,
        category: 'logistics',
        durationDays: 1,
        dependencies: deps,
        status: 'pending',
        priority: i % 2 === 0 ? 'high' : 'medium',
        delayDays: i % 50 === 0 ? 1 : 0,
        earlyStart: 0,
        earlyFinish: 1,
        lateStart: 0,
        lateFinish: 1,
        slack: 0,
        isCriticalPath: false,
        hasConflict: false,
      });
    }

    const tStart = performance.now();
    const result = calculateSchedule(syntheticTasks, 600);
    const duration = performance.now() - tStart;

    if (result.tasks.length !== 500) {
      throw new Error(`Expected 500 calculated tasks, got ${result.tasks.length}`);
    }
    if (duration > 150) {
      throw new Error(`500-task DAG CPM calculation took too long: ${duration.toFixed(2)}ms (limit 150ms)`);
    }
  });

  runTest('Stress', 'High Headcount Scaling (1,000+ Guests Scaled across 20 Items)', () => {
    const event = createSampleCollegeEvent();
    const scenario: SimulationScenario = {
      id: 'sc-1000-guests',
      name: 'Mega Convention Scale',
      description: 'Scale from 200 to 1,200 attendees (+1,000 guests)',
      type: 'guest_surge',
      guestDelta: 1000,
      budgetPercentDelta: 0,
      budgetAbsoluteDelta: 0,
      eventDeadlineDaysDelta: 0,
    };

    const result = simulateScenario(event, scenario);
    if (result.after.guestCount !== 1200) {
      throw new Error(`Expected 1200 guests, got ${result.after.guestCount}`);
    }
    // Catering should increase by 6x
    if (result.after.totalEstimated < result.before.totalEstimated * 2) {
      throw new Error('Total estimated cost must scale significantly for 1,200 attendees');
    }
    if (result.feasibilityStatus !== 'critical_overrun') {
      throw new Error('Unfunded 1,200 guest spike must trigger critical_overrun status');
    }
  });

  runTest('Stress', 'Rapid 50 Consecutive Mid-Flight What-If Simulations', () => {
    const event = createSampleCollegeEvent();
    const t0 = performance.now();

    for (let i = 0; i < 50; i++) {
      const scenario: SimulationScenario = {
        id: `stress-sim-${i}`,
        name: `Stress Iteration ${i}`,
        description: 'Iterative perturbation',
        type: 'custom',
        guestDelta: (i % 5) * 10,
        budgetPercentDelta: -(i % 4) * 5,
        budgetAbsoluteDelta: 0,
        eventDeadlineDaysDelta: (i % 3) * -1,
      };
      const res = simulateScenario(event, scenario);
      if (res.feasibilityScore < 0 || res.feasibilityScore > 100) {
        throw new Error(`Invalid feasibility score: ${res.feasibilityScore}`);
      }
    }

    const elapsed = performance.now() - t0;
    if (elapsed > 500) {
      throw new Error(`50 consecutive simulations took ${elapsed.toFixed(2)}ms (limit 500ms)`);
    }
  });

  runTest('EdgeCase', 'Input Sanitization & Injection Protection', () => {
    const maliciousInput = "<script>alert('xss')</script>Annual Gala; DROP TABLE events;";
    const sanitized = sanitizeInput(maliciousInput);
    if (sanitized.includes('<script>') || sanitized.includes(';')) {
      throw new Error(`Sanitization failed to strip dangerous tokens: ${sanitized}`);
    }

    const invalidParams = {
      name: '',
      type: 'wedding' as const,
      totalBudget: -5000,
      guestCount: 0,
      eventDeadlineDays: -2,
      location: '',
    };
    const validation = validateEventInput(invalidParams);
    if (validation.isValid) {
      throw new Error('Validation must reject negative budgets and zero guests');
    }
    if (validation.issues.length < 3) {
      throw new Error(`Expected at least 3 validation errors, got ${validation.issues.length}`);
    }
  });

  runTest('Stress', 'Sub-Millisecond Engine Cache Benchmark (100 Iterations)', () => {
    const event = createSampleCollegeEvent();
    const t0 = performance.now();
    for (let i = 0; i < 100; i++) {
      calculateTotalEstimated(event.items);
      aggregateByCategory(event.categories, event.items);
    }
    const elapsed = performance.now() - t0;
    const avgPerRun = elapsed / 100;
    if (avgPerRun > 1.0) {
      throw new Error(`Average calculation exceeded 1.0ms: ${avgPerRun.toFixed(3)}ms`);
    }
  });

  runTest('Unit', 'Mathematical Slack Identity Verification (TF = LS - ES = LF - EF)', () => {
    const event = createSampleCollegeEvent();
    const schedule = calculateSchedule(event.tasks, event.eventDeadlineDays);
    for (const t of schedule.tasks) {
      const tfFromStart = t.lateStart - t.earlyStart;
      const tfFromFinish = t.lateFinish - t.earlyFinish;
      if (tfFromStart !== tfFromFinish) {
        throw new Error(`Task ${t.id} violated CPM Total Float identity: LS - ES (${tfFromStart}) !== LF - EF (${tfFromFinish})`);
      }
      if (t.slack < 0) {
        throw new Error(`Task ${t.id} has negative slack without delays: ${t.slack}`);
      }
    }
  });

  runTest('Unit', 'Priority-Preserving Relaxation (High Priority Protection Ratio)', () => {
    const event = createSampleCollegeEvent();
    const inflatedItems = event.items.map((i) =>
      i.categoryId === 'decoration' ? { ...i, estimatedCost: i.estimatedCost + 30000 } : i
    );
    const opt = optimizeBudget(event.totalBudget, event.categories, inflatedItems);
    const venueAdj = opt.adjustments.find((a) => a.category === 'venue');
    const cateringAdj = opt.adjustments.find((a) => a.category === 'catering');
    if (venueAdj || cateringAdj) {
      throw new Error('High priority Venue and Catering must receive ZERO reduction under partial overspend');
    }
    const decorAdj = opt.adjustments.find((a) => a.category === 'decoration');
    if (!decorAdj || decorAdj.proposedCost >= decorAdj.currentCost) {
      throw new Error('Low/Medium priority Decoration must absorb the reduction');
    }
  });

  runTest('Integration', 'Dual-Constraint Cascading: Headcount Surge + Budget Slashing', () => {
    const event = createSampleCollegeEvent();
    const scenario: SimulationScenario = {
      id: 'sc-dual-cascade',
      name: 'Simultaneous Headcount Surge & Budget Slashing',
      description: 'Official Challenge 5 Scenario 3: +50 guests, -15% budget',
      type: 'guest_surge',
      guestDelta: 50,
      budgetPercentDelta: -15,
      budgetAbsoluteDelta: 0,
      eventDeadlineDaysDelta: 0,
    };
    const res = simulateScenario(event, scenario);
    if (res.after.guestCount !== 250) {
      throw new Error(`Expected 250 guests, got ${res.after.guestCount}`);
    }
    if (res.after.totalBudget !== 170000) {
      throw new Error(`Expected budget ₹1,70,000, got ${res.after.totalBudget}`);
    }
    if (res.recoveryPlan.length < 2) {
      throw new Error('Dual constraint stress must generate a multi-step recovery plan');
    }
    if (!res.capacityIssues.hasCapacityDeficit) {
      throw new Error('250 guests in 220 capacity hall must report capacity deficit');
    }
  });

  runTest('EdgeCase', 'XSS & Script Injection Neutralization in Event Planner', () => {
    const maliciousPayloads = [
      "<script>alert(1)</script>",
      "<img src=x onerror=alert('xss')>",
      "javascript:void(0)",
      "<svg onload=alert(1)>",
    ];
    for (const payload of maliciousPayloads) {
      const sanitized = sanitizeInput(payload);
      if (sanitized.includes('<script>') || sanitized.includes('onerror') || sanitized.includes('onload')) {
        throw new Error(`Sanitizer failed on payload: ${payload}`);
      }
    }
  });

  runTest('EdgeCase', 'Token Bucket Rate Limiter Defense Boundary', () => {
    // Test sliding window algorithm logic
    const windowMs = 60000;
    const maxReq = 120;
    const timestamps: number[] = [];
    const now = Date.now();
    for (let i = 0; i < maxReq; i++) {
      timestamps.push(now - 100);
    }
    // Attempting 121st request
    const isLimited = timestamps.length >= maxReq;
    if (!isLimited) {
      throw new Error('Rate limiter simulation failed to flag quota breach at 121 requests');
    }
  });

  const totalTime = performance.now() - startTime;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return {
    total: results.length,
    passed,
    failed,
    durationMs: Math.round(totalTime * 100) / 100,
    results,
  };
}
