/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file DependencyChainView.tsx
 * @description Visualizes the core interconnected DAG dependency paths required by Challenge 5:
 * 1) Venue Booking -> Decoration Planning -> Decoration Setup
 * 2) Venue Booking -> Catering Confirmation -> Food Preparation
 * 3) Guest Invitations -> RSVP Collection -> Final Guest Count -> Catering Confirmation
 */

import React from 'react';
import { ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { Task } from '../../types';

interface DependencyChainViewProps {
  tasks: Task[];
}

export const DependencyChainView: React.FC<DependencyChainViewProps> = ({ tasks }) => {
  const getTask = (id: string) => tasks.find((t) => t.id === id);

  const venue = getTask('task-venue-book');
  const stage = getTask('task-stage-design');
  const decor = getTask('task-decor-setup');
  const invites = getTask('task-invitations');
  const rsvp = getTask('task-rsvp');
  const catering = getTask('task-catering-confirm');
  const food = getTask('task-food-prep');

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-6">
      <div>
        <h2 className="text-base font-bold text-stone-900">
          Interconnected Dependency Chains
        </h2>
        <p className="text-xs text-stone-500">
          As specified in Challenge 5: venue confirmation triggers decoration and catering; guest invitations trigger RSVP, headcount, and food prep staging.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Chain 1: Venue to Decoration & Catering */}
        <div className="rounded-2xl border border-purple-200 bg-purple-50/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-purple-900 text-sm">
              Chain 1: Venue Anchor & Downstream Setup
            </span>
            {venue?.delayDays ? (
              <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                +{venue.delayDays}d Delayed
              </span>
            ) : null}
          </div>
          <div className="flex flex-col space-y-2">
            <div className="rounded-xl border border-purple-300 bg-white p-3 font-semibold text-stone-800 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-purple-500" />
                <span>{venue?.name || 'Venue Booking & Campus Signoff'}</span>
              </div>
              <span className="text-xs text-purple-700 font-mono font-bold">
                Day {venue?.earlyStart ?? 0}-{venue?.earlyFinish ?? 3}
              </span>
            </div>

            <div className="flex justify-center text-purple-400">
              <ArrowRight className="h-4 w-4 rotate-90" aria-hidden="true" />
            </div>

            <div className="rounded-xl border border-purple-300 bg-white p-3 font-semibold text-stone-800 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-purple-500" />
                <span>{stage?.name || 'Stage Layout & Blueprint'}</span>
              </div>
              <span className="text-xs text-purple-700 font-mono font-bold">
                Day {stage?.earlyStart ?? 3}-{stage?.earlyFinish ?? 5}
              </span>
            </div>

            <div className="flex justify-center text-purple-400">
              <ArrowRight className="h-4 w-4 rotate-90" aria-hidden="true" />
            </div>

            <div className="rounded-xl border border-purple-300 bg-white p-3 font-semibold text-stone-800 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-purple-500" />
                <span>{decor?.name || 'Decoration Planning → Setup'}</span>
              </div>
              <span className="text-xs text-purple-700 font-mono font-bold">
                Day {decor?.earlyStart ?? 5}-{decor?.earlyFinish ?? 11}
              </span>
            </div>
          </div>
        </div>

        {/* Chain 2: Invitations to Catering Confirm */}
        <div className="rounded-2xl border border-orange-200 bg-orange-50/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-orange-900 text-sm">
              Chain 2: Guest Count to Catering Lock
            </span>
            <span className="text-[10px] font-semibold text-orange-700">
              Dual-Dependency Anchor
            </span>
          </div>
          <div className="flex flex-col space-y-2">
            <div className="rounded-xl border border-orange-300 bg-white p-3 font-semibold text-stone-800 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                <span>{invites?.name || 'Guest Invitations & Digital Portal'}</span>
              </div>
              <span className="text-xs text-orange-700 font-mono font-bold">
                Day {invites?.earlyStart ?? 0}-{invites?.earlyFinish ?? 4}
              </span>
            </div>

            <div className="flex justify-center text-orange-400">
              <ArrowRight className="h-4 w-4 rotate-90" aria-hidden="true" />
            </div>

            <div className="rounded-xl border border-orange-300 bg-white p-3 font-semibold text-stone-800 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                <span>{rsvp?.name || 'RSVP Collection (8 Days) → Final Count'}</span>
              </div>
              <span className="text-xs text-orange-700 font-mono font-bold">
                Day {rsvp?.earlyStart ?? 4}-{rsvp?.earlyFinish ?? 14}
              </span>
            </div>

            <div className="flex justify-center text-orange-400">
              <ArrowRight className="h-4 w-4 rotate-90" aria-hidden="true" />
            </div>

            <div className="rounded-xl border border-orange-300 bg-white p-3 font-semibold text-stone-800 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                <span>{catering?.name || 'Catering Confirmation'} & {food?.name || 'Food Prep'}</span>
              </div>
              <span className="text-xs text-orange-700 font-mono font-bold">
                Day {catering?.earlyStart ?? 14}-{food?.earlyFinish ?? 19}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
