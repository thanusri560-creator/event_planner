import React, { useState } from 'react';
import {
  Wallet,
  TrendingDown,
  Sparkles,
  AlertTriangle,
  Plus,
  Trash2,
  Edit3,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Info,
  DollarSign,
  Layers,
} from 'lucide-react';
import {
  EventPlan,
  BudgetItem,
  CategoryAllocation,
  BudgetCategory,
  PriorityLevel,
  ProposedAdjustment,
} from '../types';
import {
  calculateTotalEstimated,
  optimizeBudget,
  aggregateByCategory,
  applyApprovedAdjustments,
} from '../logic/budgetOptimizer';
import { BudgetOptimizationModal } from '../components/BudgetOptimizationModal';

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
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // New item form state
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<BudgetCategory>('decoration');
  const [newItemCost, setNewItemCost] = useState(5000);
  const [newItemPriority, setNewItemPriority] = useState<PriorityLevel>('medium');

  const totalEstimated = calculateTotalEstimated(activeEvent.items);
  const overspend = Math.max(0, totalEstimated - activeEvent.totalBudget);
  const isOverBudget = totalEstimated > activeEvent.totalBudget;

  // Run optimizer calculation
  const optimizationResult = optimizeBudget(
    activeEvent.totalBudget,
    activeEvent.categories,
    activeEvent.items
  );

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
  const handleAddItem = (e: React.FormEvent) => {
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

    const updatedItems = [...activeEvent.items, newItem];
    const updatedCategories = aggregateByCategory(activeEvent.categories, updatedItems);

    onUpdateEvent({
      ...activeEvent,
      items: updatedItems,
      categories: updatedCategories,
    });

    setNewItemName('');
    setNewItemCost(5000);
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

  // Filtered items
  const filteredItems = activeEvent.items.filter((i) => {
    if (selectedCategoryFilter === 'all') return true;
    return i.categoryId === selectedCategoryFilter;
  });

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
                    onChange={(e) =>
                      handleCategoryPriorityChange(cat.category, e.target.value as PriorityLevel)
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
                <div className="mt-2.5 h-1.5 w-full rounded-full bg-stone-100 overflow-hidden">
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

      {/* Add New Item Drawer / Form if open */}
      {isAddingItem && (
        <form
          onSubmit={handleAddItem}
          className="rounded-2xl border border-purple-200 bg-purple-50/50 p-5 shadow-sm space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900">
              Add New Celebration Line-Item Expense
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingItem(false)}
              className="text-stone-400 hover:text-stone-700 text-xs font-medium"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Item Name</label>
              <input
                type="text"
                required
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="e.g. Stage Pyrotechnics & Confetti"
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-800 focus:outline-none focus:ring-1 focus:ring-purple-600"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">Category</label>
              <select
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
              <label className="font-semibold text-stone-700 block mb-1">
                Estimated Cost ({activeEvent.currency})
              </label>
              <input
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
              <label className="font-semibold text-stone-700 block mb-1">Priority Level</label>
              <select
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
              onClick={() => setIsAddingItem(false)}
              className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-purple-700 hover:bg-purple-800 px-4 py-2 text-xs font-bold text-white shadow-xs"
            >
              Add Expense
            </button>
          </div>
        </form>
      )}

      {/* Editable Line-Item Table */}
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
          <table className="w-full text-left text-xs">
            <thead className="border-b border-stone-200 bg-stone-50/70 text-stone-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Line Item</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3">Cost Basis</th>
                <th className="py-3 px-4">Estimated Cost</th>
                <th className="py-3 px-3 text-right">Actions</th>
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
                      onChange={(e) =>
                        handleUpdateItemPriority(item.id, e.target.value as PriorityLevel)
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
                        value={item.estimatedCost}
                        onChange={(e) => handleUpdateItemCost(item.id, parseInt(e.target.value) || 0)}
                        className="w-28 rounded-lg border border-stone-300 px-2 py-1 font-bold text-stone-900 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 text-xs"
                      />
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 transition rounded-lg hover:bg-stone-100"
                      title="Delete expense line"
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
