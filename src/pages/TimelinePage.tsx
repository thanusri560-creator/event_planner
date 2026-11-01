/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file TimelinePage.tsx
 * @description Dependency-Aware Timeline page orchestrating DAG scheduling,
 * interactive delay propagation simulations, and responsive sub-views (Gantt, Table, Chain).
 */

import React, { useState, useMemo } from 'react';
import {
  Clock,
  Zap,
} from 'lucide-react';
import { EventPlan, TaskStatus } from '../types';
import { calculateSchedule, applyTaskDelay } from '../logic/dependencyScheduler';
import { useDebounce } from '../hooks/useDebounce';
import { GanttChartView } from '../components/timeline/GanttChartView';
import { TaskTableView } from '../components/timeline/TaskTableView';
import { DependencyChainView } from '../components/timeline/DependencyChainView';

interface TimelinePageProps {
  activeEvent: EventPlan;
  onUpdateEvent: (updated: EventPlan) => void;
  onTriggerScenario2: () => void;
}

export const TimelinePage: React.FC<TimelinePageProps> = ({
  activeEvent,
  onUpdateEvent,
  onTriggerScenario2,
}) => {
  const [selectedTaskForDelay, setSelectedTaskForDelay] = useState<string>('task-venue-book');
  const [delaySliderDays, setDelaySliderDays] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'gantt' | 'table' | 'network'>('gantt');

  // Debounced slider state for smooth performance
  const debouncedDelayDays = useDebounce(delaySliderDays, 150);

  // Memoize DAG schedule computation
  const scheduleResult = useMemo(() => {
    return calculateSchedule(activeEvent.tasks, activeEvent.eventDeadlineDays);
  }, [activeEvent.tasks, activeEvent.eventDeadlineDays]);

  const handleUpdateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    const updatedTasks = activeEvent.tasks.map((t) =>
      t.id === taskId ? { ...t, status: newStatus } : t
    );
    const recalculated = calculateSchedule(updatedTasks, activeEvent.eventDeadlineDays);
    onUpdateEvent({
      ...activeEvent,
      tasks: recalculated.tasks,
    });
  };

  const handleApplyCustomDelay = (taskId: string, delayDays: number) => {
    const recalculated = applyTaskDelay(
      activeEvent.tasks,
      taskId,
      delayDays,
      activeEvent.eventDeadlineDays
    );
    onUpdateEvent({
      ...activeEvent,
      tasks: recalculated.tasks,
    });
  };

  const handleFastTrackTask = (taskId: string) => {
    // Crash duration by 1 day if > 1 day
    const updatedTasks = activeEvent.tasks.map((t) => {
      if (t.id === taskId && t.durationDays > 1) {
        return { ...t, durationDays: t.durationDays - 1 };
      }
      return t;
    });
    const recalculated = calculateSchedule(updatedTasks, activeEvent.eventDeadlineDays);
    onUpdateEvent({
      ...activeEvent,
      tasks: recalculated.tasks,
    });
  };

  const venueTask = activeEvent.tasks.find((t) => t.id === 'task-venue-book');
  const isVenueDelayed = (venueTask?.delayDays || 0) > 0;

  return (
    <div className="space-y-6">
      {/* Header & Status Card */}
      <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-stone-900 tracking-tight">
                Dependency-Aware DAG Timeline Engine
              </h1>
              <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800">
                Critical Path Method (CPM)
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Topological sorting, early/late start calculations, dynamic delay propagation, and event-day conflict detection.
            </p>
          </div>

          {/* Quick Scenario 2 trigger button */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onTriggerScenario2}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-sm ${
                isVenueDelayed
                  ? 'bg-rose-100 text-rose-900 border border-rose-300'
                  : 'bg-gradient-to-r from-rose-600 to-purple-700 hover:from-rose-700 hover:to-purple-800 text-white'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>
                {isVenueDelayed
                  ? `Scenario 2 Active: Venue Delayed ${venueTask?.delayDays}d`
                  : 'Trigger Scenario 2: +3d Venue Delay'}
              </span>
            </button>

            {isVenueDelayed && (
              <button
                onClick={() => handleApplyCustomDelay('task-venue-book', 0)}
                className="rounded-xl border border-stone-300 bg-white hover:bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-700"
                title="Reset venue delay"
              >
                Reset Delay
              </button>
            )}
          </div>
        </div>

        {/* Schedule Health Indicators */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="rounded-xl bg-stone-50 p-3.5 border border-stone-200">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
              Event Celebration Day
            </span>
            <span className="text-xl font-bold text-stone-900">
              Day {activeEvent.eventDeadlineDays}
            </span>
            <span className="text-[11px] text-stone-500 block mt-0.5">
              Fixed hard milestone
            </span>
          </div>

          <div className="rounded-xl bg-stone-50 p-3.5 border border-stone-200">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
              Project Duration
            </span>
            <span
              className={`text-xl font-bold ${
                scheduleResult.isDeadlineBreached ? 'text-rose-600' : 'text-stone-900'
              }`}
            >
              {scheduleResult.projectDurationDays} Days
            </span>
            <span className="text-[11px] text-stone-500 block mt-0.5">
              {scheduleResult.projectDurationDays <= activeEvent.eventDeadlineDays
                ? `${activeEvent.eventDeadlineDays - scheduleResult.projectDurationDays} days float buffer`
                : `${scheduleResult.daysOverdue} days overdue!`}
            </span>
          </div>

          <div className="rounded-xl bg-stone-50 p-3.5 border border-stone-200">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
              Critical Path Tasks
            </span>
            <span className="text-xl font-bold text-rose-600">
              {scheduleResult.criticalPathTaskIds.length} Tasks
            </span>
            <span className="text-[11px] text-stone-500 block mt-0.5">
              Zero-slack chain
            </span>
          </div>

          <div
            className={`rounded-xl p-3.5 border ${
              scheduleResult.isDeadlineBreached
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            <span className="text-[11px] font-semibold uppercase tracking-wider block">
              Schedule Feasibility
            </span>
            <span className="text-xl font-bold">
              {scheduleResult.isDeadlineBreached ? 'Deadline Conflict' : 'On Schedule'}
            </span>
            <span className="text-[11px] block mt-0.5 opacity-80">
              {scheduleResult.isDeadlineBreached
                ? `Exceeds event date by ${scheduleResult.daysOverdue}d`
                : 'All dependencies cleared'}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Delay Simulator Widget */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-purple-100 p-2 text-purple-700">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900">
                Interactive Delay Propagation Simulator
              </h2>
              <p className="text-xs text-stone-500">
                Inject custom delays on any upstream task to observe the mathematical downstream cascade
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex items-center gap-1 rounded-xl bg-stone-100 p-1 border border-stone-200 text-xs">
              <button
                onClick={() => setViewMode('gantt')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  viewMode === 'gantt' ? 'bg-white shadow-xs text-purple-900' : 'text-stone-600'
                }`}
              >
                Gantt Timeline
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  viewMode === 'table' ? 'bg-white shadow-xs text-purple-900' : 'text-stone-600'
                }`}
              >
                Task DAG Table
              </button>
              <button
                onClick={() => setViewMode('network')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  viewMode === 'network' ? 'bg-white shadow-xs text-purple-900' : 'text-stone-600'
                }`}
              >
                Dependency Chains
              </button>
            </div>
          </div>
        </div>

        {/* Delay Control Row */}
        <div className="flex flex-wrap items-center gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="selectTaskDelay" className="font-semibold text-stone-700 block mb-1">
              Select Upstream Task to Delay:
            </label>
            <select
              id="selectTaskDelay"
              value={selectedTaskForDelay}
              onChange={(e) => setSelectedTaskForDelay(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 font-medium text-stone-800"
            >
              {activeEvent.tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (Duration: {t.durationDays}d, Current Delay: {t.delayDays}d)
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[220px]">
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="timelineDelaySlider" className="font-semibold text-stone-700">
                Injected Delay: <span className="text-purple-700 font-bold">+{delaySliderDays} Days</span>
              </label>
            </div>
            <input
              id="timelineDelaySlider"
              type="range"
              min="0"
              max="10"
              value={delaySliderDays}
              aria-label="Injected task delay days slider"
              aria-valuemin={0}
              aria-valuemax={10}
              aria-valuenow={delaySliderDays}
              onChange={(e) => setDelaySliderDays(parseInt(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
            >
            </input>
          </div>

          <div className="flex items-end gap-2 pt-4 sm:pt-0">
            <button
              onClick={() => handleApplyCustomDelay(selectedTaskForDelay, delaySliderDays)}
              className="rounded-xl bg-purple-700 hover:bg-purple-800 px-4 py-2 font-bold text-white shadow-xs transition"
            >
              Apply Delay & Recalculate DAG
            </button>
            <button
              onClick={() => {
                setDelaySliderDays(0);
                handleApplyCustomDelay(selectedTaskForDelay, 0);
              }}
              className="rounded-xl border border-stone-300 bg-white hover:bg-stone-100 px-3 py-2 font-semibold text-stone-700 transition"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Sub-view renders */}
      {viewMode === 'gantt' && (
        <GanttChartView
          scheduleResult={scheduleResult}
          eventDeadlineDays={activeEvent.eventDeadlineDays}
        />
      )}

      {viewMode === 'table' && (
        <TaskTableView
          scheduleResult={scheduleResult}
          onUpdateTaskStatus={handleUpdateTaskStatus}
          onFastTrackTask={handleFastTrackTask}
        />
      )}

      {viewMode === 'network' && (
        <DependencyChainView tasks={scheduleResult.tasks} />
      )}
    </div>
  );
};
