/**
 * @file TaskTableView.tsx
 * @description Accessible tabular view of DAG tasks with mathematical CPM float metrics,
 * status transitions, and duration crashing (fast-tracking).
 */

import React from 'react';
import { Task, TaskStatus, DAGScheduleResult } from '../../types';

interface TaskTableViewProps {
  scheduleResult: DAGScheduleResult;
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  onFastTrackTask: (taskId: string) => void;
}

export const TaskTableView: React.FC<TaskTableViewProps> = ({
  scheduleResult,
  onUpdateTaskStatus,
  onFastTrackTask,
}) => {
  return (
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
        <table className="w-full text-left text-xs" aria-label="Tasks and dependencies table">
          <thead className="border-b border-stone-200 bg-stone-50/70 text-stone-500 uppercase tracking-wider font-semibold">
            <tr>
              <th scope="col" className="py-3 px-3">Task Name</th>
              <th scope="col" className="py-3 px-2">Duration</th>
              <th scope="col" className="py-3 px-3">Predecessors</th>
              <th scope="col" className="py-3 px-2">Early (ES - EF)</th>
              <th scope="col" className="py-3 px-2">Late (LS - LF)</th>
              <th scope="col" className="py-3 px-2">Slack / Float</th>
              <th scope="col" className="py-3 px-3">Status</th>
              <th scope="col" className="py-3 px-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {scheduleResult.tasks.map((task: Task) => (
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
                    aria-label={`Update status for ${task.name}`}
                    onChange={(e) =>
                      onUpdateTaskStatus(task.id, e.target.value as TaskStatus)
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
                      onClick={() => onFastTrackTask(task.id)}
                      aria-label={`Fast track ${task.name} by 1 day`}
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
  );
};
