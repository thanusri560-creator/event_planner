import React, { useState } from 'react';
import {
  GitBranch,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  Play,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { EventPlan, Task, TaskStatus } from '../types';
import { calculateSchedule, applyTaskDelay, formatDayOffset } from '../logic/dependencyScheduler';

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

  // Compute live DAG schedule
  const scheduleResult = calculateSchedule(activeEvent.tasks, activeEvent.eventDeadlineDays);

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
            <label className="font-semibold text-stone-700 block mb-1">
              Select Upstream Task to Delay:
            </label>
            <select
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
              <label className="font-semibold text-stone-700">
                Injected Delay: <span className="text-purple-700 font-bold">+{delaySliderDays} Days</span>
              </label>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={delaySliderDays}
              onChange={(e) => setDelaySliderDays(parseInt(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
            />
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

      {/* VIEW 1: Visual Gantt Schedule Timeline */}
      {viewMode === 'gantt' && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Interactive Gantt Schedule View
              </h2>
              <p className="text-xs text-stone-500">
                Visualizing Early Start to Early Finish across the 30-day timeline. Red indicates the zero-slack Critical Path.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-rose-500" />
                <span className="text-stone-700 font-medium">Critical Path (0 Slack)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-purple-500" />
                <span className="text-stone-700 font-medium">Flexible Tasks (Has Float)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-amber-400" />
                <span className="text-stone-700 font-medium">Delayed</span>
              </div>
            </div>
          </div>

          {/* Timeline Grid Header */}
          <div className="overflow-x-auto">
            <div className="min-w-[750px]">
              {/* Day numbers ruler */}
              <div className="grid grid-cols-12 text-[10px] text-stone-400 font-mono border-b border-stone-200 pb-2 mb-2">
                <div className="col-span-4 font-bold text-stone-700">Task Details & Duration</div>
                <div className="col-span-8 grid grid-cols-6 text-center">
                  <span>Day 0-5</span>
                  <span>Day 6-10</span>
                  <span>Day 11-15</span>
                  <span>Day 16-20</span>
                  <span>Day 21-25</span>
                  <span className="text-rose-600 font-bold">Day 26-30 (Event)</span>
                </div>
              </div>

              {/* Task Bars */}
              <div className="space-y-2.5">
                {scheduleResult.tasks.map((task) => {
                  const maxDays = Math.max(30, scheduleResult.projectDurationDays);
                  const startPct = (task.earlyStart / maxDays) * 100;
                  const durationPct = (task.durationDays / maxDays) * 100;
                  const isCritical = task.isCriticalPath;
                  const isDelayed = (task.delayDays || 0) > 0;

                  return (
                    <div key={task.id} className="grid grid-cols-12 items-center text-xs py-1 hover:bg-stone-50 rounded-lg px-1 transition">
                      {/* Left: Task Name & Badges */}
                      <div className="col-span-4 pr-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`h-2 w-2 rounded-full shrink-0 ${
                              isCritical ? 'bg-rose-500' : 'bg-purple-500'
                            }`}
                          />
                          <span className="font-bold text-stone-900 truncate">
                            {task.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-stone-500 mt-0.5">
                          <span>{task.durationDays}d</span>
                          <span>•</span>
                          <span>Slack: {task.slack}d</span>
                          {isDelayed && (
                            <span className="text-amber-700 font-bold bg-amber-100 px-1 rounded">
                              +{task.delayDays}d delayed
                            </span>
                          )}
                          {task.hasConflict && (
                            <span className="text-rose-700 font-bold bg-rose-100 px-1 rounded">
                              Conflict!
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Gantt bar canvas */}
                      <div className="col-span-8 relative h-7 bg-stone-100/70 rounded-lg overflow-hidden border border-stone-200/50">
                        {/* Event Day line marker at 30 */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-rose-400 z-10"
                          style={{ left: `${(30 / maxDays) * 100}%` }}
                          title="Event Celebration Day Deadline (Day 30)"
                        />

                        {/* Bar */}
                        <div
                          className={`absolute top-1 bottom-1 rounded-md text-[10px] font-bold text-white flex items-center justify-between px-2 shadow-xs transition-all ${
                            task.hasConflict
                              ? 'bg-rose-600 animate-pulse'
                              : isCritical
                              ? 'bg-gradient-to-r from-rose-500 to-rose-600'
                              : isDelayed
                              ? 'bg-gradient-to-r from-amber-500 to-purple-600'
                              : 'bg-gradient-to-r from-purple-600 to-indigo-600'
                          }`}
                          style={{
                            left: `${startPct}%`,
                            width: `${Math.max(4, durationPct)}%`,
                          }}
                        >
                          <span className="truncate">Day {task.earlyStart}</span>
                          <span className="truncate">Day {task.earlyFinish}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Detailed Task Table */}
      {viewMode === 'table' && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Detailed DAG Schedule Metrics & Float
              </h2>
              <p className="text-xs text-stone-500">
                Mathematical Early/Late starts, predecessors, and slack computed via CPM algorithms
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-stone-200 bg-stone-50/70 text-stone-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-3">Task Name</th>
                  <th className="py-3 px-2">Duration</th>
                  <th className="py-3 px-3">Predecessors</th>
                  <th className="py-3 px-2">Early (ES - EF)</th>
                  <th className="py-3 px-2">Late (LS - LF)</th>
                  <th className="py-3 px-2">Slack / Float</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {scheduleResult.tasks.map((task) => (
                  <tr
                    key={task.id}
                    className={`hover:bg-stone-50/70 transition ${
                      task.isCriticalPath ? 'bg-rose-50/30 font-medium' : ''
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        {task.isCriticalPath && (
                          <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-800 uppercase">
                            Critical
                          </span>
                        )}
                        <span className="font-bold text-stone-900">{task.name}</span>
                      </div>
                      {task.conflictReason && (
                        <p className="text-[11px] text-rose-600 mt-0.5">{task.conflictReason}</p>
                      )}
                    </td>
                    <td className="py-3 px-2 font-mono text-stone-700">
                      {task.durationDays}d
                      {task.delayDays > 0 && (
                        <span className="text-amber-700 font-bold ml-1">
                          (+{task.delayDays}d)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-stone-500 text-[11px]">
                      {task.dependencies.length > 0 ? (
                        <span className="font-mono text-purple-700">
                          {task.dependencies.join(', ')}
                        </span>
                      ) : (
                        <span className="italic text-stone-400">None (Root)</span>
                      )}
                    </td>
                    <td className="py-3 px-2 font-mono text-stone-700">
                      Day {task.earlyStart} → {task.earlyFinish}
                    </td>
                    <td className="py-3 px-2 font-mono text-stone-700">
                      Day {task.lateStart} → {task.lateFinish}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`font-mono font-bold ${
                          task.slack <= 0 ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        {task.slack} Days
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={task.status}
                        onChange={(e) =>
                          handleUpdateTaskStatus(task.id, e.target.value as TaskStatus)
                        }
                        className="rounded border border-stone-200 px-2 py-0.5 text-xs font-semibold text-stone-800"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="delayed">Delayed</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </td>
                    <td className="py-3 px-2 text-right">
                      {task.isCriticalPath && task.durationDays > 1 && (
                        <button
                          onClick={() => handleFastTrackTask(task.id)}
                          className="rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2 py-1 text-[11px] font-semibold transition"
                          title="Fast-track by adding crew to reduce duration 1 day"
                        >
                          Fast-Track (-1d)
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: Dependency Chains & Interconnected Flow */}
      {viewMode === 'network' && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-stone-900">
              Interconnected Dependency Chains
            </h2>
            <p className="text-xs text-stone-500">
              As specified in the Challenge 5 specification: venue confirmation triggers decoration and catering; guest invitations trigger RSVP, headcount, and food prep.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Chain 1: Venue to Decoration & Catering */}
            <div className="rounded-2xl border border-purple-200 bg-purple-50/40 p-4 space-y-3">
              <span className="font-bold text-purple-900 text-sm block">
                Chain 1: Venue Anchor & Downstream Setup
              </span>
              <div className="flex flex-col space-y-2">
                <div className="rounded-xl border border-purple-300 bg-white p-3 font-semibold text-stone-800 flex items-center justify-between">
                  <span>Venue Booking & Campus Signoff</span>
                  <span className="text-xs text-purple-700 font-bold">Day 0-3</span>
                </div>
                <div className="flex justify-center text-purple-400">
                  <ArrowRight className="h-4 w-4 rotate-90" />
                </div>
                <div className="rounded-xl border border-purple-300 bg-white p-3 font-semibold text-stone-800 flex items-center justify-between">
                  <span>Stage Layout & Blueprint</span>
                  <span className="text-xs text-purple-700 font-bold">Day 3-5</span>
                </div>
                <div className="flex justify-center text-purple-400">
                  <ArrowRight className="h-4 w-4 rotate-90" />
                </div>
                <div className="rounded-xl border border-purple-300 bg-white p-3 font-semibold text-stone-800 flex items-center justify-between">
                  <span>Decoration Planning → Decoration Setup</span>
                  <span className="text-xs text-purple-700 font-bold">Day 5-11</span>
                </div>
              </div>
            </div>

            {/* Chain 2: Invitations to Catering Confirm */}
            <div className="rounded-2xl border border-orange-200 bg-orange-50/40 p-4 space-y-3">
              <span className="font-bold text-orange-900 text-sm block">
                Chain 2: Guest Count to Catering Lock
              </span>
              <div className="flex flex-col space-y-2">
                <div className="rounded-xl border border-orange-300 bg-white p-3 font-semibold text-stone-800 flex items-center justify-between">
                  <span>Guest Invitations & Digital Portal</span>
                  <span className="text-xs text-orange-700 font-bold">Day 0-4</span>
                </div>
                <div className="flex justify-center text-orange-400">
                  <ArrowRight className="h-4 w-4 rotate-90" />
                </div>
                <div className="rounded-xl border border-orange-300 bg-white p-3 font-semibold text-stone-800 flex items-center justify-between">
                  <span>RSVP Collection (8 Days) → Final Count</span>
                  <span className="text-xs text-orange-700 font-bold">Day 4-14</span>
                </div>
                <div className="flex justify-center text-orange-400">
                  <ArrowRight className="h-4 w-4 rotate-90" />
                </div>
                <div className="rounded-xl border border-orange-300 bg-white p-3 font-semibold text-stone-800 flex items-center justify-between">
                  <span>Catering Confirmation → Food Prep Staging</span>
                  <span className="text-xs text-orange-700 font-bold">Day 14-19</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
