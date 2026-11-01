export type EventType =
  | 'college_festival'
  | 'wedding'
  | 'birthday'
  | 'corporate'
  | 'engagement'
  | 'anniversary'
  | 'graduation'
  | 'private_party';

export type PriorityLevel = 'high' | 'medium' | 'low';

export type BudgetCategory =
  | 'venue'
  | 'catering'
  | 'decoration'
  | 'photography'
  | 'entertainment'
  | 'transportation'
  | 'miscellaneous';

export interface BudgetItem {
  id: string;
  categoryId: BudgetCategory;
  name: string;
  estimatedCost: number;
  actualCost?: number;
  priority: PriorityLevel;
  isFlexible: boolean;
  minViableCost: number; // Floor cost below which quality degrades unacceptably
  costPerGuest?: number; // Variable cost that scales with guest count
  fixedCost?: number; // Base fixed fee
  notes?: string;
  assignedVendorId?: string;
}

export interface CategoryAllocation {
  category: BudgetCategory;
  label: string;
  allocatedAmount: number;
  estimatedAmount: number;
  priority: PriorityLevel;
  color: string;
  icon: string;
  description: string;
}

export interface ProposedAdjustment {
  itemId: string;
  itemName: string;
  category: BudgetCategory;
  priority: PriorityLevel;
  currentCost: number;
  proposedCost: number;
  amountSaved: number;
  reason: string;
  impactDescription: string;
  approved?: boolean;
}

export interface BudgetOptimizationResult {
  isOverBudget: boolean;
  totalBudget: number;
  totalEstimated: number;
  overspendAmount: number;
  targetReductionNeeded: number;
  adjustments: ProposedAdjustment[];
  totalSaved: number;
  remainingDeficit: number;
  projectedNewTotal: number;
  feasibilityRating: 'fully_balanced' | 'achievable_with_tradeoffs' | 'severe_deficit';
  aiSummaryExplanation?: string;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'delayed' | 'blocked';

export interface Task {
  id: string;
  name: string;
  category: BudgetCategory | 'logistics' | 'marketing' | 'invitations';
  durationDays: number;
  dependencies: string[]; // Predecessor task IDs
  status: TaskStatus;
  priority: PriorityLevel;
  assignedVendorId?: string;
  assignedPerson?: string;
  delayDays: number; // Injected or observed delay
  notes?: string;

  // Calculated CPM & DAG fields
  earlyStart: number; // Days from project start (0 = day 1)
  earlyFinish: number; // ES + duration
  lateStart: number; // Latest possible start without delaying project/event date
  lateFinish: number; // Latest possible finish
  slack: number; // Total float = LS - ES (0 means Critical Path, negative means over deadline)
  isCriticalPath: boolean;
  hasConflict: boolean;
  conflictReason?: string;
}

export interface DAGScheduleResult {
  tasks: Task[];
  criticalPathTaskIds: string[];
  projectDurationDays: number;
  eventDeadlineDays: number;
  isDeadlineBreached: boolean;
  daysOverdue: number;
  hasCycles: boolean;
  cycleNodes?: string[];
  affectedByDelays: {
    delayedTaskId: string;
    delayDays: number;
    downstreamAffectedTaskIds: string[];
    criticalPathImpacted: boolean;
  }[];
}

export interface Vendor {
  id: string;
  name: string;
  category: BudgetCategory;
  rating: number; // e.g. 4.8
  phone: string;
  email: string;
  estimatedCost: number;
  status: 'confirmed' | 'shortlisted' | 'negotiating' | 'cancelled';
  capacity?: number; // e.g. max guests catered or venue capacity
  notes: string;
  portfolioHighlight: string;
  alternativeVendorIds: string[];
}

export type ScenarioType =
  | 'guest_surge'
  | 'budget_cut'
  | 'vendor_cancel'
  | 'date_shift'
  | 'venue_change'
  | 'duration_change'
  | 'custom';

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  type: ScenarioType;
  guestDelta: number; // e.g. +50 or -20
  budgetPercentDelta: number; // e.g. -15 for -15%
  budgetAbsoluteDelta: number; // e.g. -30000
  eventDeadlineDaysDelta: number; // e.g. -5 (5 days earlier)
  cancelledVendorId?: string;
  newVenueCapacity?: number;
  customRequirements?: string[];
}

export interface RecoveryStep {
  stepNumber: number;
  title: string;
  description: string;
  actionType: 'budget' | 'timeline' | 'vendor' | 'guest';
  impactMetric: string;
}

export interface SimulationResult {
  scenarioId: string;
  scenarioName: string;
  scenarioDescription: string;
  timestamp: string;
  feasibilityScore: number; // 0 to 100
  feasibilityStatus: 'feasible' | 'at_risk' | 'critical_overrun';

  before: {
    guestCount: number;
    totalBudget: number;
    totalEstimated: number;
    budgetRemaining: number;
    eventDeadlineDays: number;
    projectDurationDays: number;
    criticalPathCount: number;
  };

  after: {
    guestCount: number;
    totalBudget: number;
    totalEstimated: number;
    budgetRemaining: number;
    eventDeadlineDays: number;
    projectDurationDays: number;
    criticalPathCount: number;
  };

  budgetDiff: {
    budgetDelta: number;
    estimatedCostDelta: number;
    overspend: number;
    affectedCategories: {
      category: BudgetCategory;
      oldAmount: number;
      newAmount: number;
      delta: number;
      reason: string;
    }[];
  };

  timelineDiff: {
    deadlineBreached: boolean;
    daysOverdue: number;
    oldCriticalPath: string[];
    newCriticalPath: string[];
    newlyCriticalTaskIds: string[];
    conflicts: string[];
  };

  capacityIssues: {
    hasCapacityDeficit: boolean;
    venueCapacity: number;
    newGuestCount: number;
    shortfall: number;
  };

  impactSummary: string[];
  recoveryPlan: RecoveryStep[];
  aiAnalysis?: string;
}

export interface EventPlan {
  id: string;
  name: string;
  type: EventType;
  currency: string;
  totalBudget: number;
  guestCount: number;
  eventDeadlineDays: number; // Days from kickoff to the celebration
  eventDate: string; // ISO date string
  startDate: string; // ISO date string
  location: string;
  theme: string;
  status: 'planning' | 'optimized' | 'stresstested' | 'finalized';

  categories: CategoryAllocation[];
  items: BudgetItem[];
  tasks: Task[];
  vendors: Vendor[];

  // Simulation snapshot history
  simulationHistory: SimulationResult[];
  activeAdjustments?: ProposedAdjustment[];
}
