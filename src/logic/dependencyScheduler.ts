/**
 * @file dependencyScheduler.ts
 * @description Directed Acyclic Graph (DAG) scheduling engine implementing the Critical Path Method (CPM).
 *
 * Mathematical Foundations:
 * 1. Topological Sort via Kahn's Algorithm:
 *    Maintains an in-degree map for all vertices V. Vertices with in_degree(v) = 0 are enqueued.
 *    Time Complexity: O(V + E), Space Complexity: O(V + E).
 *    If processed vertices count !== |V|, a cycle (directed loop) exists.
 *
 * 2. Forward Pass (Earliest Time Computation):
 *    - For root vertices (no predecessors):
 *        ES_v = 0 + delay_v
 *        EF_v = ES_v + duration_v
 *    - For dependent vertices:
 *        ES_v = max_{u in Pred(v)} (EF_u) + delay_v
 *        EF_v = ES_v + duration_v
 *    - Total Project Duration: T_proj = max_{v in V} (EF_v)
 *
 * 3. Backward Pass (Latest Time & Float Computation):
 *    - Terminal deadline: T_target = max(eventDeadlineDays, T_proj)
 *    - For terminal vertices (no successors):
 *        LF_v = eventDeadlineDays
 *        LS_v = LF_v - duration_v
 *    - For non-terminal vertices:
 *        LF_v = min_{w in Succ(v)} (LS_w - delay_w)
 *        LS_v = LF_v - duration_v
 *
 * 4. Total Float (Slack) & Critical Path:
 *    - TF_v = LS_v - ES_v = LF_v - EF_v
 *    - Critical Path Criterion: Tasks with slack = min_{k} (TF_k) form the zero-slack/longest chain.
 *    - Conflict Condition: EF_v > eventDeadlineDays (negative float relative to event celebration day).
 */

import { Task, DAGScheduleResult } from '../types';

/**
 * Validates DAG for cycles and produces a topological sort of task IDs using Kahn's algorithm.
 * @param tasks - The array of tasks representing nodes in the graph
 * @returns Sorted task IDs, cycle presence flag, and offending cycle node IDs
 */
