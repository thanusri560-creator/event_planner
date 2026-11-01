/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file ExpenseItemTable.tsx
 * @description Tabular presentation of itemized expenses with inline cost updates,
 * priority transitions, and category filtering.
 */

import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { EventPlan, BudgetItem, PriorityLevel } from '../../types';

interface ExpenseItemTableProps {
  activeEvent: EventPlan;
  onUpdateItemCost: (itemId: string, newCost: number) => void;
  onUpdateItemPriority: (itemId: string, newPriority: PriorityLevel) => void;
  onDeleteItem: (itemId: string) => void;
}

export const ExpenseItemTable: React.FC<ExpenseItemTableProps> = ({
  activeEvent,
  onUpdateItemCost,
  onUpdateItemPriority,
  onDeleteItem,
}) => {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  const filteredItems = activeEvent.items.filter((i) => {
    if (selectedCategoryFilter === 'all') return true;
    return i.categoryId === selectedCategoryFilter;
  });

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-stone-900">
            Granular Line-Item Expenses ({filteredItems.length})
          </h2>
          <p className="text-xs text-stone-500">
            Edit any cost directly to see real-time recalculation of budget headroom
          </p>
        </div>

        {/* Category filter buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setSelectedCategoryFilter('all')}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              selectedCategoryFilter === 'all'
                ? 'bg-purple-700 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All ({activeEvent.items.length})
          </button>
          {activeEvent.categories.map((c) => (
            <button
              key={c.category}
              onClick={() => setSelectedCategoryFilter(c.category)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                selectedCategoryFilter === c.category
                  ? 'bg-purple-700 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {c.label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs" aria-label="Granular line-item expenses table">
          <thead className="border-b border-stone-200 bg-stone-50/70 text-stone-500 uppercase tracking-wider font-semibold">
            <tr>
              <th scope="col" className="py-3 px-4">Line Item</th>
              <th scope="col" className="py-3 px-3">Category</th>
              <th scope="col" className="py-3 px-3">Priority</th>
              <th scope="col" className="py-3 px-3">Cost Basis</th>
              <th scope="col" className="py-3 px-4">Estimated Cost</th>
              <th scope="col" className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filteredItems.map((item) => (
              <tr key={item.id} className="hover:bg-stone-50/60 transition">
                <td className="py-3.5 px-4 font-bold text-stone-900">
                  {item.name}
                  {item.costPerGuest && (
                    <span className="block text-[11px] font-normal text-stone-500">
                      ₹{item.costPerGuest}/guest × {activeEvent.guestCount} guests
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-3">
                  <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-700 capitalize">
                    {item.categoryId}
                  </span>
                </td>
                <td className="py-3.5 px-3">
                  <select
                    value={item.priority}
                    aria-label={`Priority for ${item.name}`}
                    onChange={(e) =>
                      onUpdateItemPriority(item.id, e.target.value as PriorityLevel)
                    }
                    className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase cursor-pointer border ${
                      item.priority === 'high'
                        ? 'bg-purple-100 text-purple-800 border-purple-200'
                        : item.priority === 'medium'
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : 'bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    <option value="high">High (Protect)</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low (Reducible)</option>
                  </select>
                </td>
                <td className="py-3.5 px-3 text-stone-500 text-[11px]">
                  Min viable: {activeEvent.currency}
                  {item.minViableCost.toLocaleString()}
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-stone-400 font-semibold">{activeEvent.currency}</span>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      aria-label={`Estimated cost for ${item.name}`}
                      value={item.estimatedCost}
                      onChange={(e) => onUpdateItemCost(item.id, parseInt(e.target.value) || 0)}
                      className="w-28 rounded-lg border border-stone-300 px-2 py-1 font-bold text-stone-900 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 text-xs"
                    />
                  </div>
                </td>
                <td className="py-3.5 px-3 text-right">
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 transition rounded-lg hover:bg-stone-100"
                    title="Delete expense line"
                    aria-label={`Delete ${item.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
