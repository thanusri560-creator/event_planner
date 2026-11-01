/**
 * @file GanttChartView.tsx
 * @description Interactive visual Gantt timeline chart representing Early Start to Early Finish
 * with critical path zero-slack highlights and deadline indicators.
 */

import React from 'react';
import { Task, DAGScheduleResult } from '../../types';

interface GanttChartViewProps {
  scheduleResult: DAGScheduleResult;
  eventDeadlineDays: number;
}

export const GanttChartView: React.FC<GanttChartViewProps> = ({
  scheduleResult,
  eventDeadlineDays,
}) => {
  const maxDays = Math.max(eventDeadlineDays, scheduleResult.projectDurationDays);

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-stone-900">
            Interactive Gantt Schedule View
          </h2>
          <p className="text-xs text-stone-500">
            Visualizing Early Start to Early Finish across the {eventDeadlineDays}-day timeline. Red indicates the zero-slack Critical Path.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-rose-500" aria-hidden="true" />
            <span className="text-stone-700 font-medium">Critical Path (0 Slack)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-purple-500" aria-hidden="true" />
            <span className="text-stone-700 font-medium">Flexible Tasks (Has Float)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-amber-400" aria-hidden="true" />
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
            {scheduleResult.tasks.map((task: Task) => {
              const startPct = (task.earlyStart / maxDays) * 100;
              const durationPct = (task.durationDays / maxDays) * 100;
              const isCritical = task.isCriticalPath;
              const isDelayed = (task.delayDays || 0) > 0;

              return (
                <div
                  key={task.id}
                  className="grid grid-cols-12 items-center text-xs py-1 hover:bg-stone-50 rounded-lg px-1 transition"
                >
                  {/* Left: Task Name & Badges */}
                  <div className="col-span-4 pr-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-2 w-2 rounded-full shrink-0 ${
                          isCritical ? 'bg-rose-500' : 'bg-purple-500'
                        }`}
                        aria-hidden="true"
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
                    {/* Event Day line marker */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-rose-400 z-10"
                      style={{ left: `${(eventDeadlineDays / maxDays) * 100}%` }}
                      title={`Event Celebration Day Deadline (Day ${eventDeadlineDays})`}
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
  );
};
