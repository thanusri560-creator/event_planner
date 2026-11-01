/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file RecoveryPlanList.tsx
 * @description Actionable algorithmic recovery plan display showing prioritized mitigation steps
 * and expected impact metrics to restore event feasibility.
 */

import React from 'react';
import { RecoveryStep } from '../../types';

interface RecoveryPlanListProps {
  recoveryPlan: RecoveryStep[];
}

export const RecoveryPlanList: React.FC<RecoveryPlanListProps> = ({ recoveryPlan }) => {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
            Algorithmic Recovery Strategy Plan
          </h3>
          <p className="text-xs text-stone-500">
            Step-by-step mitigation actions formulated to bring the event back to 100% feasibility
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {recoveryPlan.map((step) => (
          <div
            key={step.stepNumber}
            className="flex items-start justify-between rounded-xl border border-stone-200 bg-stone-50 p-4 text-xs"
          >
            <div className="flex items-start gap-3">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-700 text-white font-bold shrink-0 text-xs"
                aria-hidden="true"
              >
                {step.stepNumber}
              </span>
              <div>
                <span className="font-bold text-stone-900 text-sm block">
                  {step.title}
                </span>
                <p className="text-stone-600 mt-0.5 font-medium">
                  {step.description}
                </p>
              </div>
            </div>

            <span className="rounded-lg bg-emerald-100 text-emerald-800 px-2.5 py-1 text-xs font-bold shrink-0">
              {step.impactMetric}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
