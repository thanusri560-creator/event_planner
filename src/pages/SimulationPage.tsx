import React, { useState } from 'react';
import {
  FlaskConical,
  Play,
  TrendingDown,
  Clock,
  Users,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  Layers,
  ArrowRight,
  History,
  Bot,
  Sliders,
  DollarSign,
  Building2,
} from 'lucide-react';
import {
  EventPlan,
  SimulationScenario,
  SimulationResult,
  ScenarioType,
} from '../types';
import { simulateScenario, commitSimulationToEvent } from '../logic/scenarioSimulator';
import { fetchStressSimulationAnalysis } from '../logic/geminiService';
import confetti from 'canvas-confetti';

interface SimulationPageProps {
  activeEvent: EventPlan;
  onUpdateEvent: (updated: EventPlan) => void;
  onResetDemo: () => void;
}

export const SimulationPage: React.FC<SimulationPageProps> = ({
  activeEvent,
  onUpdateEvent,
  onResetDemo,
}) => {
  // Preset scenarios
  const presetScenarios: SimulationScenario[] = [
    {
      id: 'sc-demo-combined',
      name: 'Demonstration Stress Test: +50 Pax & -15% Budget',
      description: 'Official Challenge 5 Scenario 3: Increases guest count to 250 and simultaneously cuts budget by 15% to ₹1,70,000.',
      type: 'guest_surge',
      guestDelta: 50,
      budgetPercentDelta: -15,
      budgetAbsoluteDelta: 0,
      eventDeadlineDaysDelta: 0,
    },
    {
      id: 'sc-guest-surge',
      name: 'Guest Count Surge (+50 Guests)',
      description: 'Increases attendance from 200 to 250 guests. Tests venue capacity limits and catering per-plate scaling.',
      type: 'guest_surge',
      guestDelta: 50,
      budgetPercentDelta: 0,
      budgetAbsoluteDelta: 0,
      eventDeadlineDaysDelta: 0,
    },
    {
      id: 'sc-budget-cut',
      name: 'Budget Slash (-15% Emergency Contraction)',
      description: 'Slashes budget by 15% (₹30,000 cut) due to sponsor pullout. Tests how low/medium priority items absorb the cut.',
      type: 'budget_cut',
      guestDelta: 0,
      budgetPercentDelta: -15,
      budgetAbsoluteDelta: 0,
      eventDeadlineDaysDelta: 0,
    },
    {
      id: 'sc-vendor-cancel',
      name: 'Lead Catering Vendor Cancellation',
      description: 'Lead caterer pulls out 14 days before celebration. Marks tasks blocked and introduces a 4-day emergency replacement buffer.',
      type: 'vendor_cancel',
      guestDelta: 0,
      budgetPercentDelta: 0,
      budgetAbsoluteDelta: 0,
      eventDeadlineDaysDelta: 0,
      cancelledVendorId: 'vendor-cater-1',
    },
    {
      id: 'sc-date-compression',
      name: 'Event Date Pulled Forward (-5 Days)',
      description: 'University senate reschedules the event 5 days earlier (Day 25 instead of Day 30). Tests critical-path compression.',
      type: 'date_shift',
      guestDelta: 0,
      budgetPercentDelta: 0,
      budgetAbsoluteDelta: 0,
      eventDeadlineDaysDelta: -5,
    },
    {
      id: 'sc-venue-change',
      name: 'Relocate to Symphony Open Lawn (350 Cap)',
      description: 'Swaps auditorium for the outdoor convention lawn to alleviate seating congestion with a revised tariff.',
      type: 'venue_change',
      guestDelta: 30,
      budgetPercentDelta: 0,
      budgetAbsoluteDelta: 7000,
      eventDeadlineDaysDelta: 0,
      newVenueCapacity: 350,
    },
  ];

  // Selected scenario state
  const [selectedScenario, setSelectedScenario] = useState<SimulationScenario>(presetScenarios[0]);
  const [currentResult, setCurrentResult] = useState<SimulationResult | null>(() =>
    simulateScenario(activeEvent, presetScenarios[0])
  );

  // Custom scenario sliders
  const [customGuestDelta, setCustomGuestDelta] = useState<number>(0);
  const [customBudgetPercent, setCustomBudgetPercent] = useState<number>(0);
  const [customDaysDelta, setCustomDaysDelta] = useState<number>(0);
  const [customVendorCancel, setCustomVendorCancel] = useState<boolean>(false);

  // AI analysis state
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // Run simulation
  const handleRunSimulation = (scenario: SimulationScenario) => {
    setSelectedScenario(scenario);
    const result = simulateScenario(activeEvent, scenario);
    setCurrentResult(result);
    setAiAnalysis(null);
  };

  // Run custom scenario
  const handleRunCustomSimulation = () => {
    const customSc: SimulationScenario = {
      id: `custom-${Date.now()}`,
      name: `Custom Multi-Constraint Scenario`,
      description: `Guests: ${customGuestDelta > 0 ? '+' : ''}${customGuestDelta}, Budget: ${customBudgetPercent}%, Date: ${customDaysDelta}d`,
      type: 'custom',
      guestDelta: customGuestDelta,
      budgetPercentDelta: customBudgetPercent,
      budgetAbsoluteDelta: 0,
      eventDeadlineDaysDelta: customDaysDelta,
      cancelledVendorId: customVendorCancel ? 'vendor-cater-1' : undefined,
    };
    handleRunSimulation(customSc);
  };

  // Fetch AI deep analysis
  const handleFetchAIAnalysis = async () => {
    if (!currentResult) return;
    setIsLoadingAI(true);
    try {
      const res = await fetchStressSimulationAnalysis(activeEvent, selectedScenario, currentResult);
      setAiAnalysis(res.analysis);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Commit scenario to active event
  const handleCommitScenario = () => {
    if (!currentResult) return;
    const committedEvent = commitSimulationToEvent(activeEvent, selectedScenario);
    onUpdateEvent(committedEvent);
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-stone-900 tracking-tight">
                Mid-Flight What-If Stress Simulation Lab
              </h1>
              <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-800">
                Multi-Variable Sandbox
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Safely inject chaotic real-world changes (guest surges, budget slashes, vendor cancellations) to test plan elasticity and formulate recovery paths.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 px-3.5 py-2 text-xs font-semibold text-stone-700 transition"
            >
              <History className="h-4 w-4" />
              <span>Simulation History ({activeEvent.simulationHistory.length})</span>
            </button>
          </div>
        </div>

        {/* Preset Scenarios Selector Chips */}
        <div className="mt-5">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-2">
            Select Pre-Configured Stress Scenario:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {presetScenarios.map((sc) => {
              const isSelected = selectedScenario.id === sc.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => handleRunSimulation(sc)}
                  className={`text-left rounded-xl border p-3 transition text-xs ${
                    isSelected
                      ? 'border-purple-600 bg-purple-50/70 ring-1 ring-purple-500'
                      : 'border-stone-200 bg-stone-50/50 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-stone-900">
                    <span className="truncate pr-1">{sc.name}</span>
                    <Play className={`h-3 w-3 shrink-0 ${isSelected ? 'fill-purple-600 text-purple-600' : 'text-stone-400'}`} />
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1 line-clamp-2">
                    {sc.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Custom Scenario Builder Toggle */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
        <h2 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
          <Sliders className="h-4 w-4 text-purple-600" />
          <span>Or Build a Custom Stress Test (Sliders):</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="font-semibold text-stone-700 block mb-1">
              Guest Count Shift: <span className="font-bold text-purple-700">{customGuestDelta > 0 ? `+${customGuestDelta}` : customGuestDelta} guests</span>
            </label>
            <input
              type="range"
              min="-50"
              max="100"
              step="10"
              value={customGuestDelta}
              onChange={(e) => setCustomGuestDelta(parseInt(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-700 block mb-1">
              Budget Delta: <span className="font-bold text-purple-700">{customBudgetPercent}%</span>
            </label>
            <input
              type="range"
              min="-40"
              max="20"
              step="5"
              value={customBudgetPercent}
              onChange={(e) => setCustomBudgetPercent(parseInt(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-700 block mb-1">
              Date Shift: <span className="font-bold text-purple-700">{customDaysDelta} days</span>
            </label>
            <input
              type="range"
              min="-10"
              max="10"
              step="1"
              value={customDaysDelta}
              onChange={(e) => setCustomDaysDelta(parseInt(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>

          <div className="flex flex-col justify-between">
            <label className="font-semibold text-stone-700 block mb-1">
              Simulate Vendor Drop:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="cancelVendorCheck"
                checked={customVendorCancel}
                onChange={(e) => setCustomVendorCancel(e.target.checked)}
                className="h-4 w-4 rounded border-stone-300 text-purple-600 cursor-pointer"
              />
              <label htmlFor="cancelVendorCheck" className="text-stone-700 cursor-pointer">
                Cancel Lead Caterer
              </label>
            </div>
            <button
              onClick={handleRunCustomSimulation}
              className="mt-2 w-full rounded-xl bg-stone-900 hover:bg-stone-800 text-white py-1.5 font-bold shadow-xs transition"
            >
              Simulate Custom Stress
            </button>
          </div>
        </div>
      </div>

      {/* Main Simulation Results & Diff View */}
      {currentResult && (
        <div className="space-y-6">
          {/* Feasibility Score Banner */}
          <div
            className={`rounded-2xl border p-6 transition shadow-xs ${
              currentResult.feasibilityStatus === 'feasible'
                ? 'bg-emerald-50/70 border-emerald-200'
                : currentResult.feasibilityStatus === 'at_risk'
                ? 'bg-amber-50/70 border-amber-200'
                : 'bg-rose-50/70 border-rose-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl font-black text-2xl shadow-sm ${
                    currentResult.feasibilityStatus === 'feasible'
                      ? 'bg-emerald-600 text-white'
                      : currentResult.feasibilityStatus === 'at_risk'
                      ? 'bg-amber-500 text-white'
                      : 'bg-rose-600 text-white animate-pulse'
                  }`}
                >
                  {currentResult.feasibilityScore}%
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
                      Composite Feasibility Status
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                        currentResult.feasibilityStatus === 'feasible'
                          ? 'bg-emerald-100 text-emerald-800'
                          : currentResult.feasibilityStatus === 'at_risk'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {currentResult.feasibilityStatus.replace('_', ' ')}
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-stone-900 mt-0.5">
                    {currentResult.scenarioName}
                  </h2>
                  <p className="text-xs text-stone-600 mt-0.5">
                    {currentResult.scenarioDescription}
                  </p>
                </div>
              </div>

              {/* Commit Scenario CTA */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCommitScenario}
                  className="rounded-xl bg-purple-700 hover:bg-purple-800 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition"
                >
                  Apply This Scenario to Live Plan
                </button>
              </div>
            </div>
          </div>

          {/* Before vs After Comparison Matrix */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-4">
              Before vs After Multi-Dimensional Comparison
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-stone-200 bg-stone-50/70 text-stone-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Metric</th>
                    <th className="py-3 px-4">Baseline Plan (Before)</th>
                    <th className="py-3 px-4">Simulated Reality (After)</th>
                    <th className="py-3 px-4">Variance / Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  <tr>
                    <td className="py-3 px-4 font-bold text-stone-900">Total Budget Ceiling</td>
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
                    <td className="py-3 px-4 font-bold text-stone-900">Projected Expenses</td>
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
                    <td className="py-3 px-4 font-bold text-stone-900">Guest Headcount</td>
                    <td className="py-3 px-4 font-mono">{currentResult.before.guestCount} Pax</td>
                    <td className="py-3 px-4 font-mono font-bold">{currentResult.after.guestCount} Pax</td>
                    <td className="py-3 px-4 font-bold text-stone-700">
                      {currentResult.after.guestCount - currentResult.before.guestCount !== 0
                        ? `${currentResult.after.guestCount - currentResult.before.guestCount > 0 ? '+' : ''}${currentResult.after.guestCount - currentResult.before.guestCount} Guests`
                        : '0'}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-4 font-bold text-stone-900">Venue Seating Headroom</td>
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
                    <td className="py-3 px-4 font-bold text-stone-900">Project Duration & Deadline</td>
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

          {/* Actionable Recovery Plan */}
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
              {currentResult.recoveryPlan.map((step) => (
                <div
                  key={step.stepNumber}
                  className="flex items-start justify-between rounded-xl border border-stone-200 bg-stone-50 p-4 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-700 text-white font-bold shrink-0">
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

          {/* Gemini AI Strategic Analysis Box */}
          <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 via-white to-purple-50/50 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-purple-600" />
                <h3 className="text-sm font-bold text-purple-950 uppercase tracking-wider">
                  Gemini Deep Operational Stress Analysis
                </h3>
              </div>

              {!aiAnalysis && (
                <button
                  onClick={handleFetchAIAnalysis}
                  disabled={isLoadingAI}
                  className="rounded-xl bg-purple-700 hover:bg-purple-800 px-3.5 py-1.5 text-xs font-bold text-white transition shadow-xs"
                >
                  {isLoadingAI ? 'Reasoning with Gemini...' : 'Generate Qualitative AI Assessment'}
                </button>
              )}
            </div>

            {aiAnalysis ? (
              <div className="rounded-xl border border-purple-100 bg-white p-4 text-xs leading-relaxed text-stone-800 whitespace-pre-line shadow-xs">
                {aiAnalysis}
              </div>
            ) : (
              <p className="text-xs text-stone-500">
                Click above to generate deep qualitative insights on crowd psychology, vendor negotiation leverage, and fast-track timeline tactics.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
