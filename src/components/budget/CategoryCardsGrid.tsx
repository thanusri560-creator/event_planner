/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file CategoryCardsGrid.tsx
 * @description Renders category budget allocations, progress bars, and priority selection.
 */

import React from 'react';
import { EventPlan, BudgetCategory, PriorityLevel } from '../../types';

interface CategoryCardsGridProps {
  activeEvent: EventPlan;
  onCategoryPriorityChange: (category: BudgetCategory, newPriority: PriorityLevel) => void;
}

export const CategoryCardsGrid: React.FC<CategoryCardsGridProps> = ({
  activeEvent,
  onCategoryPriorityChange,
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
          Category Allocations & Priority Tiers
        </h2>
        <span className="text-xs text-stone-500">
          Set priorities to dictate which categories the optimizer protects
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {activeEvent.categories.map((cat) => {
          const catItems = activeEvent.items.filter((i) => i.categoryId === cat.category);
          const est = catItems.reduce((s, i) => s + (i.actualCost ?? i.estimatedCost), 0);
          const isOver = est > cat.allocatedAmount;
          const diff = est - cat.allocatedAmount;

          return (
            <div
              key={cat.category}
              className={`rounded-2xl border bg-white p-4 transition shadow-xs ${
                isOver ? 'border-rose-300 ring-1 ring-rose-200' : 'border-stone-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-900 text-sm">{cat.label}</span>
                {/* Priority selector */}
                <select
                  value={cat.priority}
                  aria-label={`${cat.label} Priority`}
                  onChange={(e) =>
                    onCategoryPriorityChange(cat.category, e.target.value as PriorityLevel)
                  }
                  className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase cursor-pointer border ${
                    cat.priority === 'high'
                      ? 'bg-purple-100 text-purple-800 border-purple-200'
                      : cat.priority === 'medium'
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  <option value="high">High (Protect)</option>
                  <option value="medium">Medium (Flex)</option>
                  <option value="low">Low (Cut First)</option>
                </select>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-stone-500 block">Est. Quotes</span>
                  <span
                    className={`text-lg font-black ${
                      isOver ? 'text-rose-600' : 'text-stone-900'
                    }`}
                  >
                    {activeEvent.currency}
                    {est.toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-stone-400 block">Budget Ceiling</span>
                  <span className="text-xs font-semibold text-stone-600">
                    {activeEvent.currency}
                    {cat.allocatedAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div
                className="mt-2.5 h-1.5 w-full rounded-full bg-stone-100 overflow-hidden"
                role="progressbar"
                aria-valuenow={Math.round((est / cat.allocatedAmount) * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${cat.label} allocation used`}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    backgroundColor: isOver ? '#ef4444' : cat.color,
                    width: `${Math.min(100, (est / cat.allocatedAmount) * 100)}%`,
                  }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-stone-500">{catItems.length} line-items</span>
                <span
                  className={`font-semibold ${
                    isOver ? 'text-rose-600' : diff === 0 ? 'text-stone-500' : 'text-emerald-600'
                  }`}
                >
                  {isOver ? `+${activeEvent.currency}${diff.toLocaleString()} over` : 'Within limits'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
