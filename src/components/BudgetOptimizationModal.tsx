import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  TrendingDown,
  Sparkles,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Sliders,
  DollarSign,
  Info,
} from 'lucide-react';
import {
  EventPlan,
  BudgetOptimizationResult,
  ProposedAdjustment,
} from '../types';
import { fetchBudgetOptimizationRationale } from '../logic/geminiService';
import confetti from 'canvas-confetti';

interface BudgetOptimizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  optimizationResult: BudgetOptimizationResult;
  activeEvent: EventPlan;
  onApplyAdjustments: (adjustments: ProposedAdjustment[]) => void;
}

export const BudgetOptimizationModal: React.FC<BudgetOptimizationModalProps> = ({
  isOpen,
  onClose,
  optimizationResult,
  activeEvent,
  onApplyAdjustments,
}) => {
  if (!isOpen) return null;

  // Local state for checkboxes
  const [adjustments, setAdjustments] = useState<ProposedAdjustment[]>(
    optimizationResult.adjustments.map((a) => ({ ...a, approved: a.approved ?? true }))
  );
  const [aiRationale, setAiRationale] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);

  // Keyboard accessibility: Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const toggleApproval = (itemId: string) => {
    setAdjustments((prev) =>
      prev.map((a) => (a.itemId === itemId ? { ...a, approved: !a.approved } : a))
    );
  };

  // Recalculate dynamic totals based on checked items
  const activeApproved = adjustments.filter((a) => a.approved);
  const currentApprovedSavings = activeApproved.reduce((sum, a) => sum + a.amountSaved, 0);
  const remainingDeficit = Math.max(0, optimizationResult.overspendAmount - currentApprovedSavings);
  const newProjectedTotal = optimizationResult.totalEstimated - currentApprovedSavings;

  const handleFetchAIRationale = async () => {
    setIsLoadingAI(true);
    try {
      const res = await fetchBudgetOptimizationRationale(
        activeEvent,
        optimizationResult.overspendAmount,
        adjustments
      );
      setAiRationale(res.rationale);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleConfirm = () => {
    onApplyAdjustments(adjustments);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="budget-opt-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/70 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 id="budget-opt-title" className="text-lg font-bold text-stone-900">
                Dynamic Budget Optimization Proposal
              </h2>
              <p className="text-xs text-stone-500">
                Review and approve algorithmic cuts. High-priority categories are protected.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close budget optimization proposal"
            className="rounded-lg p-2 text-stone-400 hover:bg-stone-200/60 hover:text-stone-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Deficit & Savings Metric Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5">
              <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider block">
                Overspend Detected
              </span>
              <span className="text-2xl font-bold text-rose-900">
                {activeEvent.currency}
                {optimizationResult.overspendAmount.toLocaleString()}
              </span>
              <p className="text-[11px] text-rose-600 mt-0.5">
                Target budget: {activeEvent.currency}
                {activeEvent.totalBudget.toLocaleString()}
              </p>
            </div>

            <div className="rounded-xl bg-purple-50 border border-purple-200 p-3.5">
              <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider block">
                Selected Cuts Savings
              </span>
              <span className="text-2xl font-bold text-purple-900">
                {activeEvent.currency}
                {currentApprovedSavings.toLocaleString()}
              </span>
              <p className="text-[11px] text-purple-600 mt-0.5">
                {activeApproved.length} of {adjustments.length} line-items approved
              </p>
            </div>

            <div
              className={`rounded-xl border p-3.5 ${
                remainingDeficit === 0
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <span className="text-[11px] font-semibold uppercase tracking-wider block">
                {remainingDeficit === 0 ? 'Budget Balance' : 'Remaining Deficit'}
              </span>
              <span className="text-2xl font-bold">
                {remainingDeficit === 0 ? '100% Balanced' : `${activeEvent.currency}${remainingDeficit.toLocaleString()}`}
              </span>
              <p className="text-[11px] mt-0.5 opacity-80">
                New estimate: {activeEvent.currency}
                {newProjectedTotal.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Protection Notice */}
          <div className="flex items-center gap-2.5 rounded-xl bg-stone-100/80 px-4 py-2.5 text-xs text-stone-700 border border-stone-200">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Priority Guard Active:</strong> High-priority categories (
              {activeEvent.categories
                .filter((c) => c.priority === 'high')
                .map((c) => c.label.split(' ')[0])
                .join(', ')}
              ) were completely preserved from mandatory cuts.
            </span>
          </div>

          {/* Adjustments List */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-sm font-bold text-stone-900">
                Proposed Category Adjustments ({adjustments.length})
              </h3>
              <span className="text-xs text-stone-500">
                Uncheck any change you do not wish to execute
              </span>
            </div>

            <div className="space-y-3">
              {adjustments.map((adj) => {
                const isApproved = adj.approved !== false;
                return (
                  <div
                    key={adj.itemId}
                    onClick={() => toggleApproval(adj.itemId)}
                    className={`cursor-pointer rounded-xl border p-4 transition ${
                      isApproved
                        ? 'border-purple-300 bg-purple-50/40 shadow-sm'
                        : 'border-stone-200 bg-stone-50 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isApproved}
                          onChange={() => {}} // handled by div onClick
                          className="mt-1 h-4 w-4 rounded border-stone-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900 text-sm">
                              {adj.itemName}
                            </span>
                            <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-stone-700">
                              {adj.category}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                                adj.priority === 'low'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {adj.priority} Priority
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-stone-700 font-medium">
                            {adj.reason}
                          </p>
                          <p className="text-[11px] text-stone-500 mt-0.5 italic">
                            Impact: {adj.impactDescription}
                          </p>
                        </div>
                      </div>

                      {/* Pricing Delta */}
                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold text-emerald-700 block">
                          - {activeEvent.currency}
                          {adj.amountSaved.toLocaleString()}
                        </span>
                        <span className="text-xs text-stone-400 line-through">
                          {activeEvent.currency}
                          {adj.currentCost.toLocaleString()}
                        </span>
                        <span className="text-xs font-semibold text-stone-800 ml-1.5">
                          → {activeEvent.currency}
                          {adj.proposedCost.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Strategic Rationale Section */}
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Gemini Strategic Justification & Vendor Scripts
                </span>
              </div>
              {!aiRationale && (
                <button
                  type="button"
                  onClick={handleFetchAIRationale}
                  disabled={isLoadingAI}
                  className="rounded-lg bg-white border border-stone-300 px-3 py-1 text-xs font-medium text-stone-700 hover:bg-stone-100 transition shadow-xs"
                >
                  {isLoadingAI ? 'Analyzing...' : 'Generate AI Rationale'}
                </button>
              )}
            </div>

            {aiRationale ? (
              <div className="prose prose-xs text-stone-700 max-w-none text-xs leading-relaxed whitespace-pre-line bg-white rounded-lg p-3 border border-stone-200">
                {aiRationale}
              </div>
            ) : (
              <p className="text-xs text-stone-500">
                Click "Generate AI Rationale" for negotiation talking points and psychological vendor scripts to achieve these exact reduced rates.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-stone-200 bg-stone-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition"
          >
            Cancel & Keep As-Is
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={activeApproved.length === 0}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-700 to-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-500/20 hover:from-purple-800 hover:to-rose-700 transition disabled:opacity-50"
          >
            <CheckCircle className="h-4 w-4" />
            <span>
              Approve & Apply Reallocations (Save {activeEvent.currency}
              {currentApprovedSavings.toLocaleString()})
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
