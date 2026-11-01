/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file BudgetPage.tsx
 * @description Dynamic Budget Optimization Engine page orchestrating priority-weighted expense allocation,
 * category ceilings, overspend warnings, and line-item management.
 */

import React, { useState } from 'react';
import {
  Sparkles,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import {
  EventPlan,
  BudgetItem,
  BudgetCategory,
  PriorityLevel,
  ProposedAdjustment,
} from '../types';
import {
  aggregateByCategory,
  applyApprovedAdjustments,
} from '../logic/budgetOptimizer';
import { BudgetOptimizationModal } from '../components/BudgetOptimizationModal';
import { CategoryCardsGrid } from '../components/budget/CategoryCardsGrid';
import { AddExpenseItemForm } from '../components/budget/AddExpenseItemForm';
import { ExpenseItemTable } from '../components/budget/ExpenseItemTable';
import { useEventEngine } from '../hooks/useEventEngine';

interface BudgetPageProps {
  activeEvent: EventPlan;
  onUpdateEvent: (updated: EventPlan) => void;
  isOptimizerOpen: boolean;
  setIsOptimizerOpen: (open: boolean) => void;
}

export const BudgetPage: React.FC<BudgetPageProps> = ({
  activeEvent,
  onUpdateEvent,
  isOptimizerOpen,
  setIsOptimizerOpen,
}) => {
  const [isAddingItem, setIsAddingItem] = useState(false);

  const {
    overspend,
    isOverBudget,
    optimizationResult,
  } = useEventEngine(activeEvent);

  // Handle category priority change
  const handleCategoryPriorityChange = (category: BudgetCategory, newPriority: PriorityLevel) => {
    const updatedCategories = activeEvent.categories.map((c) =>
      c.category === category ? { ...c, priority: newPriority } : c
    );
    // Also update priority of items in that category
    const updatedItems = activeEvent.items.map((i) =>
      i.categoryId === category ? { ...i, priority: newPriority } : i
    );

    onUpdateEvent({
      ...activeEvent,
      categories: updatedCategories,
      items: updatedItems,
    });
  };

  // Handle item cost edit
  const handleUpdateItemCost = (itemId: string, newCost: number) => {
    const cost = Math.max(0, isNaN(newCost) ? 0 : newCost);
    const updatedItems = activeEvent.items.map((i) =>
      i.id === itemId ? { ...i, estimatedCost: cost } : i
    );
    const updatedCategories = aggregateByCategory(activeEvent.categories, updatedItems);
    onUpdateEvent({
      ...activeEvent,
      items: updatedItems,
      categories: updatedCategories,
    });
  };

  // Handle item priority edit
  const handleUpdateItemPriority = (itemId: string, newPriority: PriorityLevel) => {
    const updatedItems = activeEvent.items.map((i) =>
      i.id === itemId ? { ...i, priority: newPriority } : i
    );
    onUpdateEvent({
      ...activeEvent,
      items: updatedItems,
    });
  };

  // Handle item delete
  const handleDeleteItem = (itemId: string) => {
    const updatedItems = activeEvent.items.filter((i) => i.id !== itemId);
    const updatedCategories = aggregateByCategory(activeEvent.categories, updatedItems);
    onUpdateEvent({
      ...activeEvent,
      items: updatedItems,
      categories: updatedCategories,
    });
  };

  // Handle add item
  const handleAddItem = (newItem: BudgetItem) => {
    const updatedItems = [...activeEvent.items, newItem];
    const updatedCategories = aggregateByCategory(activeEvent.categories, updatedItems);

    onUpdateEvent({
      ...activeEvent,
      items: updatedItems,
      categories: updatedCategories,
    });

    setIsAddingItem(false);
  };

  // Handle approving adjustments from optimizer
  const handleApplyOptimizerAdjustments = (adjustments: ProposedAdjustment[]) => {
    const { updatedItems, updatedCategories } = applyApprovedAdjustments(
      activeEvent.items,
      activeEvent.categories,
      adjustments
    );
    onUpdateEvent({
      ...activeEvent,
      items: updatedItems,
      categories: updatedCategories,
      activeAdjustments: adjustments,
      status: 'optimized',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Budget Status Bar */}
      <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-stone-900 tracking-tight">
                Dynamic Budget Optimization Engine
              </h1>
              <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-800">
                Deterministic CPM Logic
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Priority-weighted expense reallocation, automatic overspend detection, and line-item approval.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddingItem(true)}
              className="flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 px-3.5 py-2 text-xs font-semibold text-stone-800 transition shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Add Expense Item</span>
            </button>

            <button
              onClick={() => setIsOptimizerOpen(true)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition ${
                isOverBudget
                  ? 'bg-rose-600 hover:bg-rose-700 animate-pulse'
                  : 'bg-purple-700 hover:bg-purple-800'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>
                {isOverBudget
                  ? `Run Optimizer (Resolve +${activeEvent.currency}${overspend.toLocaleString()})`
                  : 'Run Optimizer (Rebalance)'}
              </span>
            </button>
          </div>
        </div>

        {/* Overspend Alert if over budget */}
        {isOverBudget && (
          <div className="mt-5 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-rose-100 p-2 text-rose-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <span className="font-bold text-rose-900 text-sm">
                  Overrun Detected: {activeEvent.currency}{overspend.toLocaleString()} above target budget!
                </span>
                <p className="text-rose-700 mt-0.5">
                  The optimizer will suggest reductions strictly on flexible low & medium priority items (Decoration, Media) to protect high-priority Venue & Catering.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOptimizerOpen(true)}
              className="rounded-lg bg-rose-700 hover:bg-rose-800 px-3.5 py-1.5 text-xs font-bold text-white shrink-0 shadow-xs"
            >
              Review Proposed Cuts
            </button>
          </div>
        )}
      </div>

      {/* Category Allocations Cards Grid */}
      <CategoryCardsGrid
        activeEvent={activeEvent}
        onCategoryPriorityChange={handleCategoryPriorityChange}
      />

      {/* Add New Item Form if open */}
      {isAddingItem && (
        <AddExpenseItemForm
          activeEvent={activeEvent}
          onAddItem={handleAddItem}
          onCancel={() => setIsAddingItem(false)}
        />
      )}

      {/* Editable Line-Item Table */}
      <ExpenseItemTable
        activeEvent={activeEvent}
        onUpdateItemCost={handleUpdateItemCost}
        onUpdateItemPriority={handleUpdateItemPriority}
        onDeleteItem={handleDeleteItem}
      />

      {/* Budget Optimization Modal */}
      <BudgetOptimizationModal
        isOpen={isOptimizerOpen}
        onClose={() => setIsOptimizerOpen(false)}
        optimizationResult={optimizationResult}
        activeEvent={activeEvent}
        onApplyAdjustments={handleApplyOptimizerAdjustments}
      />
    </div>
  );
};
