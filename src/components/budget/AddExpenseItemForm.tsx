/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file AddExpenseItemForm.tsx
 * @description Accessible form drawer for adding a new itemized celebration expense.
 */

import React, { useState } from 'react';
import { EventPlan, BudgetCategory, PriorityLevel, BudgetItem } from '../../types';

interface AddExpenseItemFormProps {
  activeEvent: EventPlan;
  onAddItem: (item: BudgetItem) => void;
  onCancel: () => void;
}

export const AddExpenseItemForm: React.FC<AddExpenseItemFormProps> = ({
  activeEvent,
  onAddItem,
  onCancel,
}) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<BudgetCategory>('decoration');
  const [newItemCost, setNewItemCost] = useState(5000);
  const [newItemPriority, setNewItemPriority] = useState<PriorityLevel>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: BudgetItem = {
      id: `item-${Date.now()}`,
      categoryId: newItemCategory,
      name: newItemName.trim(),
      estimatedCost: newItemCost,
      priority: newItemPriority,
      isFlexible: newItemPriority !== 'high',
      minViableCost: Math.round(newItemCost * 0.4),
    };

    onAddItem(newItem);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-purple-200 bg-purple-50/50 p-5 shadow-sm space-y-4 animate-in fade-in"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-stone-900">
          Add New Celebration Line-Item Expense
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-stone-400 hover:text-stone-700 text-xs font-medium"
        >
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <label htmlFor="newItemName" className="font-semibold text-stone-700 block mb-1">
            Item Name
          </label>
          <input
            id="newItemName"
            type="text"
            required
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="e.g. Stage Pyrotechnics & Confetti"
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-800 focus:outline-none focus:ring-1 focus:ring-purple-600"
          />
        </div>

        <div>
          <label htmlFor="newItemCategory" className="font-semibold text-stone-700 block mb-1">
            Category
          </label>
          <select
            id="newItemCategory"
            value={newItemCategory}
            onChange={(e) => setNewItemCategory(e.target.value as BudgetCategory)}
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-800"
          >
            {activeEvent.categories.map((c) => (
              <option key={c.category} value={c.category}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="newItemCost" className="font-semibold text-stone-700 block mb-1">
            Estimated Cost ({activeEvent.currency})
          </label>
          <input
            id="newItemCost"
            type="number"
            min="0"
            step="500"
            required
            value={newItemCost}
            onChange={(e) => setNewItemCost(parseInt(e.target.value) || 0)}
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-800"
          />
        </div>

        <div>
          <label htmlFor="newItemPriority" className="font-semibold text-stone-700 block mb-1">
            Priority Level
          </label>
          <select
            id="newItemPriority"
            value={newItemPriority}
            onChange={(e) => setNewItemPriority(e.target.value as PriorityLevel)}
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-800"
          >
            <option value="high">High (Protect from cuts)</option>
            <option value="medium">Medium (Moderate flexibility)</option>
            <option value="low">Low (First to cut if overspend)</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-xl bg-purple-700 hover:bg-purple-800 px-4 py-2 text-xs font-bold text-white shadow-xs transition"
        >
          Add Expense
        </button>
      </div>
    </form>
  );
};
