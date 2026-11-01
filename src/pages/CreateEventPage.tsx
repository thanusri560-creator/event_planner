import React, { useState } from 'react';
import {
  Sparkles,
  Calendar,
  Users,
  Wallet,
  MapPin,
  PartyPopper,
  GraduationCap,
  Heart,
  Building,
  Cake,
  GlassWater,
  ArrowRight,
  Bot,
} from 'lucide-react';
import { EventType, PriorityLevel, EventPlan } from '../types';
import { createNewEvent } from '../logic/eventPlanner';

interface CreateEventPageProps {
  onEventCreated: (newEvent: EventPlan) => void;
  onCancel: () => void;
}

export const CreateEventPage: React.FC<CreateEventPageProps> = ({
  onEventCreated,
  onCancel,
}) => {
  const [eventType, setEventType] = useState<EventType>('college_festival');
  const [name, setName] = useState('College Annual Cultural Fest 2026');
  const [budget, setBudget] = useState<number>(200000);
  const [currency, setCurrency] = useState('₹');
  const [guestCount, setGuestCount] = useState<number>(200);
  const [daysHorizon, setDaysHorizon] = useState<number>(30);
  const [location, setLocation] = useState('University Campus Auditorium, Pune');
  const [theme, setTheme] = useState('Radiant Horizons');

  // AI Prompt Assistant
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[] | null>(null);

  const eventTypes: { type: EventType; label: string; icon: any; defaultBudget: number; defaultGuests: number }[] = [
    { type: 'college_festival', label: 'College Festival', icon: GraduationCap, defaultBudget: 200000, defaultGuests: 200 },
    { type: 'wedding', label: 'Wedding Celebration', icon: Heart, defaultBudget: 1500000, defaultGuests: 350 },
    { type: 'birthday', label: 'Birthday Party', icon: Cake, defaultBudget: 75000, defaultGuests: 60 },
    { type: 'corporate', label: 'Corporate Gala / Summit', icon: Building, defaultBudget: 500000, defaultGuests: 150 },
    { type: 'engagement', label: 'Engagement Ceremony', icon: Heart, defaultBudget: 350000, defaultGuests: 120 },
    { type: 'graduation', label: 'Graduation Party', icon: GraduationCap, defaultBudget: 120000, defaultGuests: 100 },
    { type: 'private_party', label: 'Private Celebration', icon: GlassWater, defaultBudget: 80000, defaultGuests: 50 },
  ];

  const handleSelectType = (selected: typeof eventTypes[0]) => {
    setEventType(selected.type);
    setBudget(selected.defaultBudget);
    setGuestCount(selected.defaultGuests);
    if (!name || name.includes('Cultural Fest')) {
      setName(`${selected.label} 2026`);
    }
  };

  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingAI(true);
    try {
      const res = await fetch('/api/ai/generate-event-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt: aiPrompt,
          eventType,
          budget,
          guestCount,
          daysUntilEvent: daysHorizon,
        }),
      });
      const data = await res.json();
      if (data.customRecommendations) {
        setAiSuggestions(data.customRecommendations);
      } else if (data.recommendations) {
        setAiSuggestions([data.recommendations]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEvent = createNewEvent({
      name: name.trim(),
      type: eventType,
      totalBudget: budget,
      guestCount,
      eventDeadlineDays: daysHorizon,
      location: location.trim(),
      theme: theme.trim(),
      currency,
    });
    onEventCreated(newEvent);
  };

  return (
    <div className="mx-auto max-w-4xl py-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">
          Create New Celebration Plan
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Configure interconnected constraints, guest scaling ratios, and budget priorities.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Celebration Type */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-3">
            1. Select Celebration Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {eventTypes.map((et) => {
              const Icon = et.icon;
              const isSelected = eventType === et.type;
              return (
                <button
                  type="button"
                  key={et.type}
                  onClick={() => handleSelectType(et)}
                  className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition ${
                    isSelected
                      ? 'border-purple-600 bg-purple-50/70 text-purple-900 shadow-sm ring-2 ring-purple-500'
                      : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl mb-2 ${
                      isSelected ? 'bg-purple-600 text-white' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold">{et.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Essential Details */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-1">
            2. Event Parameters & Horizon
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Event Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Annual Alumni Gala 2026"
                className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-stone-800 focus:outline-none focus:ring-1 focus:ring-purple-600 font-medium"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">Theme / Concept</label>
              <input
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="e.g. Celestial Gala / Vintage Botanical"
                className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-stone-800 font-medium"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">
                Target Guest Headcount
              </label>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-stone-400" />
                <input
                  type="number"
                  min="10"
                  max="5000"
                  required
                  value={guestCount}
                  onChange={(e) => setGuestCount(parseInt(e.target.value) || 10)}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-800 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">
                Planning Horizon (Days until Event)
              </label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-stone-400" />
                <input
                  type="number"
                  min="5"
                  max="365"
                  required
                  value={daysHorizon}
                  onChange={(e) => setDaysHorizon(parseInt(e.target.value) || 30)}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-800 font-bold"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-stone-700 block mb-1">
                Venue Location or Campus Space
              </label>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Grand Heritage Ballroom, Bangalore"
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-800 font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Total Budget Specification */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block mb-1">
            3. Financial Ceiling Specification
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-800 font-bold"
              >
                <option value="₹">₹ (INR - Indian Rupee)</option>
                <option value="$">$ (USD - US Dollar)</option>
                <option value="€">€ (EUR - Euro)</option>
                <option value="£">£ (GBP - British Pound)</option>
                <option value="AED">AED (UAE Dirham)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-stone-700 block mb-1">
                Total Budget Ceiling ({currency})
              </label>
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-stone-400" />
                <input
                  type="number"
                  min="5000"
                  step="5000"
                  required
                  value={budget}
                  onChange={(e) => setBudget(parseInt(e.target.value) || 10000)}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-base font-black text-stone-900"
                />
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                Estimated budget per guest: {currency}
                {Math.round(budget / Math.max(1, guestCount)).toLocaleString()} / attendee
              </p>
            </div>
          </div>
        </div>

        {/* Step 4: Natural Language AI Copilot Generator */}
        <div className="rounded-2xl border border-purple-200 bg-purple-50/40 p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-700" />
            <label className="text-xs font-bold uppercase tracking-wider text-purple-900">
              Optional: AI Celebration Brief
            </label>
          </div>
          <p className="text-xs text-stone-600">
            Tell Gemini about specific wishes, dietary restrictions, musical vibe, or stage preferences:
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. College fest with indie-rock band, high-energy lighting, and live street-food counters..."
              className="flex-1 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs text-stone-800"
            />
            <button
              type="button"
              onClick={handleGenerateWithAI}
              disabled={!aiPrompt.trim() || isGeneratingAI}
              className="rounded-xl bg-purple-700 hover:bg-purple-800 px-4 py-2 text-xs font-bold text-white transition disabled:opacity-50 shrink-0"
            >
              {isGeneratingAI ? 'Consulting Gemini...' : 'Analyze with AI'}
            </button>
          </div>

          {aiSuggestions && (
            <div className="mt-3 rounded-xl border border-purple-200 bg-white p-3 text-xs text-stone-700 space-y-1">
              <span className="font-bold text-purple-900 block">AI Strategic Recommendations:</span>
              {aiSuggestions.map((s, idx) => (
                <p key={idx} className="whitespace-pre-line leading-relaxed">• {s}</p>
              ))}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-700 to-rose-600 hover:from-purple-800 hover:to-rose-700 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-500/20 transition"
          >
            <span>Generate & Launch Event Plan</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
