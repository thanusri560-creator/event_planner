import React from 'react';
import {
  Sparkles,
  LayoutDashboard,
  Wallet,
  GitBranch,
  FlaskConical,
  Store,
  PlusCircle,
  RotateCcw,
  Bot,
  CalendarCheck,
  Compass,
  ShieldCheck,
} from 'lucide-react';
import { EventPlan } from '../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  activeEvent: EventPlan;
  onResetDemo: () => void;
  onOpenAICopilot: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  activeEvent,
  onResetDemo,
  onOpenAICopilot,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'AI Dashboard', icon: LayoutDashboard },
    { id: 'budget', label: 'Budget Engine', icon: Wallet },
    { id: 'timeline', label: 'DAG Timeline', icon: GitBranch },
    { id: 'simulation', label: 'What-If Lab', icon: FlaskConical },
    { id: 'vendors', label: 'Vendors', icon: Store },
    { id: 'testing', label: 'Test Suite', icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentTab('landing')}
            className="flex items-center gap-2.5 text-left transition hover:opacity-90"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-700 via-purple-600 to-rose-500 text-white shadow-md shadow-purple-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold tracking-tight text-stone-900">
                <span className="text-lg">AuraPlan</span>
                <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-800">
                  AI v2.5
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium hidden sm:block">
                Event Optimization Engine
              </p>
            </div>
          </button>

          {/* Active Event Badge */}
          {currentTab !== 'landing' && (
            <div className="hidden lg:flex items-center gap-2 border-l border-stone-200 pl-4 ml-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="text-xs">
                <span className="font-semibold text-stone-800 max-w-[160px] truncate block">
                  {activeEvent.name}
                </span>
                <span className="text-stone-500 text-[11px]">
                  {activeEvent.guestCount} guests • {activeEvent.currency}
                  {activeEvent.totalBudget.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Center Nav tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-stone-100/80 p-1 rounded-xl border border-stone-200/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white text-purple-900 shadow-sm shadow-stone-200 font-bold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-purple-600' : 'text-stone-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* AI Copilot Button */}
          <button
            onClick={onOpenAICopilot}
            className="flex items-center gap-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 px-3 py-1.5 text-xs font-semibold text-purple-700 transition border border-purple-200/70"
            title="Open AI Event Copilot"
          >
            <Bot className="h-4 w-4 text-purple-600" />
            <span className="hidden sm:inline">AI Copilot</span>
          </button>

          {/* New Event Button */}
          <button
            onClick={() => setCurrentTab('create')}
            className="flex items-center gap-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 px-3.5 py-1.5 text-xs font-semibold text-white transition shadow-sm"
          >
            <PlusCircle className="h-4 w-4 text-stone-300" />
            <span className="hidden sm:inline">New Event</span>
          </button>

          {/* Reset Demo */}
          <button
            onClick={onResetDemo}
            className="p-1.5 text-stone-500 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition"
            title="Reset to Baseline Demo College Celebration"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mobile nav bar below header */}
      <div className="flex md:hidden overflow-x-auto border-t border-stone-100 px-3 py-1.5 gap-1 bg-stone-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs whitespace-nowrap font-medium ${
                isActive ? 'bg-purple-600 text-white font-semibold' : 'text-stone-600'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
