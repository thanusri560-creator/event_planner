import React from 'react';
import { Play, AlertTriangle, Clock, Activity, RotateCcw, Sparkles } from 'lucide-react';
import { EventPlan } from '../types';

interface DemoScenarioBannerProps {
  activeEvent: EventPlan;
  onTriggerScenario1_BudgetOverrun: () => void;
  onTriggerScenario2_VenueDelay: () => void;
  onTriggerScenario3_StressTest: () => void;
  onResetDemo: () => void;
}

export const DemoScenarioBanner: React.FC<DemoScenarioBannerProps> = ({
  activeEvent,
  onTriggerScenario1_BudgetOverrun,
  onTriggerScenario2_VenueDelay,
  onTriggerScenario3_StressTest,
  onResetDemo,
}) => {
  return (
    <div className="bg-gradient-to-r from-stone-900 via-purple-950 to-stone-900 text-white border-b border-purple-900/40 px-4 py-2.5 sm:px-6">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Title */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/20 text-purple-300 border border-purple-400/30">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-300">
              <span>Interactive Evaluation Controls</span>
              <span className="rounded bg-purple-800/80 px-1.5 py-0.2 text-[10px] text-purple-200">
                Official Challenge 5 Scenarios
              </span>
            </div>
            <p className="text-xs text-stone-300 font-normal">
              Test interconnected engine reactions with 1 click:
            </p>
          </div>
        </div>

        {/* 3 Scenario Triggers */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Scenario 1 */}
          <button
            onClick={onTriggerScenario1_BudgetOverrun}
            className="group flex items-center gap-1.5 rounded-lg bg-stone-800/90 hover:bg-stone-700/90 px-3 py-1.5 text-xs font-medium text-stone-200 transition border border-stone-700 hover:border-purple-400/50"
            title="Simulate +₹30,000 budget deficit (total ₹2,30,000) and run priority-aware optimizer"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>Scenario 1: Budget Overrun (+₹30k)</span>
          </button>

          {/* Scenario 2 */}
          <button
            onClick={onTriggerScenario2_VenueDelay}
            className="group flex items-center gap-1.5 rounded-lg bg-stone-800/90 hover:bg-stone-700/90 px-3 py-1.5 text-xs font-medium text-stone-200 transition border border-stone-700 hover:border-purple-400/50"
            title="Inject 3-day venue delay and observe DAG cascade & critical path shift"
          >
            <Clock className="h-3.5 w-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
            <span>Scenario 2: Venue Delay (+3 Days)</span>
          </button>

          {/* Scenario 3 */}
          <button
            onClick={onTriggerScenario3_StressTest}
            className="group flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-700 to-rose-700 hover:from-purple-600 hover:to-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition border border-purple-400/40"
            title="Mid-Flight Stress Test: +50 guests (to 250) & -15% budget cut"
          >
            <Activity className="h-3.5 w-3.5 text-purple-200 group-hover:scale-110 transition-transform" />
            <span>Scenario 3: Stress Test (+50 Pax / -15% ₹)</span>
          </button>

          {/* Reset Baseline */}
          <button
            onClick={onResetDemo}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition border border-stone-700"
            title="Reset to clean baseline College Celebration"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
