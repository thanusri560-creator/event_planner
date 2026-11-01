/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file BeforeAfterMatrix.tsx
 * @description Accessible comparison matrix showing Before vs After state for budget,
 * headcount, venue seating headroom, and timeline duration under stress simulation.
 */

import React from 'react';
import { EventPlan, SimulationResult } from '../../types';

interface BeforeAfterMatrixProps {
  activeEvent: EventPlan;
  currentResult: SimulationResult;
}

export const BeforeAfterMatrix: React.FC<BeforeAfterMatrixProps> = ({
  activeEvent,
  currentResult,
}) => {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
      <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-4">
        Before vs After Multi-Dimensional Comparison
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs" aria-label="Before versus after simulation comparison matrix">
          <thead className="border-b border-stone-200 bg-stone-50/70 text-stone-500 uppercase tracking-wider font-semibold">
            <tr>
              <th scope="col" className="py-3 px-4">Metric</th>
              <th scope="col" className="py-3 px-4">Baseline Plan (Before)</th>
              <th scope="col" className="py-3 px-4">Simulated Reality (After)</th>
              <th scope="col" className="py-3 px-4">Variance / Impact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            <tr>
              <th scope="row" className="py-3 px-4 font-bold text-stone-900">Total Budget Ceiling</th>
              <td className="py-3 px-4 font-mono">
                {activeEvent.currency}{currentResult.before.totalBudget.toLocaleString()}
              </td>
              <td className="py-3 px-4 font-mono font-bold">
                {activeEvent.currency}{currentResult.after.totalBudget.toLocaleString()}
              </td>
              <td className="py-3 px-4 font-bold text-stone-700">
                {currentResult.budgetDiff.budgetDelta !== 0
                  ? `${currentResult.budgetDiff.budgetDelta > 0 ? '+' : ''}${activeEvent.currency}${currentResult.budgetDiff.budgetDelta.toLocaleString()}`
                  : 'No change'}
              </td>
            </tr>

            <tr>
              <th scope="row" className="py-3 px-4 font-bold text-stone-900">Projected Expenses</th>
              <td className="py-3 px-4 font-mono">
                {activeEvent.currency}{currentResult.before.totalEstimated.toLocaleString()}
              </td>
              <td className="py-3 px-4 font-mono font-bold">
                {activeEvent.currency}{currentResult.after.totalEstimated.toLocaleString()}
              </td>
              <td className="py-3 px-4 font-bold text-rose-600">
                {currentResult.budgetDiff.overspend > 0
                  ? `Deficit +${activeEvent.currency}${currentResult.budgetDiff.overspend.toLocaleString()}`
                  : 'Within budget'}
              </td>
            </tr>

            <tr>
              <th scope="row" className="py-3 px-4 font-bold text-stone-900">Guest Headcount</th>
              <td className="py-3 px-4 font-mono">{currentResult.before.guestCount} Pax</td>
              <td className="py-3 px-4 font-mono font-bold">{currentResult.after.guestCount} Pax</td>
              <td className="py-3 px-4 font-bold text-stone-700">
                {currentResult.after.guestCount - currentResult.before.guestCount !== 0
                  ? `${currentResult.after.guestCount - currentResult.before.guestCount > 0 ? '+' : ''}${currentResult.after.guestCount - currentResult.before.guestCount} Guests`
                  : '0'}
              </td>
            </tr>

            <tr>
              <th scope="row" className="py-3 px-4 font-bold text-stone-900">Venue Seating Headroom</th>
              <td className="py-3 px-4 font-mono">220 Capacity (Pass)</td>
              <td className="py-3 px-4 font-mono font-bold">
                {currentResult.capacityIssues.hasCapacityDeficit ? (
                  <span className="text-rose-600 font-bold">
                    220 Capacity (-{currentResult.capacityIssues.shortfall} Shortfall)
                  </span>
                ) : (
                  <span className="text-emerald-600 font-bold">Comfortable (+{220 - currentResult.after.guestCount} seats)</span>
                )}
              </td>
              <td className="py-3 px-4">
                {currentResult.capacityIssues.hasCapacityDeficit ? (
                  <span className="rounded bg-rose-100 text-rose-800 px-2 py-0.5 text-[10px] font-bold uppercase">
                    Exceeds Hall Limit
                  </span>
                ) : (
                  <span className="text-emerald-700 font-medium">Clear</span>
                )}
              </td>
            </tr>

            <tr>
              <th scope="row" className="py-3 px-4 font-bold text-stone-900">Project Duration & Deadline</th>
              <td className="py-3 px-4 font-mono">
                {currentResult.before.projectDurationDays} / {currentResult.before.eventDeadlineDays} Days
              </td>
              <td className="py-3 px-4 font-mono font-bold">
                {currentResult.after.projectDurationDays} / {currentResult.after.eventDeadlineDays} Days
              </td>
              <td className="py-3 px-4">
                {currentResult.timelineDiff.deadlineBreached ? (
                  <span className="text-rose-600 font-bold">
                    +{currentResult.timelineDiff.daysOverdue} Days Past Deadline!
                  </span>
                ) : (
                  <span className="text-emerald-600 font-medium">On-Time</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
