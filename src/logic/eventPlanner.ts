import {
  EventPlan,
  BudgetItem,
  CategoryAllocation,
  Task,
  Vendor,
  EventType,
} from '../types';
import { calculateSchedule } from './dependencyScheduler';

const STORAGE_KEY = 'auraplan_active_event_v1';
const ALL_EVENTS_KEY = 'auraplan_all_events_v1';

/**
 * Creates the official sample event for evaluation demonstrations:
 * "College Annual Celebration" — 200 guests, ₹2,00,000 budget, 30 days.
 */
export function createSampleCollegeEvent(): EventPlan {
  const categories: CategoryAllocation[] = [
    {
      category: 'venue',
      label: 'Venue & Auditorium',
      allocatedAmount: 45000,
      estimatedAmount: 45000,
      priority: 'high',
      color: '#8b5cf6', // purple
      icon: 'Building2',
      description: 'Campus Main Auditorium, Green Rooms & Stage Wing permits',
    },
    {
      category: 'catering',
      label: 'Catering & Refreshments',
      allocatedAmount: 70000,
      estimatedAmount: 70000,
      priority: 'high',
      color: '#f97316', // orange/coral
      icon: 'Utensils',
      description: 'Buffet spread for 200 guests @ ₹350/person + high-tea',
    },
    {
      category: 'decoration',
      label: 'Decoration & Stagecraft',
      allocatedAmount: 32000,
      estimatedAmount: 32000,
      priority: 'low',
      color: '#ec4899', // pink
      icon: 'Sparkles',
      description: 'Backdrop framing, floral podium, welcome arch, uplighting',
    },
    {
      category: 'photography',
      label: 'Photography & Media',
      allocatedAmount: 24000,
      estimatedAmount: 24000,
      priority: 'medium',
      color: '#3b82f6', // blue
      icon: 'Camera',
      description: '2 Photographers, 1 Videographer, drone aerials & after-movie',
    },
    {
      category: 'entertainment',
      label: 'Entertainment & Audio/DJ',
      allocatedAmount: 18000,
      estimatedAmount: 18000,
      priority: 'medium',
      color: '#10b981', // emerald
      icon: 'Music',
      description: 'Line array sound rig, stage monitors, wireless mics, DJ console',
    },
    {
      category: 'transportation',
      label: 'Transport & Logistics',
      allocatedAmount: 6000,
      estimatedAmount: 6000,
      priority: 'low',
      color: '#06b6d4', // cyan
      icon: 'Truck',
      description: 'Guest speaker luxury car transfer & sound equipment freight',
    },
    {
      category: 'miscellaneous',
      label: 'Passes, Badges & Contingency',
      allocatedAmount: 5000,
      estimatedAmount: 5000,
      priority: 'low',
      color: '#64748b', // slate
      icon: 'Boxes',
      description: 'Laminated badges, mementos for dignitaries, first-aid station',
    },
  ];

  const items: BudgetItem[] = [
    // Venue
    {
      id: 'item-venue-hall',
      categoryId: 'venue',
      name: 'Grand Auditorium Rental & AC Tariff',
      estimatedCost: 35000,
      priority: 'high',
      isFlexible: false,
      minViableCost: 30000,
      assignedVendorId: 'vendor-venue-1',
    },
    {
      id: 'item-venue-permit',
      categoryId: 'venue',
      name: 'Safety & Municipal Fire Clearance Permit',
      estimatedCost: 10000,
      priority: 'high',
      isFlexible: false,
      minViableCost: 10000,
    },
    // Catering
    {
      id: 'item-cater-dinner',
      categoryId: 'catering',
      name: 'Full Evening Celebration Buffet (200 pax)',
      estimatedCost: 56000,
      costPerGuest: 280,
      fixedCost: 0,
      priority: 'high',
      isFlexible: false,
      minViableCost: 45000,
      assignedVendorId: 'vendor-cater-1',
    },
    {
      id: 'item-cater-tea',
      categoryId: 'catering',
      name: 'Welcome Drink & Hi-Tea Finger Food Counter',
      estimatedCost: 14000,
      costPerGuest: 70,
      fixedCost: 0,
      priority: 'high',
      isFlexible: false,
      minViableCost: 10000,
      assignedVendorId: 'vendor-cater-1',
    },
    // Decoration (Low Priority - Prime target for optimizer cuts)
    {
      id: 'item-decor-stage',
      categoryId: 'decoration',
      name: 'Premium Floral Arch & LED Backdrop Framing',
      estimatedCost: 20000,
      priority: 'low',
      isFlexible: true,
      minViableCost: 8000,
      assignedVendorId: 'vendor-decor-1',
    },
    {
      id: 'item-decor-ambient',
      categoryId: 'decoration',
      name: 'Foyer Mood Lighting & Table Silk Centerpieces',
      estimatedCost: 12000,
      priority: 'low',
      isFlexible: true,
      minViableCost: 4000,
      assignedVendorId: 'vendor-decor-1',
    },
    // Photography
    {
      id: 'item-photo-photo',
      categoryId: 'photography',
      name: 'Lead Candid Photographer & 4K Album',
      estimatedCost: 14000,
      priority: 'medium',
      isFlexible: true,
      minViableCost: 9000,
      assignedVendorId: 'vendor-photo-1',
    },
    {
      id: 'item-photo-video',
      categoryId: 'photography',
      name: 'Drone Coverage & Cinematic Highlight Reel',
      estimatedCost: 10000,
      priority: 'medium',
      isFlexible: true,
      minViableCost: 5000,
      assignedVendorId: 'vendor-photo-1',
    },
    // Entertainment
    {
      id: 'item-ent-dj',
      categoryId: 'entertainment',
      name: 'Professional DJ & Console Mixer',
      estimatedCost: 10000,
      priority: 'medium',
      isFlexible: true,
      minViableCost: 6000,
      assignedVendorId: 'vendor-ent-1',
    },
    {
      id: 'item-ent-sound',
      categoryId: 'entertainment',
      name: 'Auditorium Line-Array Sound & Mics Rental',
      estimatedCost: 8000,
      priority: 'medium',
      isFlexible: true,
      minViableCost: 5000,
      assignedVendorId: 'vendor-ent-1',
    },
    // Transportation
    {
      id: 'item-trans-guest',
      categoryId: 'transportation',
      name: 'VIP Guest Pickups & Faculty Vans',
      estimatedCost: 4000,
      priority: 'low',
      isFlexible: true,
      minViableCost: 1500,
      assignedVendorId: 'vendor-trans-1',
    },
    {
      id: 'item-trans-freight',
      categoryId: 'transportation',
      name: 'Stage Gear & Instrument Transit',
      estimatedCost: 2000,
      priority: 'low',
      isFlexible: true,
      minViableCost: 1000,
      assignedVendorId: 'vendor-trans-1',
    },
    // Miscellaneous
    {
      id: 'item-misc-badges',
      categoryId: 'miscellaneous',
      name: 'Passes, Badges, Lanyards & Brochures',
      estimatedCost: 3000,
      priority: 'low',
      isFlexible: true,
      minViableCost: 1000,
    },
    {
      id: 'item-misc-trophies',
      categoryId: 'miscellaneous',
      name: 'Certificates, Plaques & Dignitary Gifts',
      estimatedCost: 2000,
      priority: 'low',
      isFlexible: true,
      minViableCost: 1000,
    },
  ];

  // Raw DAG tasks: dependencies explicitly defined as requested in prompt:
  // Venue Booking → Decoration Planning → Decoration Setup
  // Venue Booking → Catering Confirmation → Food Preparation
  // Guest Invitations → RSVP Collection → Final Guest Count → Catering Confirmation
  const rawTasks: Task[] = [
    {
      id: 'task-venue-book',
      name: 'Venue Booking & Campus Signoff',
      category: 'venue',
      durationDays: 3,
      dependencies: [],
      status: 'completed',
      priority: 'high',
      assignedVendorId: 'vendor-venue-1',
      assignedPerson: 'Admin Dean',
      delayDays: 0,
      earlyStart: 0,
      earlyFinish: 3,
      lateStart: 0,
      lateFinish: 3,
      slack: 0,
      isCriticalPath: true,
      hasConflict: false,
    },
    {
      id: 'task-stage-design',
      name: 'Stage Layout & Technical Rider',
      category: 'decoration',
      durationDays: 2,
      dependencies: ['task-venue-book'],
      status: 'in_progress',
      priority: 'medium',
      assignedVendorId: 'vendor-decor-1',
      assignedPerson: 'Design Head',
      delayDays: 0,
      earlyStart: 3,
      earlyFinish: 5,
      lateStart: 3,
      lateFinish: 5,
      slack: 0,
      isCriticalPath: true,
      hasConflict: false,
    },
    {
      id: 'task-decor-plan',
      name: 'Decoration Planning & Fabric Orders',
      category: 'decoration',
      durationDays: 4,
      dependencies: ['task-stage-design'],
      status: 'pending',
      priority: 'low',
      assignedVendorId: 'vendor-decor-1',
      assignedPerson: 'Stage Coordinator',
      delayDays: 0,
      earlyStart: 5,
      earlyFinish: 9,
      lateStart: 5,
      lateFinish: 9,
      slack: 0,
      isCriticalPath: true,
      hasConflict: false,
    },
    {
      id: 'task-decor-setup',
      name: 'Decoration Setup & Stage Lighting Install',
      category: 'decoration',
      durationDays: 2,
      dependencies: ['task-decor-plan'],
      status: 'pending',
      priority: 'low',
      assignedVendorId: 'vendor-decor-1',
      assignedPerson: 'Stage Coordinator',
      delayDays: 0,
      earlyStart: 9,
      earlyFinish: 11,
      lateStart: 25,
      lateFinish: 27,
      slack: 16,
      isCriticalPath: false,
      hasConflict: false,
    },
    {
      id: 'task-invitations',
      name: 'Guest Invitations & Digital Tickets',
      category: 'invitations',
      durationDays: 4,
      dependencies: [],
      status: 'completed',
      priority: 'medium',
      assignedPerson: 'PR Lead',
      delayDays: 0,
      earlyStart: 0,
      earlyFinish: 4,
      lateStart: 6,
      lateFinish: 10,
      slack: 6,
      isCriticalPath: false,
      hasConflict: false,
    },
    {
      id: 'task-rsvp',
      name: 'RSVP Collection & Attendance Tracking',
      category: 'invitations',
      durationDays: 8,
      dependencies: ['task-invitations'],
      status: 'in_progress',
      priority: 'high',
      assignedPerson: 'PR Lead',
      delayDays: 0,
      earlyStart: 4,
      earlyFinish: 12,
      lateStart: 10,
      lateFinish: 18,
      slack: 6,
      isCriticalPath: false,
      hasConflict: false,
    },
    {
      id: 'task-guest-count',
      name: 'Final Guest Count & Dietary Audit',
      category: 'catering',
      durationDays: 2,
      dependencies: ['task-rsvp'],
      status: 'pending',
      priority: 'high',
      assignedPerson: 'Hospitality Lead',
      delayDays: 0,
      earlyStart: 12,
      earlyFinish: 14,
      lateStart: 18,
      lateFinish: 20,
      slack: 6,
      isCriticalPath: false,
      hasConflict: false,
    },
    {
      id: 'task-cater-confirm',
      name: 'Catering Confirmation & Headcount Lock',
      category: 'catering',
      durationDays: 3,
      dependencies: ['task-venue-book', 'task-guest-count'],
      status: 'pending',
      priority: 'high',
      assignedVendorId: 'vendor-cater-1',
      assignedPerson: 'Hospitality Lead',
      delayDays: 0,
      earlyStart: 14,
      earlyFinish: 17,
      lateStart: 20,
      lateFinish: 23,
      slack: 6,
      isCriticalPath: false,
      hasConflict: false,
    },
    {
      id: 'task-food-prep',
      name: 'Food Preparation & Service Staging',
      category: 'catering',
      durationDays: 2,
      dependencies: ['task-cater-confirm'],
      status: 'pending',
      priority: 'high',
      assignedVendorId: 'vendor-cater-1',
      assignedPerson: 'Master Chef',
      delayDays: 0,
      earlyStart: 17,
      earlyFinish: 19,
      lateStart: 26,
      lateFinish: 28,
      slack: 9,
      isCriticalPath: false,
      hasConflict: false,
    },
    {
      id: 'task-av-setup',
      name: 'Sound, Lighting & DJ Rehearsal',
      category: 'entertainment',
      durationDays: 2,
      dependencies: ['task-venue-book'],
      status: 'pending',
      priority: 'medium',
      assignedVendorId: 'vendor-ent-1',
      assignedPerson: 'AV Tech',
      delayDays: 0,
      earlyStart: 3,
      earlyFinish: 5,
      lateStart: 26,
      lateFinish: 28,
      slack: 23,
      isCriticalPath: false,
      hasConflict: false,
    },
    {
      id: 'task-photo-brief',
      name: 'Photography Brief & Schedule Shot-list',
      category: 'photography',
      durationDays: 2,
      dependencies: ['task-stage-design'],
      status: 'pending',
      priority: 'medium',
      assignedVendorId: 'vendor-photo-1',
      assignedPerson: 'Media Head',
      delayDays: 0,
      earlyStart: 5,
      earlyFinish: 7,
      lateStart: 26,
      lateFinish: 28,
      slack: 21,
      isCriticalPath: false,
      hasConflict: false,
    },
    {
      id: 'task-final-dryrun',
      name: 'Final Rehearsal & Event Day Ready Signoff',
      category: 'logistics',
      durationDays: 1,
      dependencies: ['task-decor-setup', 'task-food-prep', 'task-av-setup', 'task-photo-brief'],
      status: 'pending',
      priority: 'high',
      assignedPerson: 'Overall Convenor',
      delayDays: 0,
      earlyStart: 19,
      earlyFinish: 20,
      lateStart: 29,
      lateFinish: 30,
      slack: 10,
      isCriticalPath: false,
      hasConflict: false,
    },
  ];

  const vendors: Vendor[] = [
    {
      id: 'vendor-venue-1',
      name: 'Heritage University Grand Auditorium',
      category: 'venue',
      rating: 4.9,
      phone: '+91 98200 11223',
      email: 'auditorium.desk@heritage-univ.edu',
      estimatedCost: 35000,
      status: 'confirmed',
      capacity: 220,
      notes: 'Includes tiered seating for 220, green room wings, and central HVAC.',
      portfolioHighlight: 'Best acoustics in the college district.',
      alternativeVendorIds: ['vendor-venue-alt'],
    },
    {
      id: 'vendor-venue-alt',
      name: 'Symphony Convention Center & Open Lawn',
      category: 'venue',
      rating: 4.7,
      phone: '+91 98200 88990',
      email: 'events@symphonybanquet.in',
      estimatedCost: 42000,
      status: 'shortlisted',
      capacity: 350,
      notes: 'Higher capacity alternative in case guest list overflows 220 seats.',
      portfolioHighlight: 'Sprawling 500-seat amphitheater with weather canopy.',
      alternativeVendorIds: ['vendor-venue-1'],
    },
    {
      id: 'vendor-cater-1',
      name: 'Annapurna Banquets & Gourmet Catering',
      category: 'catering',
      rating: 4.8,
      phone: '+91 98450 33445',
      email: 'info@annapurnacaterers.com',
      estimatedCost: 70000,
      status: 'confirmed',
      capacity: 300,
      notes: 'Provides chafing dishes, copper serviceware, clean uniforms, and hygiene certification.',
      portfolioHighlight: 'Celebrated for fresh live counter chaat and Mughlai dum biryani.',
      alternativeVendorIds: ['vendor-cater-alt'],
    },
    {
      id: 'vendor-cater-alt',
      name: 'Royal Feast Hospitality Services',
      category: 'catering',
      rating: 4.6,
      phone: '+91 98765 44321',
      email: 'sales@royalfeastevents.in',
      estimatedCost: 65000,
      status: 'shortlisted',
      capacity: 400,
      notes: 'Express backup caterer with 24h rapid mobilization capability.',
      portfolioHighlight: 'Affordable high-volume banquet specialist.',
      alternativeVendorIds: ['vendor-cater-1'],
    },
    {
      id: 'vendor-decor-1',
      name: 'Prism Stagecraft & Illumination Labs',
      category: 'decoration',
      rating: 4.7,
      phone: '+91 98112 55667',
      email: 'hello@prismstage.design',
      estimatedCost: 32000,
      status: 'confirmed',
      notes: 'Specializes in college fest trussing, moving head lasers, and floral stage arcs.',
      portfolioHighlight: 'Engineered 14 university fest mainstages in the region.',
      alternativeVendorIds: ['vendor-decor-alt'],
    },
    {
      id: 'vendor-decor-alt',
      name: 'Aura Deco & Event Fabricators',
      category: 'decoration',
      rating: 4.5,
      phone: '+91 98223 77889',
      email: 'auradeco.fest@gmail.com',
      estimatedCost: 24000,
      status: 'shortlisted',
      notes: 'Economy decorative fabricator specializing in modular reusable backdrops.',
      portfolioHighlight: 'Budget-friendly eco-friendly cloth and geometric drapes.',
      alternativeVendorIds: ['vendor-decor-1'],
    },
    {
      id: 'vendor-photo-1',
      name: 'Lenscraft Cinema & Media Studio',
      category: 'photography',
      rating: 4.9,
      phone: '+91 98334 66778',
      email: 'contact@lenscraftstudio.com',
      estimatedCost: 24000,
      status: 'confirmed',
      notes: 'Delivers next-day 60s teaser reels for Instagram and raw 4K footage.',
      portfolioHighlight: 'Featured in Youth Media Awards 2025.',
      alternativeVendorIds: [],
    },
    {
      id: 'vendor-ent-1',
      name: 'BeatVibe Pro Audio & DJ Sound',
      category: 'entertainment',
      rating: 4.8,
      phone: '+91 98990 12345',
      email: 'bookings@beatvibe.live',
      estimatedCost: 18000,
      status: 'confirmed',
      notes: 'JBL VRX Line Array rig with Pioneer CDJ 3000 nexus deck.',
      portfolioHighlight: 'Resident festival DJ with 10k follower base.',
      alternativeVendorIds: [],
    },
    {
      id: 'vendor-trans-1',
      name: 'CityLink Fleet & Coach Logistics',
      category: 'transportation',
      rating: 4.6,
      phone: '+91 98661 22334',
      email: 'dispatch@citylinklogistics.in',
      estimatedCost: 6000,
      status: 'confirmed',
      notes: 'AC Tempo Traveler plus 1 executive sedan on standby.',
      portfolioHighlight: 'Zero-delay punctuality guarantee.',
      alternativeVendorIds: [],
    },
  ];

  // Run initial DAG calculation
  const scheduleResult = calculateSchedule(rawTasks, 30);

  const startDate = new Date().toISOString();
  const eventDateObj = new Date();
  eventDateObj.setDate(eventDateObj.getDate() + 30);
  const eventDate = eventDateObj.toISOString();

  return {
    id: 'event-college-fest-2026',
    name: 'College Annual Celebration 2026',
    type: 'college_festival',
    currency: '₹',
    totalBudget: 200000,
    guestCount: 200,
    eventDeadlineDays: 30,
    eventDate,
    startDate,
    location: 'Heritage University Main Auditorium, Pune',
    theme: 'Radiant Horizons — Honors & Cultural Fest',
    status: 'planning',
    categories,
    items,
    tasks: scheduleResult.tasks,
    vendors,
    simulationHistory: [],
  };
}

