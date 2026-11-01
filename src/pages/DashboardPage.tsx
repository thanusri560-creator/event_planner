import React from 'react';
import {
  Wallet,
  Clock,
  CheckCircle2,
  AlertTriangle,
  GitBranch,
  FlaskConical,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Calendar,
  Users,
  ShieldCheck,
  Building2,
  ChevronRight,
  Bot,
} from 'lucide-react';
import { EventPlan } from '../types';
import { calculateTotalEstimated, optimizeBudget } from '../logic/budgetOptimizer';
import { calculateSchedule } from '../logic/dependencyScheduler';

interface DashboardPageProps {
  activeEvent: EventPlan;
  onNavigateTab: (tab: string) => void;
  onOpenOptimizer: () => void;
  onOpenAICopilot: () => void;
  onTriggerScenario1: () => void;
  onTriggerScenario2: () => void;
  onTriggerScenario3: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  activeEvent,
  onNavigateTab,
  onOpenOptimizer,
  onOpenAICopilot,
  onTriggerScenario1,
  onTriggerScenario2,
  onTriggerScenario3,
}) => {
  const totalEstimated = calculateTotalEstimated(activeEvent.items);
  const overspend = Math.max(0, totalEstimated - activeEvent.totalBudget);
  const budgetUtilization = Math.round((totalEstimated / activeEvent.totalBudget) * 100);
  const budgetRemaining = activeEvent.totalBudget - totalEstimated;

  const schedule = calculateSchedule(activeEvent.tasks, activeEvent.eventDeadlineDays);
  const criticalTasks = schedule.tasks.filter((t) => t.isCriticalPath);
  const completedTasks = activeEvent.tasks.filter((t) => t.status === 'completed');
  const progressPercent = Math.round((completedTasks.length / activeEvent.tasks.length) * 100);

  const delayedTasks = schedule.tasks.filter((t) => (t.delayDays || 0) > 0);
  const conflictTasks = schedule.tasks.filter((t) => t.hasConflict);

  return (
    <div className="space-y-6">
      {/* Event Header Banner */}
      <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[11px] font-bold uppercase text-purple-800">
                {activeEvent.type.replace('_', ' ')}
              </span>
              <span className="text-xs text-stone-500">•</span>
              <span className="text-xs text-stone-600 flex items-center gap-1 font-medium">
                <Calendar className="h-3.5 w-3.5 text-stone-400" />
                Celebration Day in {activeEvent.eventDeadlineDays} Days
              </span>
              <span className="text-xs text-stone-500">•</span>
              <span className="text-xs text-stone-600 flex items-center gap-1 font-medium">
                <Users className="h-3.5 w-3.5 text-stone-400" />
                {activeEvent.guestCount} Guests Confirmed
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              {activeEvent.name}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Venue: <span className="font-medium text-stone-800">{activeEvent.location}</span> • Theme: <span className="font-medium text-purple-700">{activeEvent.theme}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {overspend > 0 ? (
              <button
                onClick={onOpenOptimizer}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition animate-pulse"
              >
                <AlertTriangle className="h-4 w-4" />
                <span>Resolve Overspend (+{activeEvent.currency}{overspend.toLocaleString()})</span>
              </button>
            ) : (
              <button
                onClick={onOpenOptimizer}
                className="flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 px-3.5 py-2 text-xs font-semibold text-stone-800 transition"
              >
                <Wallet className="h-4 w-4 text-purple-600" />
                <span>Optimize Allocations</span>
              </button>
            )}

            <button
              onClick={() => onNavigateTab('simulation')}
              className="flex items-center gap-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 px-4 py-2 text-xs font-semibold text-white shadow-sm transition"
            >
              <FlaskConical className="h-4 w-4" />
              <span>Simulate Stress Test</span>
            </button>
          </div>
        </div>
      </div>

      {/* Critical Warnings Banner if any */}
      {(overspend > 0 || conflictTasks.length > 0 || schedule.isDeadlineBreached) && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-rose-100 p-2 text-rose-700 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-rose-900">
                Action Required: Engine Constraint Alerts Detected
              </h3>
              <ul className="mt-1 space-y-1 text-xs text-rose-800 font-medium">
                {overspend > 0 && (
                  <li>
                    • <strong>Budget Deficit:</strong> Estimated expenses exceed your target budget by {activeEvent.currency}{overspend.toLocaleString()}. Click "Resolve Overspend" to run priority-aware optimization.
                  </li>
                )}
                {schedule.isDeadlineBreached && (
                  <li>
                    • <strong>Timeline Breach:</strong> The project schedule exceeds the event date by {schedule.daysOverdue} days! Critical path fast-tracking required.
                  </li>
                )}
                {conflictTasks.map((ct) => (
                  <li key={ct.id}>
                    • <strong>Conflict on "{ct.name}":</strong> {ct.conflictReason}
                  </li>
                ))}
              </ul>
            </div>
            {overspend > 0 && (
              <button
                onClick={onOpenOptimizer}
                className="rounded-lg bg-rose-700 hover:bg-rose-800 px-3 py-1.5 text-xs font-bold text-white shrink-0 shadow-xs"
              >
                Run Optimizer
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Budget Utilization */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Budget Utilization
            </span>
            <div
              className={`rounded-lg p-2 ${
                overspend > 0 ? 'bg-rose-100 text-rose-700' : 'bg-purple-100 text-purple-700'
              }`}
            >
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-stone-900">
              {budgetUtilization}%
            </span>
            <span className="text-xs text-stone-500">
              of {activeEvent.currency}{activeEvent.totalBudget.toLocaleString()}
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-2 w-full rounded-full bg-stone-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                overspend > 0 ? 'bg-rose-500' : 'bg-purple-600'
              }`}
              style={{ width: `${Math.min(100, budgetUtilization)}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-stone-500">
            <span>Est: {activeEvent.currency}{totalEstimated.toLocaleString()}</span>
            <span className={budgetRemaining < 0 ? 'text-rose-600 font-bold' : 'text-emerald-700 font-medium'}>
              {budgetRemaining < 0
                ? `Deficit ${activeEvent.currency}${Math.abs(budgetRemaining).toLocaleString()}`
                : `Rem: ${activeEvent.currency}${budgetRemaining.toLocaleString()}`}
            </span>
          </div>
        </div>

        {/* KPI 2: Critical Path Health */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Critical Path
            </span>
            <div className="rounded-lg bg-rose-100 p-2 text-rose-700">
              <GitBranch className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-stone-900">
              {criticalTasks.length}
            </span>
            <span className="text-xs text-stone-500">
              zero-slack tasks
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-stone-500">Project Span:</span>
            <span className="font-bold text-stone-800">
              {schedule.projectDurationDays} / {activeEvent.eventDeadlineDays} Days
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-stone-500">Slack Margin:</span>
            <span
              className={`font-bold ${
                schedule.daysOverdue > 0
                  ? 'text-rose-600'
                  : schedule.projectDurationDays === activeEvent.eventDeadlineDays
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}
            >
              {schedule.daysOverdue > 0
                ? `-${schedule.daysOverdue} Days (Overdue)`
                : `+${activeEvent.eventDeadlineDays - schedule.projectDurationDays} Days Buffer`}
            </span>
          </div>
        </div>

        {/* KPI 3: Task Execution Progress */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Task Execution
            </span>
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-stone-900">
              {progressPercent}%
            </span>
            <span className="text-xs text-stone-500">
              {completedTasks.length} of {activeEvent.tasks.length} done
            </span>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-stone-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-stone-500">
            <span>{activeEvent.tasks.filter((t) => t.status === 'in_progress').length} In Progress</span>
            <span>{delayedTasks.length} Delayed</span>
          </div>
        </div>

        {/* KPI 4: Vendor Lock-in */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Vendors Sourced
            </span>
            <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-stone-900">
              {activeEvent.vendors.filter((v) => v.status === 'confirmed').length} / {activeEvent.vendors.length}
            </span>
            <span className="text-xs text-stone-500">Confirmed</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-stone-500">Venue Capacity:</span>
            <span className="font-bold text-stone-800">
              220 Seats (for {activeEvent.guestCount} guests)
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-stone-500">Alt Backups:</span>
            <span className="font-semibold text-purple-700">3 Shortlisted</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column (Budget Breakdown + Critical Tasks), Right Column (AI Copilot + Interactive Simulation Quick Card) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols wide) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Category Allocations Chart / Progress */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-stone-900">
                  Category Allocation vs Estimated Expenditure
                </h2>
                <p className="text-xs text-stone-500">
                  Interconnected category balances with priority-level markers
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('budget')}
                className="flex items-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-900"
              >
                <span>Manage Budget</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-3.5">
              {activeEvent.categories.map((cat) => {
                const categoryItems = activeEvent.items.filter((i) => i.categoryId === cat.category);
                const est = categoryItems.reduce(
                  (sum, i) => sum + (i.actualCost ?? i.estimatedCost),
                  0
                );
                const pct = Math.round((est / cat.allocatedAmount) * 100);
                const isOver = est > cat.allocatedAmount;

                return (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-bold text-stone-900">{cat.label}</span>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[10px] font-semibold uppercase ${
                            cat.priority === 'high'
                              ? 'bg-purple-100 text-purple-800'
                              : cat.priority === 'medium'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {cat.priority}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold ${isOver ? 'text-rose-600' : 'text-stone-800'}`}>
                          {activeEvent.currency}{est.toLocaleString()}
                        </span>
                        <span className="text-stone-400 text-[11px] ml-1">
                          / {activeEvent.currency}{cat.allocatedAmount.toLocaleString()} ({pct}%)
                        </span>
                      </div>
                    </div>
                    {/* Bar */}
                    <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          backgroundColor: isOver ? '#ef4444' : cat.color,
                          width: `${Math.min(100, pct)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Critical Path Tasks Widget */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-stone-900">
                  Critical Path Tasks (Zero-Slack Dependencies)
                </h2>
                <p className="text-xs text-stone-500">
                  Any delay on these tasks directly postpones your Celebration Day!
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('timeline')}
                className="flex items-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-900"
              >
                <span>Full DAG Timeline</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {criticalTasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50/30 p-3 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                    <div>
                      <span className="font-bold text-stone-900">{task.name}</span>
                      <p className="text-[11px] text-stone-500">
                        Duration: {task.durationDays}d • Assigned to: {task.assignedPerson || 'Vendor Lead'} • Depends on: {task.dependencies.length ? task.dependencies.join(', ') : 'Root'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 uppercase">
                      Critical (0d Slack)
                    </span>
                    <span className="block text-[11px] text-stone-500 mt-0.5">
                      Days {task.earlyStart} → {task.earlyFinish}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: AI Insights & Quick Stress Simulation */}
        <div className="space-y-6">
          {/* AI Strategic Copilot Card */}
          <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 via-white to-purple-50/50 p-6 shadow-xs">
            <div className="flex items-center gap-2 text-purple-800 mb-2">
              <Bot className="h-5 w-5 text-purple-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider">
                AI Architect Intelligence
              </h3>
            </div>
            <p className="text-xs text-stone-700 leading-relaxed font-medium">
              "Your core hospitality pillars (Auditorium & Catering) are secured for 200 guests. Decoration stage trussing carries a flexible ₹32,000 quote that can absorb any surprise overrun without hurting guest perception."
            </p>

            <div className="mt-4 pt-4 border-t border-purple-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-600 font-semibold">Timeline Float:</span>
                <span className="text-emerald-700 font-bold">10 Days Safety Buffer</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-600 font-semibold">Vendor Sourcing:</span>
                <span className="text-purple-700 font-bold">6/6 Covered</span>
              </div>
            </div>

            <button
              onClick={onOpenAICopilot}
              className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-purple-700 hover:bg-purple-800 py-2.5 text-xs font-bold text-white shadow-sm transition"
            >
              <Sparkles className="h-4 w-4" />
              <span>Ask AI Copilot for Strategy</span>
            </button>
          </div>

          {/* Quick Guided Scenarios Widget */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
            <h3 className="text-sm font-bold text-stone-900 mb-2">
              Rapid Stress Test Sandbox
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Introduce unexpected celebration shifts and watch interconnected engines adapt:
            </p>

            <div className="space-y-2.5">
              <button
                onClick={onTriggerScenario1}
                className="w-full text-left rounded-xl border border-stone-200 p-3 hover:border-purple-300 hover:bg-purple-50/40 transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 group-hover:text-purple-800">
                    1. Trigger Budget Overrun (+₹30k)
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-stone-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Spikes decor/photo quotes to ₹2,30,000 and executes optimizer.
                </p>
              </button>

              <button
                onClick={onTriggerScenario2}
                className="w-full text-left rounded-xl border border-stone-200 p-3 hover:border-purple-300 hover:bg-purple-50/40 transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 group-hover:text-purple-800">
                    2. Delay Venue Booking (+3 Days)
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-stone-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Propagates DAG delay downstream to catering lock & rehearsals.
                </p>
              </button>

              <button
                onClick={onTriggerScenario3}
                className="w-full text-left rounded-xl border border-stone-200 p-3 hover:border-purple-300 hover:bg-purple-50/40 transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 group-hover:text-purple-800">
                    3. Stress Test (+50 Pax / -15% Budget)
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-stone-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Simulates double constraint shock with capacity and feasibility metrics.
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