export function topologicalSort(tasks: Task[]): { sortedIds: string[]; hasCycles: boolean; cycleNodes?: string[] } {
  const inDegree = new Map<string, number>();
  const adjList = new Map<string, string[]>();
  const taskMap = new Map<string, Task>();

  tasks.forEach((t) => {
    taskMap.set(t.id, t);
    inDegree.set(t.id, 0);
    adjList.set(t.id, []);
  });

  tasks.forEach((t) => {
    t.dependencies.forEach((depId) => {
      if (adjList.has(depId)) {
        adjList.get(depId)!.push(t.id);
        inDegree.set(t.id, (inDegree.get(t.id) || 0) + 1);
      }
    });
  });

  const queue: string[] = [];
  inDegree.forEach((degree, id) => {
    if (degree === 0) queue.push(id);
  });

  const sortedIds: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    sortedIds.push(current);

    const neighbors = adjList.get(current) || [];
    for (const neighbor of neighbors) {
      const newDegree = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  const hasCycles = sortedIds.length !== tasks.length;
  const cycleNodes = hasCycles ? tasks.filter((t) => !sortedIds.includes(t.id)).map((t) => t.id) : undefined;

  return { sortedIds, hasCycles, cycleNodes };
}

/**
 * Finds all downstream dependent tasks (transitive closure) for a given task ID
 */
export function getDownstreamDependents(tasks: Task[], startTaskId: string): string[] {
  const downstream = new Set<string>();
  const queue = [startTaskId];

  const parentToChildren = new Map<string, string[]>();
  tasks.forEach((t) => {
    t.dependencies.forEach((depId) => {
      if (!parentToChildren.has(depId)) parentToChildren.set(depId, []);
      parentToChildren.get(depId)!.push(t.id);
    });
  });

  while (queue.length > 0) {
    const current = queue.shift()!;
    const children = parentToChildren.get(current) || [];
    for (const child of children) {
      if (!downstream.has(child)) {
        downstream.add(child);
        queue.push(child);
      }
    }
  }

  return Array.from(downstream);
}

/**
 * Critical Path Method (CPM) Schedule Calculation
 * Computes Early Start (ES), Early Finish (EF), Late Start (LS), Late Finish (LF), and Total Float (Slack).
 * Identifies Critical Path (slack <= 0) and detects any deadline breaches.
 */
export function calculateSchedule(tasks: Task[], eventDeadlineDays: number): DAGScheduleResult {
  const { sortedIds, hasCycles, cycleNodes } = topologicalSort(tasks);

  if (hasCycles) {
    return {
      tasks,
      criticalPathTaskIds: [],
      projectDurationDays: 0,
      eventDeadlineDays,
      isDeadlineBreached: false,
      daysOverdue: 0,
      hasCycles: true,
      cycleNodes,
      affectedByDelays: [],
    };
  }

  const taskMap = new Map<string, Task>();
  tasks.forEach((t) => taskMap.set(t.id, { ...t }));

  // 1. FORWARD PASS: Compute Early Start (ES) and Early Finish (EF)
  sortedIds.forEach((id) => {
    const task = taskMap.get(id)!;
    let maxDepFinish = 0;

    for (const depId of task.dependencies) {
      const depTask = taskMap.get(depId);
      if (depTask) {
        maxDepFinish = Math.max(maxDepFinish, depTask.earlyFinish);
      }
    }

    // Delay on this task pushes its start date further
    task.earlyStart = maxDepFinish + (task.delayDays || 0);
    task.earlyFinish = task.earlyStart + task.durationDays;
  });

  // Calculate total project duration
  let projectDurationDays = 0;
  taskMap.forEach((t) => {
    projectDurationDays = Math.max(projectDurationDays, t.earlyFinish);
  });

  // Target completion point is at least the event deadline or the total duration
  const targetCompletion = Math.max(eventDeadlineDays, projectDurationDays);

  // 2. BACKWARD PASS: Compute Late Finish (LF) and Late Start (LS)
  // Build reverse adjacency list (successors)
  const successors = new Map<string, string[]>();
  tasks.forEach((t) => successors.set(t.id, []));
  tasks.forEach((t) => {
    t.dependencies.forEach((depId) => {
      if (successors.has(depId)) {
        successors.get(depId)!.push(t.id);
      }
    });
  });

  // Process in reverse topological order
  for (let i = sortedIds.length - 1; i >= 0; i--) {
    const id = sortedIds[i];
    const task = taskMap.get(id)!;
    const taskSuccessors = successors.get(id) || [];

    if (taskSuccessors.length === 0) {
      // Terminal node: Late Finish is set to event deadline
      task.lateFinish = eventDeadlineDays;
    } else {
      let minSuccessorLateStart = Infinity;
      for (const succId of taskSuccessors) {
        const succTask = taskMap.get(succId);
        if (succTask) {
          // Subtract any delay of successor
          const effectiveSuccStart = succTask.lateStart - (succTask.delayDays || 0);
          minSuccessorLateStart = Math.min(minSuccessorLateStart, effectiveSuccStart);
        }
      }
      task.lateFinish = minSuccessorLateStart;
    }

    task.lateStart = task.lateFinish - task.durationDays;
    task.slack = task.lateFinish - task.earlyFinish; // Equivalent to lateStart - earlyStart
  }

  // Determine minimum slack across the entire network (the longest path through the DAG)
  let minSlack = Infinity;
  taskMap.forEach((t) => {
    minSlack = Math.min(minSlack, t.slack);
  });

  taskMap.forEach((task) => {
    // Critical path is the sequence of tasks on the longest chain (minSlack) or any task with slack <= 0
    task.isCriticalPath = task.slack <= minSlack || task.slack <= 0;

    // Detect conflict: task finishes after event deadline day
    task.hasConflict = task.earlyFinish > eventDeadlineDays;
    if (task.hasConflict) {
      task.conflictReason = `Task finishes on Day ${task.earlyFinish}, which is ${task.earlyFinish - eventDeadlineDays} day(s) after Event Celebration Day (Day ${eventDeadlineDays}).`;
    } else if (task.delayDays > 0) {
      task.conflictReason = `Task is delayed by ${task.delayDays} day(s). Slack reduced to ${task.slack} day(s).`;
    } else {
      task.conflictReason = undefined;
    }
  });

  const updatedTasks = Array.from(taskMap.values());
  const criticalPathTaskIds = updatedTasks.filter((t) => t.isCriticalPath).map((t) => t.id);
  const isDeadlineBreached = projectDurationDays > eventDeadlineDays;
  const daysOverdue = Math.max(0, projectDurationDays - eventDeadlineDays);

  // Identify affected tasks for delayed items
  const affectedByDelays = updatedTasks
    .filter((t) => (t.delayDays || 0) > 0)
    .map((t) => {
      const downstream = getDownstreamDependents(tasks, t.id);
      const isCriticalImpact = t.isCriticalPath || downstream.some((dId) => taskMap.get(dId)?.isCriticalPath);
      return {
        delayedTaskId: t.id,
        delayDays: t.delayDays,
        downstreamAffectedTaskIds: downstream,
        criticalPathImpacted: isCriticalImpact,
      };
    });

  return {
    tasks: updatedTasks,
    criticalPathTaskIds,
    projectDurationDays,
    eventDeadlineDays,
    isDeadlineBreached,
    daysOverdue,
    hasCycles: false,
    affectedByDelays,
  };
}

/**
 * Propagates a delay on a specific task and updates the DAG schedule
 */
export function applyTaskDelay(tasks: Task[], taskId: string, delayDays: number, eventDeadlineDays: number): DAGScheduleResult {
  const updatedTasks = tasks.map((t) => {
    if (t.id === taskId) {
      return { ...t, delayDays };
    }
    return t;
  });

  return calculateSchedule(updatedTasks, eventDeadlineDays);
}

/**
 * Formats day offsets into friendly date labels given a base date
 */
export function formatDayOffset(baseDateIso: string, dayOffset: number): string {
  const d = new Date(baseDateIso);
  d.setDate(d.getDate() + dayOffset);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
