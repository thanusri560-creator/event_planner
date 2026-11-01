import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DemoScenarioBanner } from './components/DemoScenarioBanner';
import { AICopilotModal } from './components/AICopilotModal';
import { BudgetOptimizationModal } from './components/BudgetOptimizationModal';

import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { BudgetPage } from './pages/BudgetPage';
import { TimelinePage } from './pages/TimelinePage';
import { SimulationPage } from './pages/SimulationPage';
import { VendorPage } from './pages/VendorPage';
import { CreateEventPage } from './pages/CreateEventPage';
import { TestingPage } from './pages/TestingPage';

import { EventPlan, ProposedAdjustment } from './types';
import {
  getActiveEvent,
  saveActiveEvent,
  resetToDemoCollegeEvent,
} from './logic/eventPlanner';
import { applyApprovedAdjustments, optimizeBudget } from './logic/budgetOptimizer';
import { applyTaskDelay, calculateSchedule } from './logic/dependencyScheduler';

export default function App() {
  const [activeEvent, setActiveEvent] = useState<EventPlan>(() => getActiveEvent());
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isOptimizerOpen, setIsOptimizerOpen] = useState<boolean>(false);
  const [isAICopilotOpen, setIsAICopilotOpen] = useState<boolean>(false);
  const [activeNotification, setActiveNotification] = useState<{
    title: string;
    message: string;
    type: 'success' | 'warning' | 'info';
  } | null>(null);

  // Sync state to persistence
  const handleUpdateEvent = (updated: EventPlan) => {
    setActiveEvent(updated);
    saveActiveEvent(updated);
  };

  const showNotification = (
    title: string,
    message: string,
    type: 'success' | 'warning' | 'info' = 'info'
  ) => {
    setActiveNotification({ title, message, type });
    setTimeout(() => {
      setActiveNotification(null);
    }, 6000);
  };

  // Reset demo
  const handleResetDemo = () => {
    const clean = resetToDemoCollegeEvent();
    setActiveEvent(clean);
    showNotification('Baseline Restored', 'Reset to clean College Annual Celebration (₹2,00,000 / 200 Guests / 30 Days)', 'info');
  };

  // Demonstration Scenario 1: Budget Overrun
  // Increases projected expenses to ₹2,30,000 (+₹30,000 overrun) and opens optimizer
  const handleTriggerScenario1_BudgetOverrun = () => {
    // Increase Decoration by ₹20,000 and Photography by ₹10,000
    const updatedItems = activeEvent.items.map((item) => {
      if (item.id === 'item-decor-stage') {
        return { ...item, estimatedCost: item.estimatedCost + 20000 };
      }
      if (item.id === 'item-photo-video') {
        return { ...item, estimatedCost: item.estimatedCost + 10000 };
      }
      return item;
    });

    const updatedCategories = activeEvent.categories.map((c) => {
      if (c.category === 'decoration') {
        return { ...c, estimatedAmount: c.estimatedAmount + 20000 };
      }
      if (c.category === 'photography') {
        return { ...c, estimatedAmount: c.estimatedAmount + 10000 };
      }
      return c;
    });

    const updatedEvent: EventPlan = {
      ...activeEvent,
      items: updatedItems,
      categories: updatedCategories,
    };

    handleUpdateEvent(updatedEvent);
    setCurrentTab('budget');
    setIsOptimizerOpen(true);
    showNotification(
      'Scenario 1: Budget Overrun (+₹30,000)',
      'Projected expenses spiked to ₹2,30,000. Optimization engine ready with proposed cuts on flexible items.',
      'warning'
    );
  };

  // Demonstration Scenario 2: Venue Booking Delay
  // Injects 3-day delay on Venue Booking and propagates downstream
  const handleTriggerScenario2_VenueDelay = () => {
    const scheduleResult = applyTaskDelay(
      activeEvent.tasks,
      'task-venue-book',
      3,
      activeEvent.eventDeadlineDays
    );

    const updatedEvent: EventPlan = {
      ...activeEvent,
      tasks: scheduleResult.tasks,
    };

    handleUpdateEvent(updatedEvent);
    setCurrentTab('timeline');
    showNotification(
      'Scenario 2: Venue Delay (+3 Days)',
      'Venue delayed by 3 days. DAG forward-pass recalculated downstream tasks: Stage Design, Decor, & Catering pushed.',
      'warning'
    );
  };

  // Demonstration Scenario 3: Mid-Flight Stress Test
  // +50 guests (to 250) & -15% budget cut (to ₹1,70,000)
  const handleTriggerScenario3_StressTest = () => {
    setCurrentTab('simulation');
    showNotification(
      'Scenario 3: Mid-Flight Stress Test Loaded',
      'Simulating double shock: +50 attendees (250 pax) & -15% budget slash (₹1,70,000 ceiling).',
      'info'
    );
  };

  // Simulate vendor cancellation
  const handleSimulateVendorCancel = (vendorId: string) => {
    const updatedVendors = activeEvent.vendors.map((v) =>
      v.id === vendorId ? { ...v, status: 'cancelled' as const } : v
    );

    // Block tasks assigned to this vendor and add 4 days delay
    const updatedTasks = activeEvent.tasks.map((t) => {
      if (t.assignedVendorId === vendorId) {
        return {
          ...t,
          status: 'blocked' as const,
          delayDays: t.delayDays + 4,
          notes: 'Vendor cancelled. Emergency backup onboarding required.',
        };
      }
      return t;
    });

    const schedule = calculateSchedule(updatedTasks, activeEvent.eventDeadlineDays);

    const updatedEvent: EventPlan = {
      ...activeEvent,
      vendors: updatedVendors,
      tasks: schedule.tasks,
    };

    handleUpdateEvent(updatedEvent);
    setCurrentTab('timeline');
    showNotification(
      'Vendor Cancellation Impact',
      'Vendor cancelled. Dependent tasks marked blocked and 4-day replacement buffer consumed.',
      'warning'
    );
  };

  // Optimize modal approval
  const handleApplyAdjustmentsFromModal = (adjustments: ProposedAdjustment[]) => {
    const { updatedItems, updatedCategories } = applyApprovedAdjustments(
      activeEvent.items,
      activeEvent.categories,
      adjustments
    );
    handleUpdateEvent({
      ...activeEvent,
      items: updatedItems,
      categories: updatedCategories,
      activeAdjustments: adjustments,
      status: 'optimized',
    });
    showNotification(
      'Reallocation Approved',
      'Budget rebalancing applied to line-items. Core High-Priority items preserved.',
      'success'
    );
  };

  return (
    <div className="min-h-screen bg-stone-100/60 text-stone-900 font-sans selection:bg-purple-200">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        activeEvent={activeEvent}
        onResetDemo={handleResetDemo}
        onOpenAICopilot={() => setIsAICopilotOpen(true)}
      />

      {/* Official Challenge 5 Demo Scenario Banner */}
      {currentTab !== 'landing' && (
        <DemoScenarioBanner
          activeEvent={activeEvent}
          onTriggerScenario1_BudgetOverrun={handleTriggerScenario1_BudgetOverrun}
          onTriggerScenario2_VenueDelay={handleTriggerScenario2_VenueDelay}
          onTriggerScenario3_StressTest={handleTriggerScenario3_StressTest}
          onResetDemo={handleResetDemo}
        />
      )}

      {/* Floating Toast Notification */}
      {activeNotification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in slide-in-from-bottom-5 duration-300">
          <div
            className={`rounded-2xl p-4 shadow-xl border flex items-start gap-3 backdrop-blur-md ${
              activeNotification.type === 'success'
                ? 'bg-emerald-900/95 text-white border-emerald-700'
                : activeNotification.type === 'warning'
                ? 'bg-amber-900/95 text-white border-amber-700'
                : 'bg-stone-900/95 text-white border-stone-700'
            }`}
          >
            <div className="flex-1 text-xs">
              <span className="font-bold text-sm block mb-0.5">
                {activeNotification.title}
              </span>
              <p className="opacity-90">{activeNotification.message}</p>
            </div>
            <button
              onClick={() => setActiveNotification(null)}
              className="text-stone-400 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Page Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'landing' && (
          <LandingPage
            onStartPlanning={() => setCurrentTab('create')}
            onLaunchDemo={() => setCurrentTab('dashboard')}
            activeEvent={activeEvent}
          />
        )}

        {currentTab === 'dashboard' && (
          <DashboardPage
            activeEvent={activeEvent}
            onNavigateTab={setCurrentTab}
            onOpenOptimizer={() => setIsOptimizerOpen(true)}
            onOpenAICopilot={() => setIsAICopilotOpen(true)}
            onTriggerScenario1={handleTriggerScenario1_BudgetOverrun}
            onTriggerScenario2={handleTriggerScenario2_VenueDelay}
            onTriggerScenario3={handleTriggerScenario3_StressTest}
          />
        )}

        {currentTab === 'budget' && (
          <BudgetPage
            activeEvent={activeEvent}
            onUpdateEvent={handleUpdateEvent}
            isOptimizerOpen={isOptimizerOpen}
            setIsOptimizerOpen={setIsOptimizerOpen}
          />
        )}

        {currentTab === 'timeline' && (
          <TimelinePage
            activeEvent={activeEvent}
            onUpdateEvent={handleUpdateEvent}
            onTriggerScenario2={handleTriggerScenario2_VenueDelay}
          />
        )}

        {currentTab === 'simulation' && (
          <SimulationPage
            activeEvent={activeEvent}
            onUpdateEvent={handleUpdateEvent}
            onResetDemo={handleResetDemo}
          />
        )}

        {currentTab === 'vendors' && (
          <VendorPage
            activeEvent={activeEvent}
            onUpdateEvent={handleUpdateEvent}
            onSimulateVendorCancel={handleSimulateVendorCancel}
          />
        )}

        {currentTab === 'testing' && <TestingPage />}

        {currentTab === 'create' && (
          <CreateEventPage
            onEventCreated={(newEvent) => {
              handleUpdateEvent(newEvent);
              setCurrentTab('dashboard');
              showNotification(
                'Celebration Plan Created',
                `"${newEvent.name}" generated with ${newEvent.categories.length} category allocations and DAG scheduling.`,
                'success'
              );
            }}
            onCancel={() => setCurrentTab('dashboard')}
          />
        )}
      </main>

      {/* AI Copilot Modal */}
      <AICopilotModal
        isOpen={isAICopilotOpen}
        onClose={() => setIsAICopilotOpen(false)}
        activeEvent={activeEvent}
      />

      {/* Global Budget Optimization Modal (when opened from any screen) */}
      <BudgetOptimizationModal
        isOpen={isOptimizerOpen}
        onClose={() => setIsOptimizerOpen(false)}
        optimizationResult={optimizeBudget(
          activeEvent.totalBudget,
          activeEvent.categories,
          activeEvent.items
        )}
        activeEvent={activeEvent}
        onApplyAdjustments={handleApplyAdjustmentsFromModal}
      />
    </div>
  );
}
