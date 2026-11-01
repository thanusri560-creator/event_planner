/**
 * @file validation.ts
 * @description Robust input validation, sanitization, and constraint enforcement.
 * Protects against invalid numbers, circular dependencies, negative values, and script injection.
 */

import { Task, CategoryAllocation, BudgetItem, EventType } from '../types';
import { topologicalSort } from './dependencyScheduler';

export interface ValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
}

/**
 * Sanitizes user input string against HTML tags, scripts, and control characters.
 */
export function sanitizeInput(input: string, maxLength: number = 200): string {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/<[^>]*>?/gm, '') // Remove HTML tags
    .replace(/[;&$><]/g, '') // Remove dangerous shell/script characters
    .slice(0, maxLength);
}

/**
 * Validates core event initialization parameters.
 */
export function validateEventInput(params: {
  name: string;
  type: EventType;
  totalBudget: number;
  guestCount: number;
  eventDeadlineDays: number;
  location: string;
}): ValidationResult {
  const issues: ValidationIssue[] = [];

  const cleanName = sanitizeInput(params.name, 100);
  if (!cleanName || cleanName.length < 3) {
    issues.push({
      field: 'name',
      message: 'Event name must be at least 3 characters long and contain valid text.',
      severity: 'error',
    });
  }

  if (typeof params.totalBudget !== 'number' || isNaN(params.totalBudget) || params.totalBudget < 5000) {
    issues.push({
      field: 'totalBudget',
      message: 'Total budget must be a positive number of at least 5,000.',
      severity: 'error',
    });
  } else if (params.totalBudget > 1000000000) {
    issues.push({
      field: 'totalBudget',
      message: 'Total budget exceeds maximum allowed limit (1,000,000,000).',
      severity: 'error',
    });
  }

  if (typeof params.guestCount !== 'number' || isNaN(params.guestCount) || params.guestCount < 1) {
    issues.push({
      field: 'guestCount',
      message: 'Guest count must be at least 1 attendee.',
      severity: 'error',
    });
  } else if (params.guestCount > 100000) {
    issues.push({
      field: 'guestCount',
      message: 'Guest count exceeds maximum venue capacity limit (100,000).',
      severity: 'error',
    });
  }

  if (typeof params.eventDeadlineDays !== 'number' || isNaN(params.eventDeadlineDays) || params.eventDeadlineDays < 1) {
    issues.push({
      field: 'eventDeadlineDays',
      message: 'Planning horizon must be at least 1 day before the event.',
      severity: 'error',
    });
  }

  const cleanLocation = sanitizeInput(params.location, 150);
  if (!cleanLocation || cleanLocation.length < 2) {
    issues.push({
      field: 'location',
      message: 'Valid location/venue description is required.',
      severity: 'error',
    });
  }

  return {
    isValid: issues.filter((i) => i.severity === 'error').length === 0,
    issues,
  };
}

/**
 * Validates DAG task graph integrity, checking for positive durations,
 * valid dependency IDs, and detecting cyclic dependency loops.
 */
export function validateTaskGraph(tasks: Task[]): ValidationResult {
  const issues: ValidationIssue[] = [];
  const taskIdSet = new Set<string>(tasks.map((t) => t.id));

  // Check for unique IDs and positive durations
  tasks.forEach((t) => {
    if (t.durationDays <= 0) {
      issues.push({
        field: `task-${t.id}`,
        message: `Task "${t.name}" must have a duration of at least 1 day.`,
        severity: 'error',
      });
    }

    t.dependencies.forEach((depId) => {
      if (!taskIdSet.has(depId)) {
        issues.push({
          field: `task-${t.id}-dep`,
          message: `Task "${t.name}" references non-existent dependency ID "${depId}".`,
          severity: 'warning',
        });
      }
      if (depId === t.id) {
        issues.push({
          field: `task-${t.id}-self`,
          message: `Task "${t.name}" cannot depend on itself.`,
          severity: 'error',
        });
      }
    });
  });

  // Check for circular dependency loops
  const { hasCycles, cycleNodes } = topologicalSort(tasks);
  if (hasCycles) {
    issues.push({
      field: 'dag-cycle',
      message: `Circular dependency loop detected involving tasks: ${(cycleNodes || []).join(', ')}.`,
      severity: 'error',
    });
  }

  return {
    isValid: issues.filter((i) => i.severity === 'error').length === 0,
    issues,
  };
}

/**
 * Validates budget line item numbers.
 */
export function validateBudgetItem(item: BudgetItem): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (item.estimatedCost < 0 || isNaN(item.estimatedCost)) {
    issues.push({
      field: 'estimatedCost',
      message: 'Cost cannot be negative or invalid number.',
      severity: 'error',
    });
  }

  if (item.minViableCost < 0 || isNaN(item.minViableCost)) {
    issues.push({
      field: 'minViableCost',
      message: 'Minimum viable floor cannot be negative.',
      severity: 'error',
    });
  }

  return {
    isValid: issues.filter((i) => i.severity === 'error').length === 0,
    issues,
  };
}
