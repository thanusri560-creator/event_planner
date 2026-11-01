import React from 'react';
import {
  Sparkles,
  ArrowRight,
  TrendingDown,
  GitBranch,
  FlaskConical,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Users,
  Wallet,
  Play,
  Layers,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { EventPlan } from '../types';

interface LandingPageProps {
  onStartPlanning: () => void;
  onLaunchDemo: () => void;
  activeEvent: EventPlan;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartPlanning,
  onLaunchDemo,
  activeEvent,
}) => {
  return (
    <div className="relative min-h-screen bg-stone-50 text-stone-900 selection:bg-purple-200">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-[700px] rounded-full bg-gradient-to-tr from-purple-200/40 via-rose-200/30 to-amber-100/30 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Top pill badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-purple-900 shadow-xs mb-6">
            <span className="flex h-2 w-2 rounded-full bg-purple-600 animate-pulse" />
            <span>Challenge 5 Finalist: Intelligent Event Optimization Engine</span>
            <span className="text-purple-400">|</span>
            <span className="text-purple-700 flex items-center gap-1 font-bold">
              Powered by Gemini AI <Sparkles className="h-3 w-3" />
            </span>
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight sm:text-6xl text-stone-900 leading-[1.12]">
            Celebration planning with{' '}
            <span className="bg-gradient-to-r from-purple-700 via-purple-600 to-rose-600 bg-clip-text text-transparent">
              interconnected intelligence
            </span>
            , not static checklists.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-stone-600 leading-relaxed">
            Stop relying on dumb spreadsheets. AuraPlan automatically optimizes budgets across priorities, computes Critical Path DAG schedules with delay propagation, and stress-tests mid-flight surprises before they happen.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <button
              onClick={onLaunchDemo}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-700 to-rose-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-600/25 hover:from-purple-800 hover:to-rose-700 hover:shadow-xl transition-all"
            >
              <Play className="h-4 w-4 fill-white" />
              <span>Launch College Fest Demo (₹2L / 200 Pax)</span>
            </button>

            <button
              onClick={onStartPlanning}
              className="flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-6 py-3.5 text-sm font-semibold text-stone-800 shadow-xs hover:bg-stone-100 hover:border-stone-400 transition"
            >
              <span>Create Custom Event</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Demonstration Quick Preview Card */}
          <div className="mx-auto mt-14 max-w-4xl rounded-2xl border border-stone-200/80 bg-white/80 p-5 backdrop-blur-md shadow-xl text-left">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-stone-100 pb-3 gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
                  Active Live Blueprint: {activeEvent.name}
                </span>
              </div>
              <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
                Budget: {activeEvent.currency}{activeEvent.totalBudget.toLocaleString()} • {activeEvent.guestCount} Guests • {activeEvent.eventDeadlineDays} Days
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl bg-stone-50 p-3 border border-stone-100">
                <span className="font-semibold text-stone-500 uppercase tracking-wider text-[10px] block">
                  Feature A
                </span>
                <span className="font-bold text-stone-900 text-sm mt-0.5 block">
                  Dynamic Budget Engine
                </span>
                <p className="text-stone-600 mt-1">
                  Shields High-Priority food & venue while algorithmically absorbing ₹30k overruns from flexible tiers.
                </p>
              </div>

              <div className="rounded-xl bg-stone-50 p-3 border border-stone-100">
                <span className="font-semibold text-stone-500 uppercase tracking-wider text-[10px] block">
                  Feature B
                </span>
                <span className="font-bold text-stone-900 text-sm mt-0.5 block">
                  DAG CPM Scheduler
                </span>
                <p className="text-stone-600 mt-1">
                  Inject 3-day venue delays to see downstream catering & setup tasks dynamically push with zero-slack warnings.
                </p>
              </div>

              <div className="rounded-xl bg-stone-50 p-3 border border-stone-100">
                <span className="font-semibold text-stone-500 uppercase tracking-wider text-[10px] block">
                  Feature C
                </span>
                <span className="font-bold text-stone-900 text-sm mt-0.5 block">
                  Mid-Flight Stress Lab
                </span>
                <p className="text-stone-600 mt-1">
                  Surge +50 guests and slash 15% budget simultaneously; watch feasibility scores and recovery plans calculate in real-time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillar Highlights */}
      <section className="border-t border-stone-200/80 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-purple-700">
              Deterministic Calculations + Generative Intelligence
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
              Engineered for real-world celebration constraints
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="relative rounded-2xl border border-stone-200 bg-stone-50/60 p-7 shadow-xs hover:shadow-md transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700 mb-5">
                <Wallet className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">
                Priority-Aware Budget Optimizer
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-stone-600 leading-relaxed">
                When quotes exceed your budget, the system protects your "Must-Have" high-priority categories (like catering & venue) and algorithmically redistributes cuts across flexible decoration or media lines with full user approval.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-stone-700 font-medium">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Overspend detection & auto-identification of reducible lines
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Preserves minimum viable quality floors
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Generates vendor negotiation scripts with Gemini AI
                </li>
              </ul>
            </div>

            {/* Card 2 */}
            <div className="relative rounded-2xl border border-stone-200 bg-stone-50/60 p-7 shadow-xs hover:shadow-md transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-700 mb-5">
                <GitBranch className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">
                Directed Acyclic Graph (DAG) Timeline
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-stone-600 leading-relaxed">
                Tasks don't exist in a vacuum. If a prerequisite venue booking slips by 3 days, our Critical Path Method (CPM) forward-pass pushes decoration, catering locks, and dress rehearsals forward immediately.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-stone-700 font-medium">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Calculates Early/Late Start & Finish and Total Float (Slack)
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Instant conflict detection against Event Celebration Day
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Interactive delay injection slider to test ripple effects
                </li>
              </ul>
            </div>

            {/* Card 3 */}
            <div className="relative rounded-2xl border border-stone-200 bg-stone-50/60 p-7 shadow-xs hover:shadow-md transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700 mb-5">
                <FlaskConical className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">
                Mid-Flight What-If Stress Lab
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-stone-600 leading-relaxed">
                Experience unexpected guest surges, sudden 15% budget cuts, or sudden vendor cancellations in a sandboxed simulator. Compares before vs after, computes a feasibility score, and crafts a concrete recovery plan.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-stone-700 font-medium">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Multi-variable stress testing (Guests, Budget, Days, Vendors)
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Identifies venue capacity shortfalls & catering scaling
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Commit scenario to live plan or rollback anytime
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-stone-100 py-8 text-center text-xs text-stone-500">
        <p>AuraPlan AI • Challenge 5: Celebration & Event Optimization Engine • Built with React, TypeScript & Google GenAI</p>
      </footer>
    </div>
  );
};
