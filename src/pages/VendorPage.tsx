import React, { useState } from 'react';
import {
  Store,
  Star,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle2,
  Users,
  Building2,
  DollarSign,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { EventPlan, Vendor, BudgetCategory } from '../types';

interface VendorPageProps {
  activeEvent: EventPlan;
  onUpdateEvent: (updated: EventPlan) => void;
  onSimulateVendorCancel: (vendorId: string) => void;
}

export const VendorPage: React.FC<VendorPageProps> = ({
  activeEvent,
  onUpdateEvent,
  onSimulateVendorCancel,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddingVendor, setIsAddingVendor] = useState(false);

  // New vendor form
  const [vendorName, setVendorName] = useState('');
  const [vendorCategory, setVendorCategory] = useState<BudgetCategory>('catering');
  const [vendorCost, setVendorCost] = useState(25000);
  const [vendorPhone, setVendorPhone] = useState('+91 98');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorNotes, setVendorNotes] = useState('');

  const filteredVendors = activeEvent.vendors.filter((v) => {
    if (selectedCategory === 'all') return true;
    return v.category === selectedCategory;
  });

  const handleSwapVendor = (currentVendorId: string, altVendorId: string) => {
    const current = activeEvent.vendors.find((v) => v.id === currentVendorId);
    const alt = activeEvent.vendors.find((v) => v.id === altVendorId);
    if (!current || !alt) return;

    const updatedVendors = activeEvent.vendors.map((v) => {
      if (v.id === currentVendorId) {
        return { ...v, status: 'shortlisted' as const };
      }
      if (v.id === altVendorId) {
        return { ...v, status: 'confirmed' as const };
      }
      return v;
    });

    onUpdateEvent({
      ...activeEvent,
      vendors: updatedVendors,
    });
  };

  const handleAddVendorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim()) return;

    const newVendor: Vendor = {
      id: `vendor-${Date.now()}`,
      name: vendorName.trim(),
      category: vendorCategory,
      rating: 4.8,
      phone: vendorPhone,
      email: vendorEmail || 'vendor@example.com',
      estimatedCost: vendorCost,
      status: 'shortlisted',
      notes: vendorNotes || 'Newly added vendor lead',
      portfolioHighlight: 'Verified licensed supplier',
      alternativeVendorIds: [],
    };

    onUpdateEvent({
      ...activeEvent,
      vendors: [...activeEvent.vendors, newVendor],
    });

    setVendorName('');
    setIsAddingVendor(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-stone-900 tracking-tight">
                Vendor Directory & SLA Management
              </h1>
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800">
                Sourced & Contracted
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Confirmed suppliers, contact credentials, live quotes, and automated backup replacement chains.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddingVendor(true)}
              className="flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 px-3.5 py-2 text-xs font-semibold text-stone-800 transition shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Vendor Lead</span>
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="mt-5 flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition ${
              selectedCategory === 'all'
                ? 'bg-purple-700 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All Categories ({activeEvent.vendors.length})
          </button>
          {activeEvent.categories.map((c) => (
            <button
              key={c.category}
              onClick={() => setSelectedCategory(c.category)}
              className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                selectedCategory === c.category
                  ? 'bg-purple-700 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Add Vendor Modal/Form */}
      {isAddingVendor && (
        <form
          onSubmit={handleAddVendorSubmit}
          className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5 shadow-sm space-y-4 animate-in fade-in text-xs"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900">
              Add New Vendor Lead
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingVendor(false)}
              className="text-stone-400 hover:text-stone-700 font-medium"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Vendor Name</label>
              <input
                type="text"
                required
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="e.g. Royal Stage Decors"
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-800"
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Category</label>
              <select
                value={vendorCategory}
                onChange={(e) => setVendorCategory(e.target.value as BudgetCategory)}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-800"
              >
                {activeEvent.categories.map((c) => (
                  <option key={c.category} value={c.category}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-semibold text-stone-700 block mb-1">
                Estimated Quote ({activeEvent.currency})
              </label>
              <input
                type="number"
                value={vendorCost}
                onChange={(e) => setVendorCost(parseInt(e.target.value) || 0)}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-800"
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Phone Number</label>
              <input
                type="text"
                value={vendorPhone}
                onChange={(e) => setVendorPhone(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-800"
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Email</label>
              <input
                type="email"
                value={vendorEmail}
                onChange={(e) => setVendorEmail(e.target.value)}
                placeholder="sales@vendor.com"
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-800"
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Notes</label>
              <input
                type="text"
                value={vendorNotes}
                onChange={(e) => setVendorNotes(e.target.value)}
                placeholder="Key equipment details..."
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-800"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingVendor(false)}
              className="rounded-xl border border-stone-300 bg-white px-4 py-2 font-semibold text-stone-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-purple-700 hover:bg-purple-800 px-4 py-2 font-bold text-white shadow-xs"
            >
              Save Vendor Lead
            </button>
          </div>
        </form>
      )}

      {/* Vendor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredVendors.map((vendor) => {
          const isConfirmed = vendor.status === 'confirmed';
          const isCancelled = vendor.status === 'cancelled';
          const altVendor = activeEvent.vendors.find((v) =>
            vendor.alternativeVendorIds.includes(v.id)
          );

          return (
            <div
              key={vendor.id}
              className={`rounded-2xl border p-5 flex flex-col justify-between transition shadow-xs ${
                isCancelled
                  ? 'border-rose-300 bg-rose-50/40 opacity-75'
                  : isConfirmed
                  ? 'border-stone-200 bg-white hover:border-purple-300'
                  : 'border-stone-200 bg-stone-50/60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-bold uppercase text-stone-700">
                    {vendor.category}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                      isCancelled
                        ? 'bg-rose-100 text-rose-800'
                        : isConfirmed
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {vendor.status}
                  </span>
                </div>

                <h3 className="mt-2 text-base font-bold text-stone-900">
                  {vendor.name}
                </h3>

                <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-500 font-semibold">
                  <Star className="h-3.5 w-3.5 fill-amber-400" />
                  <span>{vendor.rating} / 5.0</span>
                  <span className="text-stone-400">•</span>
                  <span className="text-stone-600 font-normal truncate">
                    {vendor.portfolioHighlight}
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-xs text-stone-600">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                    <span>{vendor.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                    <span className="truncate">{vendor.email}</span>
                  </div>
                </div>

                <p className="mt-3 text-xs text-stone-500 bg-stone-50 rounded-lg p-2.5 border border-stone-100 font-medium">
                  {vendor.notes}
                </p>
              </div>

              {/* Bottom Card Actions */}
              <div className="mt-4 pt-3 border-t border-stone-100">
                <div className="flex items-baseline justify-between mb-3">
                  <span className="text-xs text-stone-500">Contract Quote:</span>
                  <span className="text-base font-black text-stone-900">
                    {activeEvent.currency}{vendor.estimatedCost.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  {isConfirmed && !isCancelled && (
                    <button
                      onClick={() => onSimulateVendorCancel(vendor.id)}
                      className="flex-1 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 py-2 font-bold transition text-center"
                      title="Test how the DAG timeline & replacement buffer handle sudden cancellation"
                    >
                      Test Drop
                    </button>
                  )}

                  {altVendor && (
                    <button
                      onClick={() => handleSwapVendor(vendor.id, altVendor.id)}
                      className="flex-1 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 py-2 font-semibold transition text-center"
                    >
                      Swap to Backup
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