/**
 * Loads current event plan from local persistence or initializes the demonstration event
 */
export function getActiveEvent(): EventPlan {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.id && parsed.categories && parsed.items && parsed.tasks) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Could not read from localStorage, using demo event:', err);
    }
  }

  const sample = createSampleCollegeEvent();
  saveActiveEvent(sample);
  return sample;
}

/**
 * Saves current event plan to persistence
 */
export function saveActiveEvent(event: EventPlan): void {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(event));

      // Also update in all events catalog
      const allRaw = localStorage.getItem(ALL_EVENTS_KEY);
      let all: EventPlan[] = allRaw ? JSON.parse(allRaw) : [];
      const index = all.findIndex((e) => e.id === event.id);
      if (index >= 0) {
        all[index] = event;
      } else {
        all.push(event);
      }
      localStorage.setItem(ALL_EVENTS_KEY, JSON.stringify(all));
    } catch (err) {
      console.error('Failed to save event to localStorage:', err);
    }
  }
}

/**
 * Resets back to clean demo college event
 */
export function resetToDemoCollegeEvent(): EventPlan {
  const sample = createSampleCollegeEvent();
  saveActiveEvent(sample);
  return sample;
}

/**
 * Creates a new event with standard category allocations based on event type
 */
export function createNewEvent(params: {
  name: string;
  type: EventType;
  totalBudget: number;
  guestCount: number;
  eventDeadlineDays: number;
  location: string;
  theme?: string;
  currency?: string;
}): EventPlan {
  const currency = params.currency || '₹';
  const totalBudget = params.totalBudget;
  const guestCount = params.guestCount;
  const deadlineDays = params.eventDeadlineDays || 30;

  // Type-specific percentage allocation weights
  const weights: Record<EventType, Record<string, number>> = {
    college_festival: { venue: 0.22, catering: 0.35, decoration: 0.16, photography: 0.12, entertainment: 0.09, transportation: 0.03, miscellaneous: 0.03 },
    wedding: { venue: 0.3, catering: 0.32, decoration: 0.18, photography: 0.1, entertainment: 0.05, transportation: 0.03, miscellaneous: 0.02 },
    birthday: { venue: 0.25, catering: 0.38, decoration: 0.15, photography: 0.08, entertainment: 0.1, transportation: 0.02, miscellaneous: 0.02 },
    corporate: { venue: 0.35, catering: 0.3, decoration: 0.1, photography: 0.1, entertainment: 0.05, transportation: 0.05, miscellaneous: 0.05 },
    engagement: { venue: 0.32, catering: 0.35, decoration: 0.15, photography: 0.1, entertainment: 0.04, transportation: 0.02, miscellaneous: 0.02 },
    anniversary: { venue: 0.3, catering: 0.35, decoration: 0.15, photography: 0.1, entertainment: 0.05, transportation: 0.03, miscellaneous: 0.02 },
    graduation: { venue: 0.25, catering: 0.35, decoration: 0.15, photography: 0.12, entertainment: 0.08, transportation: 0.03, miscellaneous: 0.02 },
    private_party: { venue: 0.25, catering: 0.4, decoration: 0.12, photography: 0.08, entertainment: 0.1, transportation: 0.03, miscellaneous: 0.02 },
  };

  const w = weights[params.type] || weights.college_festival;

  const categories: CategoryAllocation[] = [
    {
      category: 'venue',
      label: 'Venue & Spaces',
      allocatedAmount: Math.round(totalBudget * w.venue),
      estimatedAmount: Math.round(totalBudget * w.venue),
      priority: 'high',
      color: '#8b5cf6',
      icon: 'Building2',
      description: 'Main event space, restrooms, and parking permits',
    },
    {
      category: 'catering',
      label: 'Catering & Beverages',
      allocatedAmount: Math.round(totalBudget * w.catering),
      estimatedAmount: Math.round(totalBudget * w.catering),
      priority: 'high',
      color: '#f97316',
      icon: 'Utensils',
      description: `Buffet catering for ${guestCount} attendees`,
    },
    {
      category: 'decoration',
      label: 'Decoration & Styling',
      allocatedAmount: Math.round(totalBudget * w.decoration),
      estimatedAmount: Math.round(totalBudget * w.decoration),
      priority: 'low',
      color: '#ec4899',
      icon: 'Sparkles',
      description: 'Backdrops, florals, table linens, and illumination',
    },
    {
      category: 'photography',
      label: 'Photography & Cinema',
      allocatedAmount: Math.round(totalBudget * w.photography),
      estimatedAmount: Math.round(totalBudget * w.photography),
      priority: 'medium',
      color: '#3b82f6',
      icon: 'Camera',
      description: 'Photo and video coverage with digital album',
    },
    {
      category: 'entertainment',
      label: 'Entertainment & Music',
      allocatedAmount: Math.round(totalBudget * w.entertainment),
      estimatedAmount: Math.round(totalBudget * w.entertainment),
      priority: 'medium',
      color: '#10b981',
      icon: 'Music',
      description: 'DJ, sound system, and performance coordination',
    },
    {
      category: 'transportation',
      label: 'Logistics & Travel',
      allocatedAmount: Math.round(totalBudget * w.transportation),
      estimatedAmount: Math.round(totalBudget * w.transportation),
      priority: 'low',
      color: '#06b6d4',
      icon: 'Truck',
      description: 'Guest transit and material transport',
    },
    {
      category: 'miscellaneous',
      label: 'Miscellaneous & Passes',
      allocatedAmount: Math.round(totalBudget * w.miscellaneous),
      estimatedAmount: Math.round(totalBudget * w.miscellaneous),
      priority: 'low',
      color: '#64748b',
      icon: 'Boxes',
      description: 'Stationery, printed collateral, and contingency',
    },
  ];

  // Create baseline items matching allocations
  const items: BudgetItem[] = categories.map((cat, idx) => ({
    id: `item-${cat.category}-${idx + 1}`,
    categoryId: cat.category,
    name: `${cat.label} Standard Package`,
    estimatedCost: cat.allocatedAmount,
    priority: cat.priority,
    isFlexible: cat.priority !== 'high',
    minViableCost: Math.round(cat.allocatedAmount * 0.5),
    costPerGuest: cat.category === 'catering' ? Math.round(cat.allocatedAmount / guestCount) : undefined,
  }));

  // Create baseline DAG tasks
  const rawTasks: Task[] = [
    {
      id: 'task-1-venue',
      name: 'Venue Selection & Booking',
      category: 'venue',
      durationDays: 3,
      dependencies: [],
      status: 'pending',
      priority: 'high',
      delayDays: 0,
      earlyStart: 0,
      earlyFinish: 3,
      lateStart: 0,
      lateFinish: 3,
      slack: 0,
      isCriticalPath: true,
      hasConflict: false,
    },
    {
      id: 'task-2-invitations',
      name: 'Invitations & Guest Announcements',
      category: 'invitations',
      durationDays: 4,
      dependencies: [],
      status: 'pending',
      priority: 'medium',
      delayDays: 0,
      earlyStart: 0,
      earlyFinish: 4,
      lateStart: 0,
      lateFinish: 4,
      slack: 0,
      isCriticalPath: false,
      hasConflict: false,
    },
    {
      id: 'task-3-catering',
      name: 'Catering Menu Tasting & Signoff',
      category: 'catering',
      durationDays: 4,
      dependencies: ['task-1-venue'],
      status: 'pending',
      priority: 'high',
      delayDays: 0,
      earlyStart: 3,
      earlyFinish: 7,
      lateStart: 3,
      lateFinish: 7,
      slack: 0,
      isCriticalPath: true,
      hasConflict: false,
    },
    {
      id: 'task-4-decor',
      name: 'Decor Theme Blueprint & Setup Plan',
      category: 'decoration',
      durationDays: 4,
      dependencies: ['task-1-venue'],
      status: 'pending',
      priority: 'low',
      delayDays: 0,
      earlyStart: 3,
      earlyFinish: 7,
      lateStart: 3,
      lateFinish: 7,
      slack: 0,
      isCriticalPath: false,
      hasConflict: false,
    },
    {
      id: 'task-5-final',
      name: 'Final Rehearsal & Setup Completion',
      category: 'logistics',
      durationDays: 2,
      dependencies: ['task-3-catering', 'task-4-decor'],
      status: 'pending',
      priority: 'high',
      delayDays: 0,
      earlyStart: 7,
      earlyFinish: 9,
      lateStart: deadlineDays - 2,
      lateFinish: deadlineDays,
      slack: deadlineDays - 9,
      isCriticalPath: false,
      hasConflict: false,
    },
  ];

  const schedule = calculateSchedule(rawTasks, deadlineDays);

  const startDate = new Date().toISOString();
  const eventDateObj = new Date();
  eventDateObj.setDate(eventDateObj.getDate() + deadlineDays);

  const newEvent: EventPlan = {
    id: `event-${Date.now()}`,
    name: params.name,
    type: params.type,
    currency,
    totalBudget,
    guestCount,
    eventDeadlineDays: deadlineDays,
    eventDate: eventDateObj.toISOString(),
    startDate,
    location: params.location,
    theme: params.theme || 'Celebration',
    status: 'planning',
    categories,
    items,
    tasks: schedule.tasks,
    vendors: [],
    simulationHistory: [],
  };

  saveActiveEvent(newEvent);
  return newEvent;
}
